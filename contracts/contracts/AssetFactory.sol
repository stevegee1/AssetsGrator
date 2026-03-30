// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

import "@tokenysolutions/t-rex/contracts/compliance/modular/ModularCompliance.sol";
import "@tokenysolutions/t-rex/contracts/registry/interface/IIdentityRegistry.sol";

import "./AssetToken.sol";
import "./AssetTreasury.sol";
import "./interfaces/IAssetFactory.sol";
import "./interfaces/IAssetToken.sol";
import "./KYCComplianceModule.sol";

/// @title AssetFactory
/// @notice Deploys a full ERC-3643 stack for each new asset.
///
/// FHE Note: Actual fee rates are stored in plaintext here. A separate FHEFeeManager
///           contract (contracts/fhe/FHEFeeManager.sol) can be deployed alongside this
///           factory to provide encrypted fee storage and auditor permit access.
contract AssetFactory is IAssetFactory, OwnableUpgradeable {
    using Clones for address;

    // ─── Implementation addresses ─────────────────────────────────────────────
    address public tokenImplementation;
    address public complianceImplementation;
    address public kycModuleImplementation;

    address public defaultIdentityRegistry;
    address public fheFeeManager;
    address public portfolioRegistry;

    // ─── Platform config ──────────────────────────────────────────────────────
    address public usdc;
    address public platformWallet;

    // ─── Registry ─────────────────────────────────────────────────────────────
    address[] private _allAssets;
    mapping(address => bool)     private _isRegistered;
    mapping(IAssetToken.AssetCategory => address[]) private _byCategory;
    mapping(address => address)  public assetCompliance;
    mapping(address => address)  public assetTreasury;

    // ─── Events ───────────────────────────────────────────────────────────────
    event ImplementationsUpdated(address tokenImpl, address complianceImpl, address kycModuleImpl);
    event DefaultIdentityRegistrySet(address identityRegistry);

    // ─── Initializer ──────────────────────────────────────────────────────────

    function initialize(
        address tokenImpl_,
        address complianceImpl_,
        address kycModuleImpl_,
        address defaultIdentityRegistry_,
        address fheFeeManager_,
        address portfolioRegistry_,
        address usdc_,
        address platformWallet_
    ) external initializer {
        __Ownable_init();

        tokenImplementation      = tokenImpl_;
        complianceImplementation = complianceImpl_;
        kycModuleImplementation  = kycModuleImpl_;
        defaultIdentityRegistry  = defaultIdentityRegistry_;
        fheFeeManager            = fheFeeManager_;
        portfolioRegistry        = portfolioRegistry_;
        usdc                     = usdc_;
        platformWallet           = platformWallet_;

        emit ImplementationsUpdated(tokenImpl_, complianceImpl_, kycModuleImpl_);
        emit DefaultIdentityRegistrySet(defaultIdentityRegistry_);
    }

    // ─── Deploy ───────────────────────────────────────────────────────────────

    function deployAsset(
        DeployParams calldata p
    ) external override onlyOwner returns (address tokenAddress) {
        address identityRegistry = p.identityRegistry != address(0)
            ? p.identityRegistry
            : defaultIdentityRegistry;
        require(identityRegistry != address(0), "Factory: no identity registry");

        address compliance = complianceImplementation.clone();
        ModularCompliance(compliance).init();

        address token = tokenImplementation.clone();
        _initToken(token, identityRegistry, compliance, p);
        ModularCompliance(compliance).bindToken(token);

        address kycModule = kycModuleImplementation.clone();
        ModularCompliance(compliance).addModule(kycModule);

        _deployTreasuryAndRegister(token, compliance, p);

        return token;
    }

    function _initToken(
        address token,
        address identityRegistry,
        address compliance,
        DeployParams calldata p
    ) internal {
        IAssetToken.AssetMetadata memory meta;
        meta.name          = p.name;
        meta.symbol        = p.symbol;
        meta.ipfsCID       = p.ipfsCID;
        meta.location      = p.location;
        meta.category      = p.category;
        meta.assetSubType  = p.assetSubType;
        meta.totalSupply   = p.totalSupply;
        meta.pricePerUnit  = p.pricePerUnit;
        meta.valuationUSD  = p.valuationUSD;
        meta.capacityKW    = p.capacityKW;
        meta.annualYieldMWh = p.annualYieldMWh;
        meta.ppaContractCID = p.ppaContractCID;
        meta.ppaTermYears  = p.ppaTermYears;

        AssetToken(token).initializeAsset(identityRegistry, compliance, portfolioRegistry, meta);
    }

    function _deployTreasuryAndRegister(
        address token,
        address compliance,
        DeployParams calldata p
    ) internal {
        AssetTreasury treasury = new AssetTreasury(
            token,
            usdc,
            platformWallet,
            fheFeeManager,
            msg.sender
        );

        AssetToken(token).addAgent(address(treasury));
        OwnableUpgradeable(token).transferOwnership(msg.sender);
        OwnableUpgradeable(compliance).transferOwnership(msg.sender);

        _allAssets.push(token);
        _isRegistered[token] = true;
        _byCategory[p.category].push(token);
        assetCompliance[token] = compliance;
        assetTreasury[token]   = address(treasury);

        emit AssetDeployed(
            token,
            msg.sender,
            p.category,
            p.assetSubType,
            p.ipfsCID,
            p.totalSupply,
            p.pricePerUnit
        );
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    function getAllAssets() external view override returns (address[] memory) {
        return _allAssets;
    }

    function getAssetsByCategory(
        IAssetToken.AssetCategory category
    ) external view override returns (address[] memory) {
        return _byCategory[category];
    }

    function isRegisteredAsset(address token) external view override returns (bool) {
        return _isRegistered[token];
    }

    function totalAssets() external view override returns (uint256) {
        return _allAssets.length;
    }

    function getTreasury(address token) external view returns (address) {
        return assetTreasury[token];
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    function setImplementations(
        address tokenImpl_,
        address complianceImpl_,
        address kycModuleImpl_
    ) external onlyOwner {
        tokenImplementation      = tokenImpl_;
        complianceImplementation = complianceImpl_;
        kycModuleImplementation  = kycModuleImpl_;
        emit ImplementationsUpdated(tokenImpl_, complianceImpl_, kycModuleImpl_);
    }

    function setDefaultIdentityRegistry(address registry) external onlyOwner {
        defaultIdentityRegistry = registry;
        emit DefaultIdentityRegistrySet(registry);
    }

    function setPlatformWallet(address wallet) external onlyOwner {
        require(wallet != address(0), "Factory: zero wallet");
        platformWallet = wallet;
    }
}
