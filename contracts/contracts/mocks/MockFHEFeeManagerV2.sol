// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

/// @notice MockFHEFeeManagerV2 — updated stub matching the new IFHEFeeManager interface.
///         Adds marketplace fee support and computeMarketplaceFeePlaintext.
contract MockFHEFeeManagerV2 {
    uint256 public platformRevenueBps;
    uint256 public maintenanceReserveBps;
    uint256 public exitFeeBps;
    uint256 public marketplaceFeeBps;

    uint256 public immutable maxPlatformRevenueBps;
    uint256 public immutable maxMaintenanceReserveBps;
    uint256 public immutable maxExitFeeBps;
    uint256 public immutable maxMarketplaceFeeBps;

    constructor(
        uint256 platformRevenueBps_,
        uint256 maintenanceReserveBps_,
        uint256 exitFeeBps_,
        uint256 marketplaceFeeBps_,
        uint256 maxPlatformRevenueBps_,
        uint256 maxMaintenanceReserveBps_,
        uint256 maxExitFeeBps_,
        uint256 maxMarketplaceFeeBps_
    ) {
        platformRevenueBps    = platformRevenueBps_;
        maintenanceReserveBps = maintenanceReserveBps_;
        exitFeeBps            = exitFeeBps_;
        marketplaceFeeBps     = marketplaceFeeBps_;
        maxPlatformRevenueBps    = maxPlatformRevenueBps_;
        maxMaintenanceReserveBps = maxMaintenanceReserveBps_;
        maxExitFeeBps            = maxExitFeeBps_;
        maxMarketplaceFeeBps     = maxMarketplaceFeeBps_;
    }

    function computePlatformCutPlaintext(uint256 grossAmount) external view returns (uint256) {
        return (grossAmount * platformRevenueBps) / 10_000;
    }

    function computeMaintenanceCutPlaintext(uint256 grossAmount) external view returns (uint256) {
        return (grossAmount * maintenanceReserveBps) / 10_000;
    }

    function computeExitFeePlaintext(uint256 grossAmount) external view returns (uint256) {
        return (grossAmount * exitFeeBps) / 10_000;
    }

    function computeMarketplaceFeePlaintext(uint256 grossAmount) external view returns (uint256) {
        return (grossAmount * marketplaceFeeBps) / 10_000;
    }

    function updatePlatformRevenueBps(uint256 newBps) external {
        platformRevenueBps = newBps;
    }

    function updateMarketplaceFeeBps(uint256 newBps) external {
        marketplaceFeeBps = newBps;
    }

    function updateExitFeeBps(uint256 newBps) external {
        exitFeeBps = newBps;
    }
}
