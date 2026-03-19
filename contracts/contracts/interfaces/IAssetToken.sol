// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

interface IAssetToken {
    // ── Asset lifecycle status ────────────────────────────────────────────────
    enum AssetStatus {
        PENDING,
        ACTIVE,
        PAUSED,
        CLOSED
    }

    // ── Broad asset categories — any future asset fits without upgrade ─────
    enum AssetCategory {
        REAL_ESTATE,       // 0 — residential, commercial, industrial
        LAND,              // 1 — raw land, agricultural, development plots
        RENEWABLE_ENERGY,  // 2 — solar, wind, hydro, geothermal
        INFRASTRUCTURE,    // 3 — bridges, toll roads, data centres
        COMMODITIES,       // 4 — precious metals, agricultural goods
        OTHER              // 5 — catch-all for future asset classes
    }

    struct AssetMetadata {
        string name;
        string symbol;
        string ipfsCID;           // IPFS CID for documents, images, legal files
        string location;
        AssetCategory category;
        string assetSubType;      // free-text: "solar farm", "wind turbine", "residential flat"
        uint256 totalSupply;
        uint256 pricePerUnit;     // in payment token units (e.g. USDC 6 dec)
        uint256 valuationUSD;     // 18 decimals
        uint256 createdAt;
        // ── Energy-specific (0/empty for non-energy assets) ───────────────
        uint256 capacityKW;       // installed capacity in kilowatts
        uint256 annualYieldMWh;   // projected annual energy generation
        string  ppaContractCID;   // IPFS CID of Power Purchase Agreement
        uint256 ppaTermYears;     // PPA contract length (0 if N/A)
    }

    // ── Events ─────────────────────────────────────────────────────────────────
    event MetadataUpdated(string newCID);
    event ValuationUpdated(uint256 oldValuation, uint256 newValuation);
    event StatusChanged(AssetStatus oldStatus, AssetStatus newStatus);

    // ── Views ──────────────────────────────────────────────────────────────────
    function assetMetadata() external view returns (AssetMetadata memory);
    function assetStatus() external view returns (AssetStatus);
    function pricePerUnit() external view returns (uint256);
    function availableUnits() external view returns (uint256);

    // ── Admin ──────────────────────────────────────────────────────────────────
    function updateIPFSMetadata(string calldata newCID) external;
    function updateValuation(
        uint256 newValuationUSD,
        uint256 newPricePerUnit
    ) external;
    function setStatus(AssetStatus status) external;
}
