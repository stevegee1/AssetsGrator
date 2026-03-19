// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

/// @notice MockFHEAssetValuation — plaintext stub for local Hardhat testing.
///         Replaces FHEAssetValuation (0.8.25) with simple uint256 storage.
contract MockFHEAssetValuation {
    mapping(address => uint256) public valuations;
    mapping(address => bool)    public isRegistered;
    mapping(address => mapping(address => bool)) public hasAccess;

    event AssetRegistered(address indexed asset, uint256 initialValuation);
    event ValuationUpdated(address indexed asset, uint256 newValuation);

    function registerAsset(
        address asset,
        uint256 initialValuation,
        address assetOwner
    ) external {
        require(!isRegistered[asset], "already registered");
        valuations[asset]   = initialValuation;
        isRegistered[asset] = true;
        hasAccess[asset][assetOwner] = true;
        emit AssetRegistered(asset, initialValuation);
    }

    function updateValuation(address asset, uint256 newValuation) external {
        require(isRegistered[asset], "not registered");
        valuations[asset] = newValuation;
        emit ValuationUpdated(asset, newValuation);
    }

    function grantValuationAccess(address asset, address who, uint256 /*expiresAt*/) external {
        hasAccess[asset][who] = true;
    }

    function valuationUSD(address asset) external view returns (uint256) {
        return valuations[asset];
    }
}
