// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./AssetToken.sol";
import "./interfaces/IAssetToken.sol";
import "./AssetFactory.sol";

/// @title AssetRegistry
/// @notice Read-only on-chain index of all deployed assets.
///         Provides rich query views for frontends — filter by category,
///         status, get investor portfolio, platform TVL, etc.
///
///         Data is always read live from each AssetToken so it's always
///         up to date with the latest valuations and supply.
contract AssetRegistry is OwnableUpgradeable {

    AssetFactory public factory;

    // ─── Structs ──────────────────────────────────────────────────────────────

    struct AssetSummary {
        address tokenAddress;
        string  name;
        string  symbol;
        string  ipfsCID;
        string  location;
        IAssetToken.AssetCategory  category;
        string  assetSubType;
        IAssetToken.AssetStatus    status;
        uint256 totalSupply;
        uint256 circulatingSupply;
        uint256 availableUnits;
        uint256 pricePerUnit;
        uint256 valuationUSD;
        uint256 holderCount;
        uint256 createdAt;
        // ── Energy-specific (0 for non-energy assets) ─────────────────────
        uint256 capacityKW;
        uint256 annualYieldMWh;
    }

    struct InvestorHolding {
        address tokenAddress;
        string  assetName;
        string  ipfsCID;
        IAssetToken.AssetCategory category;
        string  assetSubType;
        uint256 balance;
        uint256 units;
        uint256 ownershipBPS;
        uint256 valueUSD;
    }

    // ─── Initializer ──────────────────────────────────────────────────────────

    function initialize(address factory_) external initializer {
        __Ownable_init();
        factory = AssetFactory(factory_);
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    /// @notice Get summary of all assets on the platform
    function getAllAssetSummaries() external view returns (AssetSummary[] memory) {
        address[] memory tokens = factory.getAllAssets();
        return _buildSummaries(tokens);
    }

    /// @notice Get assets filtered by category
    function getAssetsByCategory(
        IAssetToken.AssetCategory category
    ) external view returns (AssetSummary[] memory) {
        address[] memory tokens = factory.getAssetsByCategory(category);
        return _buildSummaries(tokens);
    }

    /// @notice Get active assets only
    function getActiveAssets() external view returns (AssetSummary[] memory) {
        address[] memory all = factory.getAllAssets();
        uint256 count = 0;

        for (uint256 i = 0; i < all.length; i++) {
            if (AssetToken(all[i]).assetStatus() == IAssetToken.AssetStatus.ACTIVE) {
                count++;
            }
        }

        address[] memory active = new address[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < all.length; i++) {
            if (AssetToken(all[i]).assetStatus() == IAssetToken.AssetStatus.ACTIVE) {
                active[idx++] = all[i];
            }
        }

        return _buildSummaries(active);
    }

    /// @notice Get single asset summary
    function getAssetSummary(
        address token
    ) external view returns (AssetSummary memory) {
        require(factory.isRegisteredAsset(token), "Registry: unknown asset");
        return _buildSummary(token);
    }

    /// @notice Get all holdings for an investor across all assets
    function getInvestorPortfolio(
        address investor
    ) external view returns (InvestorHolding[] memory) {
        address[] memory all = factory.getAllAssets();

        uint256 count = 0;
        for (uint256 i = 0; i < all.length; i++) {
            if (IERC20(all[i]).balanceOf(investor) > 0) count++;
        }

        InvestorHolding[] memory holdings = new InvestorHolding[](count);
        uint256 idx = 0;

        for (uint256 i = 0; i < all.length; i++) {
            uint256 balance = IERC20(all[i]).balanceOf(investor);
            if (balance > 0) {
                AssetToken at = AssetToken(all[i]);
                IAssetToken.AssetMetadata memory meta = at.assetMetadata();

                holdings[idx++] = InvestorHolding({
                    tokenAddress: all[i],
                    assetName:    meta.name,
                    ipfsCID:      meta.ipfsCID,
                    category:     meta.category,
                    assetSubType: meta.assetSubType,
                    balance:      balance,
                    units:        balance / (10 ** 18),
                    ownershipBPS: at.ownershipBPS(investor),
                    valueUSD:     (balance / (10 ** 18)) * meta.pricePerUnit
                });
            }
        }

        return holdings;
    }

    /// @notice Total portfolio value of an investor in USD (18 decimals)
    function getInvestorTotalValueUSD(address investor) external view returns (uint256 total) {
        address[] memory all = factory.getAllAssets();
        for (uint256 i = 0; i < all.length; i++) {
            uint256 balance = IERC20(all[i]).balanceOf(investor);
            if (balance > 0) {
                uint256 unitPrice = AssetToken(all[i]).pricePerUnit();
                total += (balance / (10 ** 18)) * unitPrice;
            }
        }
    }

    /// @notice Total platform TVL in USD — returns 0 for assets with permit-gated valuation.
    ///         To see the full TVL: owner must call allowPublicValuation() on each asset first.
    function getPlatformTVL() external view returns (uint256 tvl) {
        address[] memory all = factory.getAllAssets();
        for (uint256 i = 0; i < all.length; i++) {
            // valuationUSD() returns 0 if FHE decryption result is not yet published
            tvl += AssetToken(all[i]).valuationUSD();
        }
    }

    /// @notice Total installed energy capacity across all RENEWABLE_ENERGY assets
    function getTotalEnergyCapacityKW() external view returns (uint256 totalKW) {
        address[] memory energyAssets = factory.getAssetsByCategory(
            IAssetToken.AssetCategory.RENEWABLE_ENERGY
        );
        for (uint256 i = 0; i < energyAssets.length; i++) {
            totalKW += AssetToken(energyAssets[i]).capacityKW();
        }
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    function _buildSummaries(
        address[] memory tokens
    ) internal view returns (AssetSummary[] memory summaries) {
        summaries = new AssetSummary[](tokens.length);
        for (uint256 i = 0; i < tokens.length; i++) {
            summaries[i] = _buildSummary(tokens[i]);
        }
    }

    function _buildSummary(
        address token
    ) internal view returns (AssetSummary memory s) {
        AssetToken at = AssetToken(token);
        IAssetToken.AssetMetadata memory meta = at.assetMetadata();

        uint256 supply    = at.totalSupply();
        uint256 available = at.availableUnits();

        s = AssetSummary({
            tokenAddress:      token,
            name:              meta.name,
            symbol:            meta.symbol,
            ipfsCID:           meta.ipfsCID,
            location:          meta.location,
            category:          meta.category,
            assetSubType:      meta.assetSubType,
            status:            at.assetStatus(),
            totalSupply:       supply / (10 ** 18),
            circulatingSupply: (supply - IERC20(token).balanceOf(at.owner())) / (10 ** 18),
            availableUnits:    available / (10 ** 18),
            pricePerUnit:      meta.pricePerUnit,
            valuationUSD:      meta.valuationUSD,
            holderCount:       0,
            createdAt:         meta.createdAt,
            capacityKW:        meta.capacityKW,
            annualYieldMWh:    meta.annualYieldMWh
        });
    }
}
