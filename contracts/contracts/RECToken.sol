// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/// @title RECToken (Renewable Energy Certificates)
/// @notice ERC-1155 multi-token representing verified renewable energy generation.
///         Each token ID represents a generation period (e.g., Q1-2026, Jan-2026).
///
///   Key differences from CarbonCreditToken:
///     - Carbon credits = CO₂ offset claims (tradable commodity)
///     - RECs = proof of renewable generation (compliance instrument)
///     - RECs are legally distinct and have their own regulatory markets
///
///   Token IDs encode generation periods:
///     - Format: YYYYMMDD (e.g., 20260101 = January 2026)
///     - Each amount unit = 1 MWh of verified renewable generation
contract RECToken is ERC1155, AccessControl, ReentrancyGuard {

    // ─── Roles ────────────────────────────────────────────────────────────────
    bytes32 public constant REC_ISSUER_ROLE = keccak256("REC_ISSUER_ROLE");

    // ─── State ────────────────────────────────────────────────────────────────

    struct RECMetadata {
        string  assetName;         // e.g. "Greenfield Solar Farm"
        address assetToken;        // linked AssetToken address
        string  sourceType;        // "solar", "wind", "hydro", "geothermal"
        string  gridRegion;        // e.g. "UK-REGO", "US-PJM"
        string  certificationBody; // e.g. "Ofgem", "ERCOT"
    }

    RECMetadata public recMetadata;

    /// @dev period ID => MWh generated for that period
    mapping(uint256 => uint256) public periodGeneration;

    /// @dev period ID => has been finalised (no more minting)
    mapping(uint256 => bool) public periodFinalised;

    /// @dev Total MWh retired across all periods
    uint256 public totalRetiredMWh;

    /// @dev account => period ID => MWh retired
    mapping(address => mapping(uint256 => uint256)) public retiredByPeriod;

    /// @dev account => total MWh retired
    mapping(address => uint256) public totalRetiredByAccount;

    // ─── Events ───────────────────────────────────────────────────────────────

    event RECsMinted(uint256 indexed periodId, address indexed to, uint256 mwh);
    event PeriodFinalised(uint256 indexed periodId, uint256 totalMWh);
    event RECsRetired(
        address indexed account,
        uint256 indexed periodId,
        uint256 mwh,
        string reason
    );

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(
        string memory uri_,
        string memory assetName_,
        address assetToken_,
        string memory sourceType_,
        string memory gridRegion_,
        string memory certificationBody_,
        address admin_
    ) ERC1155(uri_) {
        require(admin_ != address(0), "REC: zero admin");

        recMetadata = RECMetadata({
            assetName: assetName_,
            assetToken: assetToken_,
            sourceType: sourceType_,
            gridRegion: gridRegion_,
            certificationBody: certificationBody_
        });

        _grantRole(DEFAULT_ADMIN_ROLE, admin_);
        _grantRole(REC_ISSUER_ROLE, admin_);
    }

    // ─── Mint ─────────────────────────────────────────────────────────────────

    /// @notice Mint RECs for a generation period based on verified production
    /// @param to       Recipient (usually energy asset treasury)
    /// @param periodId Period identifier (YYYYMMDD format)
    /// @param mwh      MWh of verified renewable generation
    function mint(
        address to,
        uint256 periodId,
        uint256 mwh
    ) external onlyRole(REC_ISSUER_ROLE) {
        require(mwh > 0, "REC: zero mwh");
        require(!periodFinalised[periodId], "REC: period finalised");

        periodGeneration[periodId] += mwh;
        _mint(to, periodId, mwh, "");

        emit RECsMinted(periodId, to, mwh);
    }

    /// @notice Batch mint RECs for multiple periods
    function mintBatch(
        address to,
        uint256[] calldata periodIds,
        uint256[] calldata mwhAmounts
    ) external onlyRole(REC_ISSUER_ROLE) {
        require(periodIds.length == mwhAmounts.length, "REC: length mismatch");

        for (uint256 i = 0; i < periodIds.length; i++) {
            require(!periodFinalised[periodIds[i]], "REC: period finalised");
            periodGeneration[periodIds[i]] += mwhAmounts[i];
        }

        _mintBatch(to, periodIds, mwhAmounts, "");

        for (uint256 i = 0; i < periodIds.length; i++) {
            emit RECsMinted(periodIds[i], to, mwhAmounts[i]);
        }
    }

    /// @notice Finalise a period — no more RECs can be minted for it
    function finalisePeriod(uint256 periodId) external onlyRole(REC_ISSUER_ROLE) {
        require(!periodFinalised[periodId], "REC: already finalised");
        periodFinalised[periodId] = true;
        emit PeriodFinalised(periodId, periodGeneration[periodId]);
    }

    // ─── Retire ───────────────────────────────────────────────────────────────

    /// @notice Retire RECs for compliance (permanent consumption)
    /// @param periodId Period to retire from
    /// @param mwh      MWh to retire
    /// @param reason   Purpose (e.g. "2026 REGO compliance")
    function retire(
        uint256 periodId,
        uint256 mwh,
        string calldata reason
    ) external nonReentrant {
        require(mwh > 0, "REC: zero mwh");
        require(balanceOf(msg.sender, periodId) >= mwh, "REC: insufficient balance");

        _burn(msg.sender, periodId, mwh);

        totalRetiredMWh += mwh;
        retiredByPeriod[msg.sender][periodId] += mwh;
        totalRetiredByAccount[msg.sender] += mwh;

        emit RECsRetired(msg.sender, periodId, mwh, reason);
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    function getPeriodGeneration(uint256 periodId) external view returns (uint256) {
        return periodGeneration[periodId];
    }

    function isPeriodFinalised(uint256 periodId) external view returns (bool) {
        return periodFinalised[periodId];
    }

    // ─── Required overrides ──────────────────────────────────────────────────

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
