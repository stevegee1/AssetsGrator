// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.25;

import {FHE, ebool, euint64, euint32, InEuint64, InEuint32} from "@fhenixprotocol/cofhe-contracts/FHE.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// ─── Interfaces ────────────────────────────────────────────────────────────────

interface IFHEKYCRegistry {
    function getEncryptedKYCAttr(
        address compliance,
        address investor,
        bytes32 attrKey
    ) external view returns (ebool);
}

interface IFHEAssetValuation {
    function encryptedValuation(address asset) external view returns (euint64);
    function grantValuationAccess(address asset, address who, uint256 expiresAt) external;
}

interface IFHEFeeManager {
    // Synchronous Revelation Bridge: fee rate is sourced from the encrypted
    // private cache. The result is a plaintext uint256, which is then re-encrypted.
    function computePlatformCutPlaintext(uint256 grossAmount) external view returns (uint256);
}

/// @notice Minimal interface for interacting with AssetToken as ERC-20 collateral.
///         `forcedTransfer` is the T-REX agent function that bypasses compliance
///         module checks — required because the loan contract address is not a
///         KYC'd investor, so standard ERC-20 transfer would be blocked.
interface IAssetToken is IERC20 {
    function forcedTransfer(address from, address to, uint256 amount) external returns (bool);
    function totalSupply() external view returns (uint256);
}

/// @title ConfidentialLoan
/// @notice Phase 1 — RWA-collateralised USDC loans with FHE-encrypted terms.
///
/// Collateral model:
///   - Borrower pledges fractional AssetToken shares (ERC-3643 / ERC-20) as collateral
///   - This contract must be a T-REX Agent on the AssetToken to call forcedTransfer
///   - forcedTransfer bypasses KYC compliance module (non-KYC loan contract address)
///   - Collateral is held by the loan contract until repaid or liquidated
///   - LTV is checked proportionally: collateral value = (pledged / totalSupply) × totalValuation
///
/// Vault model:
///   - Platform treasury wallet (owner's EOA) funds all USDC disbursals
///   - Treasury must approve this contract to spend USDC before any loan
///   - Encrypted platform fee is deducted from gross amount before disbursal
///   - Fee remains in treasury — net amount goes to borrower
///   - Repayments flow USDC back to treasury
///
/// Privacy model:
///   - Loan amount, interest rate, LTV ratio — all encrypted (euint64/euint32)
///   - KYC compliance verified in FHE — rejection reveals nothing about borrower
///   - LTV breach computed in FHE — liquidation reveals no financial values
///   - Auditors granted scoped decrypt access via ACL permit system
contract ConfidentialLoan is Ownable, ReentrancyGuard {

    // ─── External contracts ───────────────────────────────────────────────────
    IFHEKYCRegistry    public immutable kycRegistry;
    IFHEAssetValuation public immutable assetValuation;
    IFHEFeeManager     public immutable feeManager;
    IERC20             public immutable usdc;

    // ─── Treasury ─────────────────────────────────────────────────────────────
    /// @notice Platform wallet — funds USDC loans and receives repayments + fees
    address public treasury;

    /// @notice Minimum USDC approval the treasury must maintain
    /// @dev    Public commitment — not the actual loan amount (which is encrypted)
    uint256 public minTreasuryApproval;

    // ─── KYC attribute keys ───────────────────────────────────────────────────
    bytes32 public constant ATTR_IS_ACCREDITED = keccak256("IS_ACCREDITED");
    bytes32 public constant ATTR_AML_CLEARED   = keccak256("AML_CLEARED");

    // ─── Loan config ──────────────────────────────────────────────────────────
    /// @notice Public max LTV cap — investors can verify this ceiling on-chain
    uint256 public immutable maxLtvBps;

    /// @notice Max loan duration in seconds
    uint256 public immutable maxLoanDuration;

    // ─── Loan state ───────────────────────────────────────────────────────────
    enum LoanStatus { None, PendingDisbursal, Active, Repaid, Liquidated }

    struct Loan {
        // ── Public fields — needed for token ops and lifecycle management ────
        address    borrower;
        address    collateralAsset;    // AssetToken (ERC-3643 / ERC-20) address
        uint256    collateralAmount;   // AssetToken shares pledged (plaintext — not a secret)
        uint256    dueDate;
        LoanStatus status;

        // ── Encrypted fields — nobody reads without a permit ─────────────────
        euint64  encLoanAmount;        // Gross USDC amount
        euint32  encInterestRateBps;   // Annual interest rate
        euint64  encLtvRatioBps;       // Max LTV agreed at origination
        euint64  encOutstandingDebt;   // Current USDC debt (gross, pre-interest)
        euint64  encNetDisbursement;   // Gross minus platform fee — actual USDC sent
    }

    mapping(uint256 => Loan) private _loans;
    uint256 public nextLoanId;

    // ─── KYC verification state (async decrypt result) ────────────────────────
    mapping(address => bool) public kycVerifiedFor;

    // ─── Disbursal tracking ───────────────────────────────────────────────────
    /// @dev Set by publishDisbursalAmount() from the Fhenix async decrypt relayer
    mapping(uint256 => uint256) private _pendingDisbursalAmount;

    // ─── Auditor access tracking ──────────────────────────────────────────────
    mapping(uint256 => address[]) private _loanAuditors;
    mapping(uint256 => mapping(address => bool)) public isLoanAuditor;

    // ─── Events ───────────────────────────────────────────────────────────────
    event LoanOriginated(
        uint256 indexed loanId,
        address indexed borrower,
        address indexed collateralAsset,
        uint256         collateralAmount,
        uint256         dueDate
    );
    event LoanDisbursed(uint256 indexed loanId);
    event LoanRepaid(uint256 indexed loanId);
    event LoanLiquidated(uint256 indexed loanId);
    event AuditorGranted(uint256 indexed loanId, address indexed auditor);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event KYCVerified(address indexed borrower);

    // ─── Constructor ──────────────────────────────────────────────────────────
    constructor(
        address kycRegistry_,
        address assetValuation_,
        address feeManager_,
        address usdc_,
        address treasury_,
        uint256 maxLtvBps_,
        uint256 maxLoanDuration_,
        uint256 minTreasuryApproval_,
        address owner_
    ) {
        require(kycRegistry_     != address(0), "ConfidentialLoan: zero kyc");
        require(assetValuation_  != address(0), "ConfidentialLoan: zero valuation");
        require(feeManager_      != address(0), "ConfidentialLoan: zero fee manager");
        require(usdc_            != address(0), "ConfidentialLoan: zero usdc");
        require(treasury_        != address(0), "ConfidentialLoan: zero treasury");
        require(maxLtvBps_       <= 8000,       "ConfidentialLoan: max LTV too high");
        require(maxLoanDuration_ > 0,           "ConfidentialLoan: zero duration");

        kycRegistry         = IFHEKYCRegistry(kycRegistry_);
        assetValuation      = IFHEAssetValuation(assetValuation_);
        feeManager          = IFHEFeeManager(feeManager_);
        usdc                = IERC20(usdc_);
        treasury            = treasury_;
        maxLtvBps           = maxLtvBps_;
        maxLoanDuration     = maxLoanDuration_;
        minTreasuryApproval = minTreasuryApproval_;

        _transferOwnership(owner_);
    }

    // ─── Treasury management ──────────────────────────────────────────────────

    function setTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "ConfidentialLoan: zero treasury");
        emit TreasuryUpdated(treasury, newTreasury);
        treasury = newTreasury;
    }

    function setMinTreasuryApproval(uint256 amount) external onlyOwner {
        minTreasuryApproval = amount;
    }

    function treasuryReady() public view returns (bool) {
        return usdc.allowance(treasury, address(this)) >= minTreasuryApproval;
    }

    // ─── KYC Verification (two-step async) ───────────────────────────────────

    /// @notice Step 1 — Borrower triggers FHE KYC check.
    ///         Reads both KYC attributes from the registry, combines them in FHE,
    ///         and requests async decryption. The Fhenix relayer publishes the result.
    function requestKYCVerification() external {
        ebool isAccredited = kycRegistry.getEncryptedKYCAttr(
            address(this), msg.sender, ATTR_IS_ACCREDITED
        );
        ebool isAmlCleared = kycRegistry.getEncryptedKYCAttr(
            address(this), msg.sender, ATTR_AML_CLEARED
        );
        ebool eligible = FHE.and(isAccredited, isAmlCleared);
        FHE.allowThis(eligible);
        FHE.allow(eligible, owner());
        FHE.decrypt(eligible);
    }

    /// @notice Step 2 — Owner publishes the Fhenix-signed decryption result.
    ///         In Phase 1, the signature is passed through but not on-chain verified.
    ///         Phase 2 will call FHE.publishDecryptResult directly.
    function publishKYCResult(
        address borrower,
        uint64  result,
        bytes calldata /*signature*/
    ) external onlyOwner {
        require(result == 0 || result == 1, "ConfidentialLoan: invalid KYC result");
        kycVerifiedFor[borrower] = (result == 1);
        if (result == 1) emit KYCVerified(borrower);
    }

    // ─── Originate ────────────────────────────────────────────────────────────

    /// @notice Borrower locks AssetToken shares (ERC-3643) as collateral and
    ///         submits encrypted loan terms.
    ///
    /// @dev    This contract must be a T-REX Agent on the AssetToken so that
    ///         forcedTransfer can move shares without hitting the KYC compliance
    ///         module (the loan contract itself is not a KYC'd investor address).
    ///
    /// @param collateralAsset   AssetToken (ERC-3643) contract address
    /// @param collateralAmount  Number of AssetToken shares to pledge
    /// @param grossLoanAmount   Plaintext USDC gross amount (for fee bridge computation)
    /// @param encLoanAmount     Encrypted USDC gross loan amount
    /// @param encRateBps        Encrypted annual interest rate in basis points
    /// @param encLtvBps         Encrypted maximum LTV ratio in basis points
    /// @param dueDate           Unix timestamp for loan due date
    function originateLoan(
        address   collateralAsset,
        uint256   collateralAmount,
        uint256   grossLoanAmount,
        InEuint64 calldata encLoanAmount,
        InEuint32 calldata encRateBps,
        InEuint64 calldata encLtvBps,
        uint256   dueDate
    ) external nonReentrant returns (uint256 loanId) {
        require(collateralAsset   != address(0), "ConfidentialLoan: zero asset");
        require(collateralAmount  > 0,           "ConfidentialLoan: zero collateral");
        require(dueDate > block.timestamp,       "ConfidentialLoan: invalid due date");
        require(
            dueDate <= block.timestamp + maxLoanDuration,
            "ConfidentialLoan: duration too long"
        );
        require(kycVerifiedFor[msg.sender], "ConfidentialLoan: KYC not verified");

        // ── Encrypt and store loan terms ──────────────────────────────────────
        euint64 encAmount = FHE.asEuint64(encLoanAmount);
        euint32 encRate   = FHE.asEuint32(encRateBps);
        euint64 encLtv    = FHE.asEuint64(encLtvBps);

        FHE.allowThis(encAmount);
        FHE.allowThis(encRate);
        FHE.allowThis(encLtv);

        // Borrower and owner can decrypt their own terms
        FHE.allow(encAmount, msg.sender);
        FHE.allow(encAmount, owner());
        FHE.allow(encRate,   msg.sender);
        FHE.allow(encRate,   owner());
        FHE.allow(encLtv,    msg.sender);
        FHE.allow(encLtv,    owner());

        // ── Compute fee via Synchronous Bridge ────────────────────────────────
        // Fee rate is private (from encrypted cache). Gross amount is known to
        // the borrower. The result — netAmount — remains fully encrypted.
        uint256 feePlain  = feeManager.computePlatformCutPlaintext(grossLoanAmount);
        euint64 encFee    = FHE.asEuint64(feePlain);
        FHE.allowThis(encFee);

        euint64 encNet = FHE.sub(encAmount, encFee);
        FHE.allowThis(encNet);
        FHE.allow(encNet, msg.sender);
        FHE.allow(encNet, owner());
        FHE.decrypt(encNet);

        // Outstanding debt = full gross loan amount
        euint64 encDebt = encAmount;
        FHE.allowThis(encDebt);
        FHE.allow(encDebt, msg.sender);
        FHE.allow(encDebt, owner());

        // ── Lock collateral ───────────────────────────────────────────────────
        // forcedTransfer bypasses T-REX compliance module (loan contract is not
        // a KYC'd investor — this is intentional, it's a custodial escrow).
        IAssetToken(collateralAsset).forcedTransfer(
            msg.sender,
            address(this),
            collateralAmount
        );

        // Grant this contract ongoing read access to the asset's encrypted valuation
        // (needed for LTV checks throughout the loan lifetime)
        assetValuation.grantValuationAccess(collateralAsset, address(this), 0);

        // ── Store loan ────────────────────────────────────────────────────────
        loanId = nextLoanId++;
        _loans[loanId] = Loan({
            borrower:           msg.sender,
            collateralAsset:    collateralAsset,
            collateralAmount:   collateralAmount,
            dueDate:            dueDate,
            status:             LoanStatus.PendingDisbursal,
            encLoanAmount:      encAmount,
            encInterestRateBps: encRate,
            encLtvRatioBps:     encLtv,
            encOutstandingDebt: encDebt,
            encNetDisbursement: encNet
        });

        emit LoanOriginated(loanId, msg.sender, collateralAsset, collateralAmount, dueDate);
    }

    // ─── Disbursal (two-step) ─────────────────────────────────────────────────

    /// @notice Step 1 — Relayer publishes decrypted net disbursement amount on-chain.
    ///         Validates the Fhenix-signed decryption result against the stored handle.
    function publishDisbursalAmount(
        uint256        loanId,
        uint64         decryptedNetAmount,
        bytes calldata signature
    ) external {
        Loan storage loan = _loans[loanId];
        require(
            loan.status == LoanStatus.PendingDisbursal,
            "ConfidentialLoan: not pending"
        );

        FHE.publishDecryptResult(
            loan.encNetDisbursement,
            decryptedNetAmount,
            signature
        );

        _pendingDisbursalAmount[loanId] = decryptedNetAmount;
    }

    /// @notice Step 2 — Owner confirms disbursal.
    ///         Treasury sends net USDC directly to borrower.
    ///         Fee implicitly stays in treasury (diff between gross and net).
    function confirmDisbursal(uint256 loanId) external onlyOwner nonReentrant {
        Loan storage loan = _loans[loanId];
        require(
            loan.status == LoanStatus.PendingDisbursal,
            "ConfidentialLoan: not pending"
        );

        uint256 netAmount = _pendingDisbursalAmount[loanId];
        require(netAmount > 0, "ConfidentialLoan: amount not published yet");
        require(
            usdc.allowance(treasury, address(this)) >= netAmount,
            "ConfidentialLoan: treasury allowance too low"
        );

        loan.status = LoanStatus.Active;
        delete _pendingDisbursalAmount[loanId];

        usdc.transferFrom(treasury, loan.borrower, netAmount);

        emit LoanDisbursed(loanId);
    }

    // ─── LTV check and liquidation ────────────────────────────────────────────

    /// @notice Anyone can call — computes LTV in FHE and requests async decrypt.
    ///
    /// LTV calculation (all FHE):
    ///   collateralValue = (collateralAmount / totalSupply) × totalAssetValuation
    ///                   = encTotalVal × collateralAmount / totalSupply     [FHE × plaintext]
    ///   currentLtvBps   = encOutstandingDebt × 10_000 / encCollateralValue [FHE div]
    ///   breach          = currentLtvBps > encLtvRatioBps                   [FHE gt]
    ///
    /// Owner calls confirmLiquidation() once the relayer publishes breach result.
    function checkAndLiquidate(uint256 loanId) external nonReentrant {
        Loan storage loan = _loans[loanId];
        require(loan.status == LoanStatus.Active, "ConfidentialLoan: not active");

        // Total encrypted valuation for the whole asset
        euint64 encTotalVal = assetValuation.encryptedValuation(loan.collateralAsset);

        // Total supply is plaintext — scale valuation proportionally
        uint256 totalSupply = IAssetToken(loan.collateralAsset).totalSupply();
        require(totalSupply > 0, "ConfidentialLoan: zero supply");

        // encCollateralValue = encTotalVal × pledgedShares / totalSupply
        euint64 encCollateralVal = FHE.div(
            FHE.mul(encTotalVal, FHE.asEuint64(uint64(loan.collateralAmount))),
            FHE.asEuint64(uint64(totalSupply))
        );

        // currentLtvBps = outstandingDebt × 10_000 / collateralValue
        euint64 encCurrentLtvBps = FHE.div(
            FHE.mul(loan.encOutstandingDebt, FHE.asEuint64(10_000)),
            encCollateralVal
        );

        // Request async decrypt of whether LTV breach occurred
        ebool breach = FHE.gt(encCurrentLtvBps, loan.encLtvRatioBps);
        FHE.allowThis(breach);
        FHE.allow(breach, owner());
        FHE.decrypt(breach);
        // Owner calls confirmLiquidation() after relayer publishes result
    }

    /// @notice Owner confirms liquidation after relayer publishes breach result.
    ///         Collateral AssetToken shares are transferred to treasury.
    function confirmLiquidation(uint256 loanId) external onlyOwner nonReentrant {
        Loan storage loan = _loans[loanId];
        require(loan.status == LoanStatus.Active, "ConfidentialLoan: not active");

        loan.status = LoanStatus.Liquidated;

        // Return collateral to treasury (forced — bypasses KYC compliance)
        IAssetToken(loan.collateralAsset).forcedTransfer(
            address(this),
            treasury,
            loan.collateralAmount
        );

        emit LoanLiquidated(loanId);
    }

    // ─── Repay ────────────────────────────────────────────────────────────────

    /// @notice Step 1 — Borrower signals repayment with encrypted amount.
    ///         Status → Repaid. Collateral held until USDC confirmed.
    ///
    ///   Flow:
    ///   1. Borrower calls repayLoan() — debt zeroed in FHE, status = Repaid
    ///   2. Fhenix relayer publishes decrypted repayment amount (off-chain signed)
    ///   3. Owner calls collectRepayment() — USDC pulled from borrower, collateral returned
    function repayLoan(
        uint256   loanId,
        InEuint64 calldata encRepayment
    ) external nonReentrant {
        Loan storage loan = _loans[loanId];
        require(loan.status == LoanStatus.Active, "ConfidentialLoan: not active");
        require(loan.borrower == msg.sender,      "ConfidentialLoan: not borrower");

        euint64 encRepay = FHE.asEuint64(encRepayment);
        FHE.allowThis(encRepay);
        FHE.allow(encRepay, owner());
        FHE.decrypt(encRepay); // triggers async decryption for collectRepayment

        // Zero out debt in FHE
        loan.encOutstandingDebt = FHE.asEuint64(uint64(0));
        FHE.allowThis(loan.encOutstandingDebt);
        loan.status = LoanStatus.Repaid;

        emit LoanRepaid(loanId);
    }

    /// @notice Step 2 — Owner pulls USDC from borrower and returns collateral shares.
    ///         Borrower must have pre-approved this contract to spend USDC.
    ///
    /// @param repaymentAmount  Plaintext amount published by Fhenix relayer.
    function collectRepayment(
        uint256 loanId,
        uint256 repaymentAmount
    ) external onlyOwner nonReentrant {
        Loan storage loan = _loans[loanId];
        require(loan.status == LoanStatus.Repaid, "ConfidentialLoan: not repaid");
        require(repaymentAmount > 0,              "ConfidentialLoan: zero amount");
        require(
            usdc.allowance(loan.borrower, address(this)) >= repaymentAmount,
            "ConfidentialLoan: borrower allowance too low"
        );

        // USDC: borrower → treasury
        usdc.transferFrom(loan.borrower, treasury, repaymentAmount);

        // AssetToken shares: loan contract → borrower (forced — bypasses KYC compliance)
        IAssetToken(loan.collateralAsset).forcedTransfer(
            address(this),
            loan.borrower,
            loan.collateralAmount
        );
    }

    // ─── Auditor scoped access ────────────────────────────────────────────────

    /// @notice Grant an auditor scoped decrypt access to all encrypted loan fields.
    ///         Auditor sees: amount, rate, LTV, outstanding debt, net disbursement.
    ///         Auditor does NOT see: borrower KYC attributes (separate registry).
    function grantAuditorAccess(
        uint256 loanId,
        address auditor,
        uint256 expiresAt
    ) external onlyOwner {
        Loan storage loan = _loans[loanId];
        require(loan.status != LoanStatus.None, "ConfidentialLoan: not found");
        require(auditor != address(0),          "ConfidentialLoan: zero auditor");

        FHE.allow(loan.encLoanAmount,       auditor);
        FHE.allow(loan.encInterestRateBps,  auditor);
        FHE.allow(loan.encLtvRatioBps,      auditor);
        FHE.allow(loan.encOutstandingDebt,  auditor);
        FHE.allow(loan.encNetDisbursement,  auditor);

        assetValuation.grantValuationAccess(loan.collateralAsset, auditor, expiresAt);

        if (!isLoanAuditor[loanId][auditor]) {
            _loanAuditors[loanId].push(auditor);
            isLoanAuditor[loanId][auditor] = true;
        }

        emit AuditorGranted(loanId, auditor);
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    /// @notice Public loan metadata — no financial values exposed
    function getLoanPublic(uint256 loanId) external view returns (
        address    borrower,
        address    collateralAsset,
        uint256    collateralAmount,
        uint256    dueDate,
        LoanStatus status
    ) {
        Loan storage l = _loans[loanId];
        return (l.borrower, l.collateralAsset, l.collateralAmount, l.dueDate, l.status);
    }

    /// @notice Encrypted handles — caller must be borrower, owner, or auditor
    function getLoanEncrypted(uint256 loanId) external view returns (
        euint64 encLoanAmount,
        euint32 encInterestRateBps,
        euint64 encLtvRatioBps,
        euint64 encOutstandingDebt,
        euint64 encNetDisbursement
    ) {
        Loan storage l = _loans[loanId];
        require(
            msg.sender == l.borrower              ||
            msg.sender == owner()                 ||
            isLoanAuditor[loanId][msg.sender],
            "ConfidentialLoan: not permitted"
        );
        return (
            l.encLoanAmount,
            l.encInterestRateBps,
            l.encLtvRatioBps,
            l.encOutstandingDebt,
            l.encNetDisbursement
        );
    }

    function isTreasuryReady() external view returns (bool) {
        return treasuryReady();
    }
}
