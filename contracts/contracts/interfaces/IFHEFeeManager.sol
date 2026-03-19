// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

/// @title IFHEFeeManager
/// @notice Interface for the FHEFeeManager contract (compiled at 0.8.20).
///         Used by AssetFactory and AssetTreasury (0.8.17) to access encrypted fees.
interface IFHEFeeManager {
    function maxPlatformRevenueBps() external view returns (uint256);
    function maxMaintenanceReserveBps() external view returns (uint256);
    function maxExitFeeBps() external view returns (uint256);
    function grantFeeAccess(address who) external;
    function grantContractAccess(address contractAddr) external;
}
