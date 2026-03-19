// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

import "./IAssetToken.sol";

interface IAssetFactory {
    struct DeployParams {
        string name;
        string symbol;
        string ipfsCID;
        string location;
        IAssetToken.AssetCategory category;
        string assetSubType;       // e.g. "solar farm", "residential flat"
        uint256 totalSupply;
        uint256 pricePerUnit;
        uint256 valuationUSD;
        address identityRegistry;  // 0x0 → use default
        // ── Energy-specific (pass 0/empty for non-energy assets) ──────────
        uint256 capacityKW;
        uint256 annualYieldMWh;
        string  ppaContractCID;
        uint256 ppaTermYears;
    }

    event AssetDeployed(
        address indexed token,
        address indexed owner,
        IAssetToken.AssetCategory category,
        string assetSubType,
        string ipfsCID,
        uint256 totalSupply,
        uint256 pricePerUnit
    );

    function deployAsset(
        DeployParams calldata p
    ) external returns (address tokenAddress);

    function getAllAssets() external view returns (address[] memory);
    function getAssetsByCategory(
        IAssetToken.AssetCategory category
    ) external view returns (address[] memory);
    function isRegisteredAsset(address token) external view returns (bool);
    function totalAssets() external view returns (uint256);
}
