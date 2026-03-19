// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

/// @notice MockFHEFeeManager — plaintext stub for local Hardhat testing.
///         Replaces FHEFeeManager (0.8.25) with simple uint256 arithmetic.
///         Fee rates set in constructor as plaintext basis points.
contract MockFHEFeeManager {
    uint256 public platformRevenueBps;
    uint256 public maintenanceReserveBps;
    uint256 public exitFeeBps;

    uint256 public immutable maxPlatformRevenueBps;
    uint256 public immutable maxMaintenanceReserveBps;
    uint256 public immutable maxExitFeeBps;

    constructor(
        uint256 platformRevenueBps_,
        uint256 maintenanceReserveBps_,
        uint256 exitFeeBps_,
        uint256 maxPlatformRevenueBps_,
        uint256 maxMaintenanceReserveBps_,
        uint256 maxExitFeeBps_
    ) {
        require(maxPlatformRevenueBps_ + maxMaintenanceReserveBps_ <= 5_000, "combined > 50%");
        platformRevenueBps    = platformRevenueBps_;
        maintenanceReserveBps = maintenanceReserveBps_;
        exitFeeBps            = exitFeeBps_;
        maxPlatformRevenueBps    = maxPlatformRevenueBps_;
        maxMaintenanceReserveBps = maxMaintenanceReserveBps_;
        maxExitFeeBps            = maxExitFeeBps_;
    }

    /// @notice Returns plaintext platform cut (simulates encrypted FHE result)
    function computePlatformCutPlaintext(uint256 grossAmount) external view returns (uint256) {
        return (grossAmount * platformRevenueBps) / 10_000;
    }

    function computeMaintenanceCutPlaintext(uint256 grossAmount) external view returns (uint256) {
        return (grossAmount * maintenanceReserveBps) / 10_000;
    }

    function computeExitFeePlaintext(uint256 grossAmount) external view returns (uint256) {
        return (grossAmount * exitFeeBps) / 10_000;
    }

    function updatePlatformRevenueBps(uint256 newBps) external {
        platformRevenueBps = newBps;
    }

    function updateExitFeeBps(uint256 newBps) external {
        exitFeeBps = newBps;
    }
}
