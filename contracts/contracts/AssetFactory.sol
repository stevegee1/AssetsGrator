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
import "./RetailInvestorCap.sol";
import "./AssetGovernor.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";

/// @title AssetFactory
/// @notice Deploys a full ERC-3643 stack for each new asset.
contract AssetFactory is IAssetFactory, OwnableUpgradeable {
    using Clones for address;

    // ─── Implementation addresses ─────────────────────────────────────────────
    address public tokenImplementation;
    address public complianceImplementation;
    address public kycModuleImplementation;
    address public retailCapModuleImplementation;

    address public defaultIdentityRegistry;
    address public feeManager;

    // ─── Platform config ──────────────────────────────────────────────────────
    address public paymentToken;
    address public platformWallet;

    // ─── Default Governance config ────────────────────────────────────────────
    uint256 public votingDelay;
    uint256 public votingPeriod;
    uint256 public proposalThreshold;
    uint256 public quorumNumerator;

    // ─── Registry ─────────────────────────────────────────────────────────────
    address[] private _allAssets;
    mapping(address => bool)     private _isRegistered;
    mapping(IAssetToken.AssetCategory => address[]) private _byCategory;
    mapping(address => address)  public assetCompliance;
    mapping(address => address)  public assetTreasury;
    mapping(address => address)  public assetGovernor;
    mapping(address => address)  public assetTimelock;

    // ─── Events ───────────────────────────────────────────────────────────────
    event ImplementationsUpdated(
        address indexed tokenImpl,
        address indexed complianceImpl,
        address         kycModuleImpl,
        address         retailCapModuleImpl
    );
    event DefaultIdentityRegistrySet(address indexed identityRegistry);
    event AssetGovernanceDeployed(
        address indexed token,
        address indexed governor,
        address indexed timelock
    );

    // ─── Initializer ──────────────────────────────────────────────────────────

    function initialize(
        address tokenImpl_,
        address complianceImpl_,
        address kycModuleImpl_,
        address retailCapModuleImpl_,
        address defaultIdentityRegistry_,
        address feeManager_,
        address paymentToken_,
        address platformWallet_
    ) external initializer {
        __Ownable_init();

        tokenImplementation           = tokenImpl_;
        complianceImplementation      = complianceImpl_;
        kycModuleImplementation       = kycModuleImpl_;
        retailCapModuleImplementation = retailCapModuleImpl_;
        defaultIdentityRegistry       = defaultIdentityRegistry_;
        feeManager                    = feeManager_;
        paymentToken                  = paymentToken_;
        platformWallet                = platformWallet_;

        votingDelay                   = 1;
        votingPeriod                  = 50400; // ~7 days
        proposalThreshold             = 0;
        quorumNumerator               = 30;    // 30%

        emit ImplementationsUpdated(tokenImpl_, complianceImpl_, kycModuleImpl_, retailCapModuleImpl_);
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

        // KYC module — verifies investor identity on every transfer
        address kycModule = kycModuleImplementation.clone();
        ModularCompliance(compliance).addModule(kycModule);

        // RetailInvestorCap module — enforces FCA 150-person rule (Article 1(4)(b))
        address retailCapModule = retailCapModuleImplementation.clone();
        ModularCompliance(compliance).addModule(retailCapModule);

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

        AssetToken(token).initializeAsset(identityRegistry, compliance, meta);
    }

    function _deployTreasuryAndRegister(
        address token,
        address compliance,
        DeployParams calldata p
    ) internal {
        // We deploy AssetTreasury setting the factory (address(this)) as temporary owner,
        // so the factory can configure the governanceContract address before transferring
        // ownership to msg.sender.
        AssetTreasury treasury = new AssetTreasury(
            token,
            paymentToken,
            platformWallet,
            feeManager,
            address(this)
        );

        address[] memory emptyAddressArray = new address[](0);
        TimelockController timelock = new TimelockController(
            2 days,
            emptyAddressArray,
            emptyAddressArray,
            address(this)
        );

        AssetGovernor governor = new AssetGovernor(
            IVotes(token),
            timelock,
            votingDelay,
            votingPeriod,
            proposalThreshold,
            quorumNumerator
        );

        bytes32 proposerRole = keccak256("PROPOSER_ROLE");
        bytes32 cancellerRole = keccak256("CANCELLER_ROLE");
        bytes32 executorRole = keccak256("EXECUTOR_ROLE");
        bytes32 adminRole = keccak256("TIMELOCK_ADMIN_ROLE");

        timelock.grantRole(proposerRole, address(governor));
        timelock.grantRole(cancellerRole, address(governor));
        timelock.grantRole(executorRole, address(0));
        timelock.revokeRole(adminRole, address(this));

        AssetToken(token).addAgent(address(treasury));
        treasury.setGovernanceContract(address(timelock));

        // Transfer final ownerships
        treasury.transferOwnership(msg.sender);
        OwnableUpgradeable(token).transferOwnership(msg.sender);
        OwnableUpgradeable(compliance).transferOwnership(msg.sender);

        _allAssets.push(token);
        _isRegistered[token] = true;
        _byCategory[p.category].push(token);
        assetCompliance[token] = compliance;
        assetTreasury[token]   = address(treasury);
        assetGovernor[token]   = address(governor);
        assetTimelock[token]   = address(timelock);

        emit AssetDeployed(
            token,
            msg.sender,
            p.category,
            p.assetSubType,
            p.ipfsCID,
            p.totalSupply,
            p.pricePerUnit
        );

        emit AssetGovernanceDeployed(
            token,
            address(governor),
            address(timelock)
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
        address kycModuleImpl_,
        address retailCapModuleImpl_
    ) external onlyOwner {
        tokenImplementation           = tokenImpl_;
        complianceImplementation      = complianceImpl_;
        kycModuleImplementation       = kycModuleImpl_;
        retailCapModuleImplementation = retailCapModuleImpl_;
        emit ImplementationsUpdated(tokenImpl_, complianceImpl_, kycModuleImpl_, retailCapModuleImpl_);
    }

    function setDefaultIdentityRegistry(address registry) external onlyOwner {
        defaultIdentityRegistry = registry;
        emit DefaultIdentityRegistrySet(registry);
    }

    function setPlatformWallet(address wallet) external onlyOwner {
        require(wallet != address(0), "Factory: zero wallet");
        platformWallet = wallet;
    }

    function setFeeManager(address feeManager_) external onlyOwner {
        require(feeManager_ != address(0), "Factory: zero fee manager");
        feeManager = feeManager_;
    }

    function setGovernanceParams(
        uint256 votingDelay_,
        uint256 votingPeriod_,
        uint256 proposalThreshold_,
        uint256 quorumNumerator_
    ) external onlyOwner {
        votingDelay = votingDelay_;
        votingPeriod = votingPeriod_;
        proposalThreshold = proposalThreshold_;
        quorumNumerator = quorumNumerator_;
    }
}
