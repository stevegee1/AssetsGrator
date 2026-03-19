// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

/// @title IFHEAssetValuation
/// @notice Interface for the FHEAssetValuation contract (compiled at 0.8.20).
///         Used by AssetToken (0.8.17) to interact with the FHE valuation layer.
interface IFHEAssetValuation {
    function registerAsset(address asset, uint256 initialValuation, address assetOwner) external;
    function updateValuation(address asset, uint256 newValuation) external;
    function grantValuationAccess(address asset, address who) external;
    function allowPublicValuation(address asset) external;
    function valuationUSD(address asset) external view returns (uint256);
    function isRegistered(address asset) external view returns (bool);
}
