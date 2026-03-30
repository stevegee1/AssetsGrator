// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.25;

import {
    FHE,
    euint32,
    euint64,
    InEuint32,
    InEuint64
} from "@fhenixprotocol/cofhe-contracts/FHE.sol";
import "./FHEAccessControl.sol";
import "../interfaces/IFHEFeeManager.sol";

/// @title FHEFeeManager
/// @notice Encrypted fee storage for platform, maintenance, and exit fee rates.
contract FHEFeeManager is FHEAccessControl {
    // ─── Slot IDs ─────────────────────────────────────────────────────────────
    bytes32 public constant SLOT_PLATFORM    = keccak256("PLATFORM_BPS");
    bytes32 public constant SLOT_MAINTENANCE = keccak256("MAINTENANCE_BPS");
    bytes32 public constant SLOT_EXIT        = keccak256("EXIT_BPS");
    bytes32 public constant SLOT_MARKETPLACE = keccak256("MARKETPLACE_BPS");

    // ─── Fee Types ────────────────────────────────────────────────────────────
    enum FeeType {
        Platform,
        Maintenance,
        Exit,
        Marketplace
    }

    // ─── Public hard caps ─────────────────────────────────────────────────────
    uint256 public immutable maxPlatformRevenueBps;
    uint256 public immutable maxMaintenanceReserveBps;
    uint256 public immutable maxExitFeeBps;
    uint256 public immutable maxMarketplaceBps;

    // ─── Plaintext Cache (for synchronous protocol math) ─────────────────────
    uint32 private _pPlatformBps;
    uint32 private _pMaintenanceBps;
    uint32 private _pExitFeeBps;
    uint32 private _pMarketplaceBps;

    // ─── Encrypted actual fee rates ───────────────────────────────────────────
    euint32 private _platformRevenueBps;
    euint32 private _maintenanceReserveBps;
    euint32 private _exitFeeBps;
    euint32 private _marketplaceFeeBps;

    // ─── Events ───────────────────────────────────────────────────────────────
    event FeeUpdated(FeeType indexed feeType, uint256 timestamp);
    event FeeAccessGranted(address indexed who, FeeType feeType, uint256 expiresAt);
    event FeeRevealed(FeeType feeType, uint32 value);

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(
        InEuint32 memory platformRevenueBps_,
        InEuint32 memory maintenanceReserveBps_,
        InEuint32 memory exitFeeBps_,
        InEuint32 memory marketplaceFeeBps_,
        uint256 maxPlatformRevenueBps_,
        uint256 maxMaintenanceReserveBps_,
        uint256 maxExitFeeBps_,
        uint256 maxMarketplaceBps_,
        address owner_
    ) {
        require(maxPlatformRevenueBps_ <= 3_000, "FHEFeeManager: platform cap too high");
        require(maxMaintenanceReserveBps_ <= 3_000, "FHEFeeManager: maintenance cap too high");
        require(maxExitFeeBps_ <= 3_000, "FHEFeeManager: exit cap too high");
        require(maxMarketplaceBps_ <= 3_000, "FHEFeeManager: marketplace cap too high");
        require(
            maxPlatformRevenueBps_ + maxMaintenanceReserveBps_ <= 5_000,
            "FHEFeeManager: combined caps > 50%"
        );

        maxPlatformRevenueBps      = maxPlatformRevenueBps_;
        maxMaintenanceReserveBps   = maxMaintenanceReserveBps_;
        maxExitFeeBps              = maxExitFeeBps_;
        maxMarketplaceBps          = maxMarketplaceBps_;

        _platformRevenueBps    = FHE.asEuint32(platformRevenueBps_);
        _maintenanceReserveBps = FHE.asEuint32(maintenanceReserveBps_);
        _exitFeeBps            = FHE.asEuint32(exitFeeBps_);
        _marketplaceFeeBps     = FHE.asEuint32(marketplaceFeeBps_);

        FHE.allowThis(_platformRevenueBps);
        FHE.allowThis(_maintenanceReserveBps);
        FHE.allowThis(_exitFeeBps);
        FHE.allowThis(_marketplaceFeeBps);

        // Grant the owner decrypt access to all fee handles
        FHE.allow(_platformRevenueBps,    owner_);
        FHE.allow(_maintenanceReserveBps, owner_);
        FHE.allow(_exitFeeBps,            owner_);
        FHE.allow(_marketplaceFeeBps,     owner_);

        _transferOwnership(owner_);
    }

    // ─── Revelation Logic (Async to Sync Bridge) ──────────────────────────────

    /// @notice Step 1: Request decryption of the stored fee rates.
    function requestRevelation() external onlyOwner {
        FHE.decrypt(_platformRevenueBps);
        FHE.decrypt(_maintenanceReserveBps);
        FHE.decrypt(_exitFeeBps);
        FHE.decrypt(_marketplaceFeeBps);
    }

    /// @notice Step 2: Publish the result (called by relayer or admin).
    ///         Once published, the protocol can use these synchronously.
    function revealRate(FeeType feeType, uint32 value, bytes calldata signature) external onlyOwner {
        if (feeType == FeeType.Platform) {
            FHE.publishDecryptResult(_platformRevenueBps, value, signature);
            _pPlatformBps = value;
        } else if (feeType == FeeType.Maintenance) {
            FHE.publishDecryptResult(_maintenanceReserveBps, value, signature);
            _pMaintenanceBps = value;
        } else if (feeType == FeeType.Exit) {
            FHE.publishDecryptResult(_exitFeeBps, value, signature);
            _pExitFeeBps = value;
        } else if (feeType == FeeType.Marketplace) {
            FHE.publishDecryptResult(_marketplaceFeeBps, value, signature);
            _pMarketplaceBps = value;
        }
        emit FeeRevealed(feeType, value);
    }

    // ─── Synchronous Bridge Functions ─────────────────────────────────────────

    function computePlatformCutPlaintext(uint256 gross) external view returns (uint256) {
        return (gross * _pPlatformBps) / 10_000;
    }

    function computeMaintenanceCutPlaintext(uint256 gross) external view returns (uint256) {
        return (gross * _pMaintenanceBps) / 10_000;
    }

    function computeExitFeePlaintext(uint256 gross) external view returns (uint256) {
        return (gross * _pExitFeeBps) / 10_000;
    }

    function computeMarketplaceFeePlaintext(uint256 gross) external view returns (uint256) {
        return (gross * _pMarketplaceBps) / 10_000;
    }

    // ─── Fee Updates ─────────────────────────────────────────────────────────

    function updatePlatformRevenueBps(uint256 newBps) external onlyOwner {
        require(newBps <= maxPlatformRevenueBps, "FHEFeeManager: exceeds cap");
        _platformRevenueBps = FHE.asEuint32(newBps);
        FHE.allowThis(_platformRevenueBps);
        FHE.allow(_platformRevenueBps, owner());
        _pPlatformBps = uint32(newBps); // sync plaintext cache immediately
        _regrantSlot(SLOT_PLATFORM, _platformRevenueBps);
        emit FeeUpdated(FeeType.Platform, block.timestamp);
    }

    function updateMaintenanceReserveBps(uint256 newBps) external onlyOwner {
        require(newBps <= maxMaintenanceReserveBps, "FHEFeeManager: exceeds cap");
        _maintenanceReserveBps = FHE.asEuint32(newBps);
        FHE.allowThis(_maintenanceReserveBps);
        FHE.allow(_maintenanceReserveBps, owner());
        _pMaintenanceBps = uint32(newBps);
        _regrantSlot(SLOT_MAINTENANCE, _maintenanceReserveBps);
        emit FeeUpdated(FeeType.Maintenance, block.timestamp);
    }

    function updateExitFeeBps(uint256 newBps) external onlyOwner {
        require(newBps <= maxExitFeeBps, "FHEFeeManager: exceeds cap");
        _exitFeeBps = FHE.asEuint32(newBps);
        FHE.allowThis(_exitFeeBps);
        FHE.allow(_exitFeeBps, owner());
        _pExitFeeBps = uint32(newBps);
        _regrantSlot(SLOT_EXIT, _exitFeeBps);
        emit FeeUpdated(FeeType.Exit, block.timestamp);
    }

    function updateMarketplaceFeeBps(uint256 newBps) external onlyOwner {
        require(newBps <= maxMarketplaceBps, "FHEFeeManager: exceeds cap");
        _marketplaceFeeBps = FHE.asEuint32(newBps);
        FHE.allowThis(_marketplaceFeeBps);
        FHE.allow(_marketplaceFeeBps, owner());
        _pMarketplaceBps = uint32(newBps);
        _regrantSlot(SLOT_MARKETPLACE, _marketplaceFeeBps);
        emit FeeUpdated(FeeType.Marketplace, block.timestamp);
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

    function encryptedMarketplaceFeeBps() external view returns (euint32) {
        _requireGrant(SLOT_MARKETPLACE);
        return _marketplaceFeeBps;
    }

    // ─── Internal Helpers ─────────────────────────────────────────────────────

    function _regrantSlot(bytes32 slotId, euint32 handle) internal {
        address[] memory active = _activeGrantees(slotId);
        for (uint256 i; i < active.length; i++) {
            FHE.allow(handle, active[i]);
        }
    }
}
