// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title AssetValuation
/// @notice Public on-chain valuation oracle for tokenised real-world assets.
///
/// Design rationale — why valuation is PUBLIC, not encrypted:
///   - The total value of an asset (e.g. "this property is appraised at £700,000")
///     is commercial information. It must be visible for investors to make decisions.
///   - Privacy should sit at the PORTFOLIO layer: each investor's individual balance
///     is encrypted in FHEPortfolioRegistry, so their personal net worth stays private.
///   - Public valuation × private balance / public supply = private net worth ✅
///
/// Total asset valuation is public — ConfidentialLoan uses plain uint256 maths for
/// collateral LTV checks, reducing gas and simplifying the trust model.
/// Only outstanding debt (euint64) stays encrypted in ConfidentialLoan.
contract AssetValuation is Ownable {

    // ── Asset record ──────────────────────────────────────────────────────────
    struct AssetRecord {
        uint256 valuationUSD;   // Latest appraisal (USD, 6 decimals — USDC-compatible)
        uint256 updatedAt;
        uint256 version;
        address updatedBy;
        bool    registered;
    }

    mapping(address => AssetRecord) private _assets;

    // ── Authorised valuators (appraisers / oracles) ───────────────────────────
    mapping(address => bool) public authorisedValuators;

    // ── Events ────────────────────────────────────────────────────────────────
    event AssetRegistered(address indexed asset, uint256 initialValuationUSD);
    event ValuationUpdated(address indexed asset, uint256 valuationUSD, uint256 version, address indexed updatedBy);
    event ValuatorAuthorised(address indexed valuator);
    event ValuatorRevoked(address indexed valuator);

    // ── Modifiers ─────────────────────────────────────────────────────────────
    modifier onlyValuator() {
        require(
            authorisedValuators[msg.sender] || msg.sender == owner(),
            "AssetValuation: not authorised valuator"
        );
        _;
    }

    // ── Valuator management ───────────────────────────────────────────────────

    function authoriseValuator(address valuator) external onlyOwner {
        require(valuator != address(0), "AssetValuation: zero address");
        authorisedValuators[valuator] = true;
        emit ValuatorAuthorised(valuator);
    }

    function revokeValuator(address valuator) external onlyOwner {
        authorisedValuators[valuator] = false;
        emit ValuatorRevoked(valuator);
    }

    // ── Register ──────────────────────────────────────────────────────────────

    /// @notice Register an asset with its initial public valuation.
    /// @param  asset              AssetToken (ERC-3643) contract address
    /// @param  initialValuationUSD Initial appraisal in USD (6 decimal places)
    function registerAsset(address asset, uint256 initialValuationUSD) external onlyOwner {
        require(asset != address(0),        "AssetValuation: zero asset");
        require(!_assets[asset].registered, "AssetValuation: already registered");
        require(initialValuationUSD > 0,    "AssetValuation: zero valuation");

        _assets[asset] = AssetRecord({
            valuationUSD: initialValuationUSD,
            updatedAt:    block.timestamp,
            version:      1,
            updatedBy:    msg.sender,
            registered:   true
        });

        emit AssetRegistered(asset, initialValuationUSD);
    }

    // ── Update ────────────────────────────────────────────────────────────────

    /// @notice Update the public valuation for a registered asset.
    function updateValuation(address asset, uint256 newValuationUSD) external onlyValuator {
        require(_assets[asset].registered, "AssetValuation: not registered");
        require(newValuationUSD > 0,       "AssetValuation: zero valuation");

        AssetRecord storage rec = _assets[asset];
        rec.valuationUSD = newValuationUSD;
        rec.updatedAt    = block.timestamp;
        rec.version     += 1;
        rec.updatedBy    = msg.sender;

        emit ValuationUpdated(asset, newValuationUSD, rec.version, msg.sender);
    }

    // ── Views (all public — this is the point) ────────────────────────────────

    function valuationUSD(address asset) external view returns (uint256) {
        require(_assets[asset].registered, "AssetValuation: not registered");
        return _assets[asset].valuationUSD;
    }

    /// @notice Timestamp of the last valuation update.
    ///         Used by ConfidentialLoan to enforce maxValuationAge (oracle staleness check).
    function updatedAt(address asset) external view returns (uint256) {
        require(_assets[asset].registered, "AssetValuation: not registered");
        return _assets[asset].updatedAt;
    }

    function isRegistered(address asset) external view returns (bool) {
        return _assets[asset].registered;
    }

    function getRecord(address asset) external view returns (AssetRecord memory) {
        require(_assets[asset].registered, "AssetValuation: not registered");
        return _assets[asset];
    }
}
