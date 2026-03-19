// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./AssetToken.sol";
import "./interfaces/IAssetToken.sol";

/// @title EnergyRevenueDistributor
/// @notice Distributes energy production revenue (PPAs, feed-in tariffs, spot sales)
///         proportionally to all token holders of a renewable energy asset.
///
/// Uses a cumulative dividend pattern (Synthetix-style "rewardPerToken") for
/// gas-efficient distribution — no loops over holders needed.
///
/// Flow:
///   1. Energy project operator sells electricity and receives USDC
///   2. Operator calls depositRevenue() with the USDC amount
///   3. Contract updates the global rewardPerToken accumulator
///   4. Each investor calls claimRevenue() to withdraw their share
///      (or it auto-accumulates until claimed)
///
/// Platform fee is deducted on deposit before distribution.
contract EnergyRevenueDistributor is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ─── State ────────────────────────────────────────────────────────────────

    IERC20 public immutable usdc;
    address public platformWallet;
    uint256 public platformFeeBps;

    uint256 public constant MAX_FEE_BPS = 3_000; // 30% cap

    /// @dev Per-token accumulator tracking
    struct RevenuePool {
        uint256 rewardPerTokenStored;  // cumulative USDC per 1e18 token (scaled by 1e18)
        uint256 totalDeposited;        // total gross USDC ever deposited
        uint256 totalDistributed;      // total net USDC distributed to holders
        uint256 lastDepositTime;       // timestamp of last deposit
    }

    /// @dev Per-investor tracking for a specific asset token
    struct InvestorReward {
        uint256 rewardPerTokenPaid;    // snapshot of rewardPerTokenStored at last claim
        uint256 pendingReward;         // accumulated but unclaimed USDC
    }

    /// @dev asset token address => revenue pool
    mapping(address => RevenuePool) public revenuePool;

    /// @dev asset token address => investor => reward state
    mapping(address => mapping(address => InvestorReward)) public investorRewards;

    /// @dev Registered asset tokens eligible for energy distribution
    mapping(address => bool) public registeredAssets;

    // ─── Events ───────────────────────────────────────────────────────────────

    event AssetRegistered(address indexed token);
    event AssetUnregistered(address indexed token);
    event RevenueDeposited(
        address indexed token,
        address indexed depositor,
        uint256 grossAmount,
        uint256 platformFee,
        uint256 netDistributed
    );
    event RevenueClaimed(
        address indexed token,
        address indexed investor,
        uint256 amount
    );

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(
        address usdc_,
        address platformWallet_,
        uint256 platformFeeBps_
    ) {
        require(usdc_ != address(0), "EnergyRev: zero usdc");
        require(platformWallet_ != address(0), "EnergyRev: zero platform wallet");
        require(platformFeeBps_ <= MAX_FEE_BPS, "EnergyRev: fee too high");

        usdc = IERC20(usdc_);
        platformWallet = platformWallet_;
        platformFeeBps = platformFeeBps_;
    }

    // ─── Admin: register energy assets ────────────────────────────────────────

    /// @notice Register an asset token for energy revenue distribution
    function registerAsset(address token) external onlyOwner {
        require(token != address(0), "EnergyRev: zero token");
        require(!registeredAssets[token], "EnergyRev: already registered");

        // Verify it's a RENEWABLE_ENERGY category asset
        AssetToken at = AssetToken(token);
        require(
            at.assetCategory() == IAssetToken.AssetCategory.RENEWABLE_ENERGY,
            "EnergyRev: not an energy asset"
        );

        registeredAssets[token] = true;
        emit AssetRegistered(token);
    }

    function unregisterAsset(address token) external onlyOwner {
        registeredAssets[token] = false;
        emit AssetUnregistered(token);
    }

    // ─── Deposit revenue ──────────────────────────────────────────────────────

    /// @notice Energy project operator deposits USDC revenue for distribution
    /// @param token       The energy AssetToken whose holders will receive revenue
    /// @param grossAmount Total USDC from energy sales (caller must approve first)
    function depositRevenue(
        address token,
        uint256 grossAmount
    ) external nonReentrant {
        require(registeredAssets[token], "EnergyRev: unregistered asset");
        require(grossAmount > 0, "EnergyRev: zero amount");

        uint256 totalSupply = IERC20(token).totalSupply();
        require(totalSupply > 0, "EnergyRev: no token supply");

        // Pull USDC from depositor
        usdc.safeTransferFrom(msg.sender, address(this), grossAmount);

        // Platform fee
        uint256 fee = (grossAmount * platformFeeBps) / 10_000;
        uint256 netAmount = grossAmount - fee;

        if (fee > 0) {
            usdc.safeTransfer(platformWallet, fee);
        }

        // Update cumulative reward accumulator
        // rewardPerToken += netAmount * 1e18 / totalSupply
        RevenuePool storage pool = revenuePool[token];
        pool.rewardPerTokenStored += (netAmount * 1e18) / totalSupply;
        pool.totalDeposited += grossAmount;
        pool.totalDistributed += netAmount;
        pool.lastDepositTime = block.timestamp;

        emit RevenueDeposited(token, msg.sender, grossAmount, fee, netAmount);
    }

    // ─── Claim revenue ────────────────────────────────────────────────────────

    /// @notice Investor claims accumulated energy revenue for a specific asset
    function claimRevenue(address token) external nonReentrant {
        uint256 reward = _updateAndGetReward(token, msg.sender);
        require(reward > 0, "EnergyRev: nothing to claim");

        usdc.safeTransfer(msg.sender, reward);

        emit RevenueClaimed(token, msg.sender, reward);
    }

    /// @notice Claim revenue from multiple energy assets in one transaction
    function claimRevenueMultiple(address[] calldata tokens) external nonReentrant {
        uint256 totalReward = 0;

        for (uint256 i = 0; i < tokens.length; i++) {
            uint256 reward = _updateAndGetReward(tokens[i], msg.sender);
            if (reward > 0) {
                totalReward += reward;
                emit RevenueClaimed(tokens[i], msg.sender, reward);
            }
        }

        require(totalReward > 0, "EnergyRev: nothing to claim");
        usdc.safeTransfer(msg.sender, totalReward);
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    /// @notice Get unclaimed revenue for an investor on a specific asset
    function getUnclaimedRevenue(
        address token,
        address investor
    ) external view returns (uint256) {
        RevenuePool storage pool = revenuePool[token];
        InvestorReward storage ir = investorRewards[token][investor];

        uint256 balance = IERC20(token).balanceOf(investor);
        uint256 earned = (balance * (pool.rewardPerTokenStored - ir.rewardPerTokenPaid)) / 1e18;

        return ir.pendingReward + earned;
    }

    /// @notice Get total unclaimed revenue across multiple assets
    function getTotalUnclaimedRevenue(
        address[] calldata tokens,
        address investor
    ) external view returns (uint256 total) {
        for (uint256 i = 0; i < tokens.length; i++) {
            RevenuePool storage pool = revenuePool[tokens[i]];
            InvestorReward storage ir = investorRewards[tokens[i]][investor];

            uint256 balance = IERC20(tokens[i]).balanceOf(investor);
            uint256 earned = (balance * (pool.rewardPerTokenStored - ir.rewardPerTokenPaid)) / 1e18;

            total += ir.pendingReward + earned;
        }
    }

    /// @notice Get revenue pool stats for a specific asset
    function getRevenuePoolStats(
        address token
    ) external view returns (
        uint256 totalDeposited,
        uint256 totalDistributed,
        uint256 rewardPerToken,
        uint256 lastDepositTime
    ) {
        RevenuePool storage pool = revenuePool[token];
        return (
            pool.totalDeposited,
            pool.totalDistributed,
            pool.rewardPerTokenStored,
            pool.lastDepositTime
        );
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    function setPlatformWallet(address wallet) external onlyOwner {
        require(wallet != address(0), "EnergyRev: zero address");
        platformWallet = wallet;
    }

    function setPlatformFeeBps(uint256 bps) external onlyOwner {
        require(bps <= MAX_FEE_BPS, "EnergyRev: fee too high");
        platformFeeBps = bps;
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    /// @dev Update investor's reward state and return claimable amount
    function _updateAndGetReward(
        address token,
        address investor
    ) internal returns (uint256) {
        RevenuePool storage pool = revenuePool[token];
        InvestorReward storage ir = investorRewards[token][investor];

        uint256 balance = IERC20(token).balanceOf(investor);
        uint256 earned = (balance * (pool.rewardPerTokenStored - ir.rewardPerTokenPaid)) / 1e18;

        uint256 reward = ir.pendingReward + earned;

        ir.rewardPerTokenPaid = pool.rewardPerTokenStored;
        ir.pendingReward = 0;

        return reward;
    }
}
