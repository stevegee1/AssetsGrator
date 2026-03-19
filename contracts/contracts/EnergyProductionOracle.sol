// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";

import "./AssetToken.sol";
import "./interfaces/IAssetToken.sol";

/// @title EnergyProductionOracle
/// @notice Bridges off-chain energy production data (IoT/SCADA) to on-chain.
///         Authorised reporters submit periodic production reports which are
///         stored immutably for transparent, trustless energy asset tracking.
///
/// Data flow:
///   1. IoT sensors / SCADA systems measure energy production
///   2. Authorised REPORTER submits data via reportProduction()
///   3. Data stored on-chain — viewable by anyone
///   4. EnergyRevenueDistributor + AssetGovernance can reference this data
///
/// Future: Can integrate with Chainlink for decentralised oracle reporting.
contract EnergyProductionOracle is AccessControl {

    // ─── Roles ────────────────────────────────────────────────────────────────
    bytes32 public constant REPORTER_ROLE = keccak256("REPORTER_ROLE");

    // ─── Types ────────────────────────────────────────────────────────────────

    struct ProductionReport {
        uint256 periodId;          // identifier (e.g. YYYYMMDD or epoch)
        uint256 mwhGenerated;      // MWh produced in this period
        uint256 revenueUSDC;       // USDC earned from energy sales this period
        uint256 capacityFactor;    // actual vs theoretical output (basis points, 10000 = 100%)
        uint256 timestamp;         // when the report was submitted
        address reporter;          // who submitted
        string  evidenceCID;       // IPFS CID of supporting evidence (meter data, invoices)
    }

    // ─── State ────────────────────────────────────────────────────────────────

    /// @dev asset token => list of production reports
    mapping(address => ProductionReport[]) private _reports;

    /// @dev asset token => period ID => report index (for O(1) lookup)
    mapping(address => mapping(uint256 => uint256)) private _reportIndex;

    /// @dev asset token => period ID => has been reported
    mapping(address => mapping(uint256 => bool)) public periodReported;

    /// @dev asset token => cumulative totals
    mapping(address => uint256) public totalMwhGenerated;
    mapping(address => uint256) public totalRevenueUSDC;

    /// @dev Registered energy asset tokens
    mapping(address => bool) public registeredAssets;

    // ─── Events ───────────────────────────────────────────────────────────────

    event AssetRegistered(address indexed token);
    event ProductionReported(
        address indexed token,
        uint256 indexed periodId,
        uint256 mwhGenerated,
        uint256 revenueUSDC,
        uint256 capacityFactor,
        address reporter
    );
    event ReportDisputed(
        address indexed token,
        uint256 indexed periodId,
        address indexed disputer,
        string reason
    );

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(address admin_) {
        require(admin_ != address(0), "Oracle: zero admin");
        _grantRole(DEFAULT_ADMIN_ROLE, admin_);
        _grantRole(REPORTER_ROLE, admin_);
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    /// @notice Register an energy asset for production tracking
    function registerAsset(address token) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(token != address(0), "Oracle: zero token");
        require(!registeredAssets[token], "Oracle: already registered");

        AssetToken at = AssetToken(token);
        require(
            at.assetCategory() == IAssetToken.AssetCategory.RENEWABLE_ENERGY,
            "Oracle: not an energy asset"
        );

        registeredAssets[token] = true;
        emit AssetRegistered(token);
    }

    // ─── Report production ────────────────────────────────────────────────────

    /// @notice Submit a production report for an energy asset
    /// @param token           The energy AssetToken
    /// @param periodId        Period identifier (e.g. 20260315)
    /// @param mwhGenerated    MWh produced during this period
    /// @param revenueUSDC     USDC earned from energy sales
    /// @param capacityFactor  Actual vs theoretical output (basis points)
    /// @param evidenceCID     IPFS CID of supporting meter data / invoices
    function reportProduction(
        address token,
        uint256 periodId,
        uint256 mwhGenerated,
        uint256 revenueUSDC,
        uint256 capacityFactor,
        string calldata evidenceCID
    ) external onlyRole(REPORTER_ROLE) {
        require(registeredAssets[token], "Oracle: unregistered asset");
        require(!periodReported[token][periodId], "Oracle: period already reported");
        require(capacityFactor <= 10_000, "Oracle: capacity factor > 100%");

        ProductionReport memory report = ProductionReport({
            periodId: periodId,
            mwhGenerated: mwhGenerated,
            revenueUSDC: revenueUSDC,
            capacityFactor: capacityFactor,
            timestamp: block.timestamp,
            reporter: msg.sender,
            evidenceCID: evidenceCID
        });

        _reportIndex[token][periodId] = _reports[token].length;
        _reports[token].push(report);
        periodReported[token][periodId] = true;

        totalMwhGenerated[token] += mwhGenerated;
        totalRevenueUSDC[token] += revenueUSDC;

        emit ProductionReported(
            token,
            periodId,
            mwhGenerated,
            revenueUSDC,
            capacityFactor,
            msg.sender
        );
    }

    /// @notice Flag a report for dispute (governance can act on this)
    function disputeReport(
        address token,
        uint256 periodId,
        string calldata reason
    ) external {
        require(periodReported[token][periodId], "Oracle: no report for period");
        emit ReportDisputed(token, periodId, msg.sender, reason);
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    /// @notice Get all production reports for an asset
    function getProductionHistory(
        address token
    ) external view returns (ProductionReport[] memory) {
        return _reports[token];
    }

    /// @notice Get a specific period's report
    function getReport(
        address token,
        uint256 periodId
    ) external view returns (ProductionReport memory) {
        require(periodReported[token][periodId], "Oracle: no report");
        return _reports[token][_reportIndex[token][periodId]];
    }

    /// @notice Get total reports count for an asset
    function getReportCount(address token) external view returns (uint256) {
        return _reports[token].length;
    }

    /// @notice Calculate average capacity factor across all periods
    function getAverageCapacityFactor(
        address token
    ) external view returns (uint256) {
        ProductionReport[] storage reports = _reports[token];
        if (reports.length == 0) return 0;

        uint256 total = 0;
        for (uint256 i = 0; i < reports.length; i++) {
            total += reports[i].capacityFactor;
        }
        return total / reports.length;
    }

    /// @notice Get latest production report
    function getLatestReport(
        address token
    ) external view returns (ProductionReport memory) {
        require(_reports[token].length > 0, "Oracle: no reports");
        return _reports[token][_reports[token].length - 1];
    }
}
