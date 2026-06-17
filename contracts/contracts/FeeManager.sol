// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IFeeManager.sol";

/// @title FeeManager
/// @notice Plaintext fee management for the AssetsGrator platform.
///
/// Stores configurable basis-point rates for four fee types:
///   - Platform revenue cut      (taken on revenue deposit)
///   - Maintenance reserve cut   (taken on revenue deposit, held in treasury)
///   - Exit fee                  (taken when investor redeems tokens for USDC)
///   - Marketplace commission    (taken on primary and secondary market trades)
///
/// All rates are stored and computed in plaintext (uint256). Hard caps are
/// enforced on deployment and on every rate update.
contract FeeManager is IFeeManager, Ownable {

    // ── Rates (in basis points, 1 BPS = 0.01%) ──────────────────────────────
    uint256 public platformRevenueBps;
    uint256 public maintenanceReserveBps;
    uint256 public exitFeeBps;
    uint256 public marketplaceFeeBps;

    // ── Hard caps ────────────────────────────────────────────────────────────
    uint256 public immutable maxPlatformRevenueBps;
    uint256 public immutable maxMaintenanceReserveBps;
    uint256 public immutable maxExitFeeBps;
    uint256 public immutable maxMarketplaceFeeBps;

    // ── Events ────────────────────────────────────────────────────────────────
    event PlatformRevenueUpdated(uint256 oldBps, uint256 newBps);
    event MaintenanceReserveUpdated(uint256 oldBps, uint256 newBps);
    event ExitFeeUpdated(uint256 oldBps, uint256 newBps);
    event MarketplaceFeeUpdated(uint256 oldBps, uint256 newBps);

    constructor(
        uint256 platformRevenueBps_,
        uint256 maintenanceReserveBps_,
        uint256 exitFeeBps_,
        uint256 marketplaceFeeBps_,
        uint256 maxPlatformRevenueBps_,
        uint256 maxMaintenanceReserveBps_,
        uint256 maxExitFeeBps_,
        uint256 maxMarketplaceFeeBps_,
        address owner_
    ) {
        require(platformRevenueBps_    <= maxPlatformRevenueBps_,    "FeeManager: platform rate exceeds cap");
        require(maintenanceReserveBps_ <= maxMaintenanceReserveBps_,  "FeeManager: maintenance rate exceeds cap");
        require(exitFeeBps_            <= maxExitFeeBps_,             "FeeManager: exit fee exceeds cap");
        require(marketplaceFeeBps_     <= maxMarketplaceFeeBps_,      "FeeManager: marketplace fee exceeds cap");
        require(maxPlatformRevenueBps_ <= 1_000,  "FeeManager: platform cap too high (10% max)");
        require(maxExitFeeBps_         <= 500,    "FeeManager: exit cap too high (5% max)");
        require(maxMarketplaceFeeBps_  <= 500,    "FeeManager: marketplace cap too high (5% max)");

        platformRevenueBps    = platformRevenueBps_;
        maintenanceReserveBps = maintenanceReserveBps_;
        exitFeeBps            = exitFeeBps_;
        marketplaceFeeBps     = marketplaceFeeBps_;

        maxPlatformRevenueBps    = maxPlatformRevenueBps_;
        maxMaintenanceReserveBps = maxMaintenanceReserveBps_;
        maxExitFeeBps            = maxExitFeeBps_;
        maxMarketplaceFeeBps     = maxMarketplaceFeeBps_;

        _transferOwnership(owner_);
    }

    // ── IFeeManager ───────────────────────────────────────────────────────────

    function computePlatformCutPlaintext(uint256 grossAmount) external view override returns (uint256) {
        return (grossAmount * platformRevenueBps) / 10_000;
    }

    function computeMaintenanceCutPlaintext(uint256 grossAmount) external view override returns (uint256) {
        return (grossAmount * maintenanceReserveBps) / 10_000;
    }

    function computeExitFeePlaintext(uint256 grossAmount) external view override returns (uint256) {
        return (grossAmount * exitFeeBps) / 10_000;
    }

    function computeMarketplaceFeePlaintext(uint256 grossAmount) external view override returns (uint256) {
        return (grossAmount * marketplaceFeeBps) / 10_000;
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    function updatePlatformRevenueBps(uint256 newBps) external onlyOwner {
        require(newBps <= maxPlatformRevenueBps, "FeeManager: exceeds cap");
        emit PlatformRevenueUpdated(platformRevenueBps, newBps);
        platformRevenueBps = newBps;
    }

    function updateMaintenanceReserveBps(uint256 newBps) external onlyOwner {
        require(newBps <= maxMaintenanceReserveBps, "FeeManager: exceeds cap");
        emit MaintenanceReserveUpdated(maintenanceReserveBps, newBps);
        maintenanceReserveBps = newBps;
    }

    function updateExitFeeBps(uint256 newBps) external onlyOwner {
        require(newBps <= maxExitFeeBps, "FeeManager: exceeds cap");
        emit ExitFeeUpdated(exitFeeBps, newBps);
        exitFeeBps = newBps;
    }

    function updateMarketplaceFeeBps(uint256 newBps) external onlyOwner {
        require(newBps <= maxMarketplaceFeeBps, "FeeManager: exceeds cap");
        emit MarketplaceFeeUpdated(marketplaceFeeBps, newBps);
        marketplaceFeeBps = newBps;
    }
}
