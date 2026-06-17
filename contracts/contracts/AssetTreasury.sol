// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "@tokenysolutions/t-rex/contracts/registry/interface/IIdentityRegistry.sol";
import "@tokenysolutions/t-rex/contracts/token/IToken.sol";

import "./AssetToken.sol";
import "./interfaces/IFeeManager.sol";

/// @title AssetTreasury
/// @notice Per-asset payment token vault. Handles revenue distribution, maintenance reserve,
///         and investor redemptions with plaintext fee rates.
contract AssetTreasury is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ─── Constants ────────────────────────────────────────────────────────────
    uint256 public constant MAX_FEE_BPS = 3_000;

    // ─── Immutables ───────────────────────────────────────────────────────────
    AssetToken public immutable assetToken;
    IERC20     public immutable paymentToken;
    address    public immutable feeManager;
    address public governanceContract;
    uint256 public maintenanceReserveBalance;
    uint256 public totalMaintenanceAllocated;
    uint256 public totalMaintenanceSpent;

    // ─── Mutable state ────────────────────────────────────────────────────────
    address public platformWallet;

    // ─── Events ───────────────────────────────────────────────────────────────
    event RevenueDistributed(uint256 platformCut, uint256 maintenanceCut, uint256 netYield);
    event TokensRedeemed(address indexed investor, uint256 netAmount);
    event MaintenanceSpent(address indexed to, uint256 amount, string reason);
    event PlatformWalletUpdated(address indexed oldWallet, address indexed newWallet);
    event GovernanceContractUpdated(address indexed oldGov, address indexed newGov);

    // ─── Modifiers ────────────────────────────────────────────────────────────
    modifier onlyGovernance() {
        require(msg.sender == governanceContract, "Treasury: caller is not governance");
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(
        address assetToken_,
        address paymentToken_,
        address platformWallet_,
        address feeManager_,
        address owner_
    ) {
        require(assetToken_   != address(0),   "Treasury: zero token");
        require(paymentToken_ != address(0),   "Treasury: zero payment token");
        require(platformWallet_ != address(0), "Treasury: zero wallet");
        require(feeManager_    != address(0),   "Treasury: zero fee manager");

        assetToken   = AssetToken(assetToken_);
        paymentToken = IERC20(paymentToken_);
        platformWallet = platformWallet_;
        feeManager   = feeManager_;

        _transferOwnership(owner_);
    }

    // ─── Revenue Distribution ─────────────────────────────────────────────────

    /// @notice Deposit revenue and split between platform, maintenance, and net yield
    function depositRevenue(uint256 grossAmount) external nonReentrant {
        require(grossAmount > 0, "Treasury: zero revenue");
        paymentToken.safeTransferFrom(msg.sender, address(this), grossAmount);

        IFeeManager fm      = IFeeManager(feeManager);
        uint256 platformCut    = fm.computePlatformCutPlaintext(grossAmount);
        uint256 maintenanceCut = fm.computeMaintenanceCutPlaintext(grossAmount);
        uint256 netYield       = grossAmount - platformCut - maintenanceCut;

        if (platformCut > 0) paymentToken.safeTransfer(platformWallet, platformCut);

        maintenanceReserveBalance += maintenanceCut;
        totalMaintenanceAllocated += maintenanceCut;

        uint256 newVal   = assetToken.valuationUSD() + netYield;
        uint256 supply   = assetToken.totalSupply();
        uint256 newPrice = supply > 0
            ? (newVal * 1e18) / supply
            : assetToken.pricePerUnit();
        assetToken.updateValuation(newVal, newPrice);

        emit RevenueDistributed(platformCut, maintenanceCut, netYield);
    }

    // ─── Maintenance Reserve ──────────────────────────────────────────────────

    function spendFromReserve(
        address to,
        uint256 amount,
        string calldata reason
    ) external onlyGovernance nonReentrant {
        require(to != address(0), "Treasury: zero recipient");
        require(amount > 0, "Treasury: zero amount");
        require(amount <= maintenanceReserveBalance, "Treasury: exceeds reserve");

        maintenanceReserveBalance -= amount;
        totalMaintenanceSpent += amount;
        paymentToken.safeTransfer(to, amount);
        emit MaintenanceSpent(to, amount, reason);
    }

    // ─── Investor Redemption ──────────────────────────────────────────────────

    /// @notice KYC-verified investor redeems fractional units for payment tokens
    function redeem(uint256 units) external nonReentrant {
        require(units > 0, "Treasury: zero units");

        IIdentityRegistry ir = IIdentityRegistry(
            IToken(address(assetToken)).identityRegistry()
        );
        require(ir.isVerified(msg.sender), "Treasury: investor not KYC verified");
        require(
            assetToken.assetStatus() == IAssetToken.AssetStatus.ACTIVE,
            "Treasury: asset not active"
        );

        uint256 pricePerUnit_ = assetToken.pricePerUnit();
        uint256 grossAmount   = (units * pricePerUnit_) / 1e12;

        uint256 fee = IFeeManager(feeManager).computeExitFeePlaintext(grossAmount);
        uint256 netAmount = grossAmount - fee;
        uint256 available = paymentToken.balanceOf(address(this)) - maintenanceReserveBalance;
        require(available >= grossAmount, "Treasury: insufficient balance");

        uint256 amount = units * (10 ** 18);
        IToken(address(assetToken)).transferFrom(msg.sender, address(this), amount);

        paymentToken.safeTransfer(msg.sender, netAmount);
        if (fee > 0) paymentToken.safeTransfer(platformWallet, fee);

        emit TokensRedeemed(msg.sender, netAmount);
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    function paymentTokenBalance() external view returns (uint256) {
        return paymentToken.balanceOf(address(this));
    }

    function availableForRedemption() external view returns (uint256) {
        uint256 total = paymentToken.balanceOf(address(this));
        return total > maintenanceReserveBalance ? total - maintenanceReserveBalance : 0;
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    function setPlatformWallet(address newWallet) external onlyOwner {
        require(newWallet != address(0), "Treasury: zero address");
        emit PlatformWalletUpdated(platformWallet, newWallet);
        platformWallet = newWallet;
    }

    function setGovernanceContract(address gov) external onlyOwner {
        emit GovernanceContractUpdated(governanceContract, gov);
        governanceContract = gov;
    }

    function manualUpdateValuation(
        uint256 newValuationUSD,
        uint256 newPricePerUnit
    ) external onlyOwner {
        assetToken.updateValuation(newValuationUSD, newPricePerUnit);
    }

    function emergencyWithdraw(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Treasury: zero address");
        uint256 available = paymentToken.balanceOf(address(this)) - maintenanceReserveBalance;
        require(amount <= available, "Treasury: cannot withdraw reserved funds");
        paymentToken.safeTransfer(to, amount);
    }
}
