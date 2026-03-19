// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/// @title CarbonCreditToken
/// @notice ERC-20 token representing verified carbon offsets.
///         1 token = 1 tonne CO₂ equivalent.
///
/// Features:
///   - Role-based minting (only verified CARBON_ISSUER can mint)
///   - Permanent retirement (burn) for ESG compliance reporting
///   - On-chain retirement ledger (immutable record of who retired how much)
///   - Linked to off-chain verification data (certification body, vintage year)
///
/// Lifecycle:
///   1. Renewable energy project generates verified carbon reductions
///   2. Certification body verifies and authorises minting
///   3. CARBON_ISSUER mints tokens to the project treasury
///   4. Tokens can be traded on secondary markets
///   5. Buyers retire tokens to claim the offset (permanent burn)
contract CarbonCreditToken is ERC20, AccessControl, ReentrancyGuard {

    // ─── Roles ────────────────────────────────────────────────────────────────
    bytes32 public constant CARBON_ISSUER_ROLE = keccak256("CARBON_ISSUER_ROLE");

    // ─── State ────────────────────────────────────────────────────────────────

    struct CreditMetadata {
        string  certificationBody;  // e.g. "Verra", "Gold Standard"
        string  projectId;          // external project identifier
        uint256 vintageYear;        // year the reduction occurred
        string  methodology;       // verification methodology
        string  documentCID;       // IPFS CID of certification docs
    }

    CreditMetadata public creditMetadata;

    /// @notice Total credits permanently retired (burned for ESG claims)
    uint256 public totalRetired;

    /// @dev account => tonnes CO₂ retired
    mapping(address => uint256) public retiredBalance;

    /// @dev account => array of retirement records
    mapping(address => RetirementRecord[]) private _retirementHistory;

    struct RetirementRecord {
        uint256 tonnes;
        uint256 timestamp;
        string  reason;        // e.g. "2026 annual ESG report"
    }

    // ─── Events ───────────────────────────────────────────────────────────────

    event CreditsMinted(address indexed to, uint256 tonnes);
    event CreditsRetired(
        address indexed account,
        uint256 tonnes,
        string reason,
        uint256 totalRetiredByAccount
    );
    event MetadataUpdated(string documentCID);

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(
        string memory name_,
        string memory symbol_,
        string memory certificationBody_,
        string memory projectId_,
        uint256 vintageYear_,
        string memory methodology_,
        string memory documentCID_,
        address admin_
    ) ERC20(name_, symbol_) {
        require(admin_ != address(0), "CarbonCredit: zero admin");

        creditMetadata = CreditMetadata({
            certificationBody: certificationBody_,
            projectId: projectId_,
            vintageYear: vintageYear_,
            methodology: methodology_,
            documentCID: documentCID_
        });

        _grantRole(DEFAULT_ADMIN_ROLE, admin_);
        _grantRole(CARBON_ISSUER_ROLE, admin_);
    }

    // ─── Mint (issuer only) ───────────────────────────────────────────────────

    /// @notice Mint verified carbon credits
    /// @param to     Recipient (usually project treasury)
    /// @param tonnes Number of tonnes CO₂ equivalent
    function mint(address to, uint256 tonnes) external onlyRole(CARBON_ISSUER_ROLE) {
        require(tonnes > 0, "CarbonCredit: zero tonnes");
        _mint(to, tonnes * 1e18); // 18 decimals, 1 token = 1 tonne
        emit CreditsMinted(to, tonnes);
    }

    // ─── Retire (permanent burn) ──────────────────────────────────────────────

    /// @notice Permanently retire carbon credits for ESG compliance
    /// @param tonnes Number of tonnes to retire
    /// @param reason Purpose of retirement (e.g. "2026 ESG report")
    function retire(uint256 tonnes, string calldata reason) external nonReentrant {
        require(tonnes > 0, "CarbonCredit: zero tonnes");
        uint256 amount = tonnes * 1e18;
        require(balanceOf(msg.sender) >= amount, "CarbonCredit: insufficient balance");

        _burn(msg.sender, amount);

        totalRetired += tonnes;
        retiredBalance[msg.sender] += tonnes;

        _retirementHistory[msg.sender].push(RetirementRecord({
            tonnes: tonnes,
            timestamp: block.timestamp,
            reason: reason
        }));

        emit CreditsRetired(msg.sender, tonnes, reason, retiredBalance[msg.sender]);
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    /// @notice Get retirement history for an account
    function getRetirementHistory(
        address account
    ) external view returns (RetirementRecord[] memory) {
        return _retirementHistory[account];
    }

    /// @notice Human-readable balance in tonnes (not raw 1e18 amounts)
    function balanceInTonnes(address account) external view returns (uint256) {
        return balanceOf(account) / 1e18;
    }

    /// @notice Total supply in tonnes
    function totalSupplyInTonnes() external view returns (uint256) {
        return totalSupply() / 1e18;
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    function updateDocumentCID(string calldata newCID) external onlyRole(DEFAULT_ADMIN_ROLE) {
        creditMetadata.documentCID = newCID;
        emit MetadataUpdated(newCID);
    }
}
