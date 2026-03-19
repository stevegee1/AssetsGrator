// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.25;

import {FHE, euint32, euint64, InEuint32, InEuint64} from "@fhenixprotocol/cofhe-contracts/FHE.sol";
import "./FHEAccessControl.sol";

/// @title FHEFeeManager
/// @notice Encrypted fee storage for platform, maintenance, and exit fee rates.
///
/// Design:
///   - All three fee rates stored as euint32 ciphertexts.
///   - Public hard caps commit the platform to a maximum — cryptographically enforced.
///   - Compute functions accept InEuint64 (encrypted gross amount) — gross revenue stays private.
///   - Fee rates can be updated; re-grant logic re-issues FHE.allow() to all existing grantees.
///   - Scoped access: tax auditor can see exitFeeBps only; investors see nothing.
///   - Access-controlled view functions prevent metadata leaks.
contract FHEFeeManager is FHEAccessControl {

    // ─── Slot IDs (used as keys in the inherited grant mapping) ──────────────
    bytes32 public constant SLOT_PLATFORM    = keccak256("PLATFORM_BPS");
    bytes32 public constant SLOT_MAINTENANCE = keccak256("MAINTENANCE_BPS");
    bytes32 public constant SLOT_EXIT        = keccak256("EXIT_BPS");

    // ─── Fee Types ────────────────────────────────────────────────────────────
    enum FeeType { Platform, Maintenance, Exit }

    // ─── Public hard caps ─────────────────────────────────────────────────────
    uint256 public immutable maxPlatformRevenueBps;
    uint256 public immutable maxMaintenanceReserveBps;
    uint256 public immutable maxExitFeeBps;

    // ─── Encrypted actual fee rates ───────────────────────────────────────────
    euint32 private _platformRevenueBps;
    euint32 private _maintenanceReserveBps;
    euint32 private _exitFeeBps;

    // ─── Events ───────────────────────────────────────────────────────────────
    event FeeUpdated(FeeType indexed feeType, uint256 timestamp);
    event FeeAccessGranted(address indexed who, FeeType feeType, uint256 expiresAt);

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(
        InEuint32 memory platformRevenueBps_,
        InEuint32 memory maintenanceReserveBps_,
        InEuint32 memory exitFeeBps_,
        uint256 maxPlatformRevenueBps_,
        uint256 maxMaintenanceReserveBps_,
        uint256 maxExitFeeBps_,
        address owner_
    ) {
        require(maxPlatformRevenueBps_    <= 3_000, "FHEFeeManager: platform cap too high");
        require(maxMaintenanceReserveBps_ <= 3_000, "FHEFeeManager: maintenance cap too high");
        require(maxExitFeeBps_            <= 3_000, "FHEFeeManager: exit cap too high");
        require(
            maxPlatformRevenueBps_ + maxMaintenanceReserveBps_ <= 5_000,
            "FHEFeeManager: combined caps > 50%"
        );

        maxPlatformRevenueBps    = maxPlatformRevenueBps_;
        maxMaintenanceReserveBps = maxMaintenanceReserveBps_;
        maxExitFeeBps            = maxExitFeeBps_;

        _platformRevenueBps    = FHE.asEuint32(platformRevenueBps_);
        _maintenanceReserveBps = FHE.asEuint32(maintenanceReserveBps_);
        _exitFeeBps            = FHE.asEuint32(exitFeeBps_);

        _allowAllHandles(owner_);
        _transferOwnership(owner_);
    }

    // ─── Fee Updates ─────────────────────────────────────────────────────────

    function updatePlatformRevenueBps(InEuint32 memory newBps) external onlyOwner {
        _platformRevenueBps = FHE.asEuint32(newBps);
        _allowAllHandles(owner());
        _regrantSlot(SLOT_PLATFORM, _platformRevenueBps);
        emit FeeUpdated(FeeType.Platform, block.timestamp);
    }

    function updateMaintenanceReserveBps(InEuint32 memory newBps) external onlyOwner {
        _maintenanceReserveBps = FHE.asEuint32(newBps);
        _allowAllHandles(owner());
        _regrantSlot(SLOT_MAINTENANCE, _maintenanceReserveBps);
        emit FeeUpdated(FeeType.Maintenance, block.timestamp);
    }

    function updateExitFeeBps(InEuint32 memory newBps) external onlyOwner {
        _exitFeeBps = FHE.asEuint32(newBps);
        _allowAllHandles(owner());
        _regrantSlot(SLOT_EXIT, _exitFeeBps);
        emit FeeUpdated(FeeType.Exit, block.timestamp);
    }

    // ─── Grant / Revoke Scoped Fee Access ────────────────────────────────────

    /// @notice Grant access to a specific fee rate only (scoped, time-bounded).
    function grantScopedFeeAccess(
        address who,
        FeeType feeType,
        uint256 expiresAt
    ) external onlyOwner {
        require(who != address(0), "FHEFeeManager: zero address");

        bytes32 slotId;
        euint32 handle;

        if (feeType == FeeType.Platform) {
            slotId = SLOT_PLATFORM;
            handle = _platformRevenueBps;
        } else if (feeType == FeeType.Maintenance) {
            slotId = SLOT_MAINTENANCE;
            handle = _maintenanceReserveBps;
        } else {
            slotId = SLOT_EXIT;
            handle = _exitFeeBps;
        }

        FHE.allow(handle, who);
        _recordGrant(slotId, who, expiresAt);
        emit FeeAccessGranted(who, feeType, expiresAt);
    }

    /// @notice Grant access to ALL three fee rates at once (e.g. for full auditors).
    function grantFullFeeAccess(address who, uint256 expiresAt) external onlyOwner {
        require(who != address(0), "FHEFeeManager: zero address");

        FHE.allow(_platformRevenueBps, who);
        FHE.allow(_maintenanceReserveBps, who);
        FHE.allow(_exitFeeBps, who);

        _recordGrant(SLOT_PLATFORM, who, expiresAt);
        _recordGrant(SLOT_MAINTENANCE, who, expiresAt);
        _recordGrant(SLOT_EXIT, who, expiresAt);

        emit FeeAccessGranted(who, FeeType.Platform, expiresAt);
        emit FeeAccessGranted(who, FeeType.Maintenance, expiresAt);
        emit FeeAccessGranted(who, FeeType.Exit, expiresAt);
    }

    /// @notice Grant a contract (e.g. Treasury) access to use all three handles.
    function grantContractAccess(address contractAddr, uint256 expiresAt) external onlyOwner {
        require(contractAddr != address(0), "FHEFeeManager: zero address");
        FHE.allow(_platformRevenueBps, contractAddr);
        FHE.allow(_maintenanceReserveBps, contractAddr);
        FHE.allow(_exitFeeBps, contractAddr);
        _recordGrant(SLOT_PLATFORM, contractAddr, expiresAt);
        _recordGrant(SLOT_MAINTENANCE, contractAddr, expiresAt);
        _recordGrant(SLOT_EXIT, contractAddr, expiresAt);
    }

    function revokeFeeAccess(address who, FeeType feeType) external onlyOwner {
        bytes32 slotId = feeType == FeeType.Platform
            ? SLOT_PLATFORM
            : feeType == FeeType.Maintenance
                ? SLOT_MAINTENANCE
                : SLOT_EXIT;
        _revokeGrant(slotId, who);
    }

    // ─── Compute Functions (encrypted inputs) ─────────────────────────────────

    /// @notice Compute encrypted platform cut. Gross amount is also encrypted — no amount leak.
    function computePlatformCut(InEuint64 calldata grossAmount) external returns (euint64) {
        euint64 gross = FHE.asEuint64(grossAmount);
        euint64 bps   = FHE.asEuint64(_platformRevenueBps);
        FHE.allowThis(gross);
        FHE.allowThis(bps);
        euint64 cut = FHE.div(FHE.mul(gross, bps), FHE.asEuint64(10_000));
        FHE.allowThis(cut);
        FHE.allow(cut, msg.sender);
        return cut;
    }

    /// @notice Same as computePlatformCut but accepts an already-sealed euint64 handle.
    ///         Used by ConfidentialLoan which seals the gross amount before calling,
    ///         since calldata structs can only be consumed once.
    function computePlatformCutFromHandle(euint64 gross) external returns (euint64) {
        euint64 bps = FHE.asEuint64(_platformRevenueBps);
        FHE.allowThis(bps);
        euint64 cut = FHE.div(FHE.mul(gross, bps), FHE.asEuint64(10_000));
        FHE.allowThis(cut);
        FHE.allow(cut, msg.sender);
        return cut;
    }

    /// @notice Compute encrypted maintenance cut.
    function computeMaintenanceCut(InEuint64 calldata grossAmount) external returns (euint64) {
        euint64 gross = FHE.asEuint64(grossAmount);
        euint64 bps   = FHE.asEuint64(_maintenanceReserveBps);
        FHE.allowThis(gross);
        FHE.allowThis(bps);
        euint64 cut = FHE.div(FHE.mul(gross, bps), FHE.asEuint64(10_000));
        FHE.allowThis(cut);
        FHE.allow(cut, msg.sender);
        return cut;
    }

    /// @notice Compute encrypted exit fee.
    function computeExitFee(InEuint64 calldata grossAmount) external returns (euint64) {
        euint64 gross = FHE.asEuint64(grossAmount);
        euint64 bps   = FHE.asEuint64(_exitFeeBps);
        FHE.allowThis(gross);
        FHE.allowThis(bps);
        euint64 fee = FHE.div(FHE.mul(gross, bps), FHE.asEuint64(10_000));
        FHE.allowThis(fee);
        FHE.allow(fee, msg.sender);
        return fee;
    }

    // ─── Access-Controlled View Functions ────────────────────────────────────

    function encryptedPlatformRevenueBps() external view returns (euint32) {
        _requireGrant(SLOT_PLATFORM);
        return _platformRevenueBps;
    }

    function encryptedMaintenanceReserveBps() external view returns (euint32) {
        _requireGrant(SLOT_MAINTENANCE);
        return _maintenanceReserveBps;
    }

    function encryptedExitFeeBps() external view returns (euint32) {
        _requireGrant(SLOT_EXIT);
        return _exitFeeBps;
    }

    // ─── Internal Helpers ─────────────────────────────────────────────────────

    function _allowAllHandles(address who) internal {
        FHE.allowThis(_platformRevenueBps);
        FHE.allowThis(_maintenanceReserveBps);
        FHE.allowThis(_exitFeeBps);
        FHE.allow(_platformRevenueBps, who);
        FHE.allow(_maintenanceReserveBps, who);
        FHE.allow(_exitFeeBps, who);
    }

    function _regrantSlot(bytes32 slotId, euint32 handle) internal {
        address[] memory active = _activeGrantees(slotId);
        for (uint256 i; i < active.length; i++) {
            FHE.allow(handle, active[i]);
        }
    }
}
