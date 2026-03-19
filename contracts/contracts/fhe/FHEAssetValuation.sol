// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.25;

import {FHE, euint64, InEuint64} from "@fhenixprotocol/cofhe-contracts/FHE.sol";
import "./FHEAccessControl.sol";

/// @title FHEAssetValuation
/// @notice Encrypted per-asset valuation storage.
///
/// Design:
///   - All valuations stored as euint64 ciphertexts. Initial and updated values take InEuint64
///     inputs — valuation never appears in plaintext calldata.
///   - Authorised valuators (e.g. appraisers, oracles) can write; asset contract cannot
///     self-update (removed trust assumption).
///   - Access tracking: grantValuationAccess() records grantees so they are re-granted
///     automatically when the valuation ciphertext is updated.
///   - Valuation history: every update stores a lightweight record (timestamp, version, updatedBy).
///   - Expiry on grants: lenders receive scoped access for the loan lifetime only.
///   - Both encryptedValuation() and valuationUSD() are access-controlled.
contract FHEAssetValuation is FHEAccessControl {

    // ─── Slot ID derivation ────────────────────────────────────────────────────
    /// @dev slot = keccak256(abi.encodePacked("VALUATION", asset))
    function _slotId(address asset) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("VALUATION", asset));
    }

    // ─── Encrypted valuation per asset ────────────────────────────────────────
    mapping(address => euint64) private _encValuation;
    mapping(address => bool)    public  isRegistered;

    // ─── Valuation history ────────────────────────────────────────────────────
    struct ValuationRecord {
        uint256 timestamp;
        uint256 version;
        address updatedBy;
    }
    mapping(address => ValuationRecord[]) public valuationHistory;
    mapping(address => uint256)           public currentVersion;

    // ─── Authorised valuators ─────────────────────────────────────────────────
    mapping(address => bool) public authorisedValuators;

    // ─── Events ───────────────────────────────────────────────────────────────
    event AssetRegistered(address indexed asset);
    event ValuationUpdated(address indexed asset, uint256 version, address indexed updatedBy);
    event ValuatorAuthorised(address indexed valuator);
    event ValuatorRevoked(address indexed valuator);

    // ─── Modifiers ────────────────────────────────────────────────────────────
    modifier onlyValuator() {
        require(
            authorisedValuators[msg.sender] || msg.sender == owner(),
            "FHEAssetValuation: not authorised valuator"
        );
        _;
    }

    // ─── Valuator Management ──────────────────────────────────────────────────

    function authoriseValuator(address valuator) external onlyOwner {
        require(valuator != address(0), "FHEAssetValuation: zero address");
        authorisedValuators[valuator] = true;
        emit ValuatorAuthorised(valuator);
    }

    function revokeValuator(address valuator) external onlyOwner {
        authorisedValuators[valuator] = false;
        emit ValuatorRevoked(valuator);
    }

    // ─── Register & Initialise ────────────────────────────────────────────────

    /// @notice Register an asset with its initial encrypted valuation.
    /// @param asset            The AssetToken contract address
    /// @param initialValuation Encrypted initial valuation — never touches plaintext calldata
    /// @param assetOwner       Asset owner (gets decrypt access)
    function registerAsset(
        address asset,
        InEuint64 calldata initialValuation,
        address assetOwner
    ) external onlyOwner {
        require(asset != address(0),     "FHEAssetValuation: zero asset");
        require(assetOwner != address(0),"FHEAssetValuation: zero owner");
        require(!isRegistered[asset],    "FHEAssetValuation: already registered");

        euint64 encVal = FHE.asEuint64(initialValuation);
        FHE.allowThis(encVal);
        FHE.allow(encVal, assetOwner);

        _encValuation[asset] = encVal;
        isRegistered[asset]  = true;

        valuationHistory[asset].push(ValuationRecord({
            timestamp: block.timestamp,
            version:   1,
            updatedBy: msg.sender
        }));
        currentVersion[asset] = 1;

        // Record owner grant with no expiry
        _recordGrant(_slotId(asset), assetOwner, 0);

        emit AssetRegistered(asset);
    }

    // ─── Update Valuation ─────────────────────────────────────────────────────

    /// @notice Update the encrypted valuation. Only authorised valuators (not the asset itself).
    /// @param asset        The AssetToken address
    /// @param newValuation Encrypted new valuation — plaintext never in calldata
    function updateValuation(
        address asset,
        InEuint64 calldata newValuation
    ) external onlyValuator {
        require(isRegistered[asset], "FHEAssetValuation: not registered");

        euint64 encVal = FHE.asEuint64(newValuation);
        FHE.allowThis(encVal);
        FHE.allow(encVal, owner());

        _encValuation[asset] = encVal;

        // Re-grant all currently active grantees on the new ciphertext
        bytes32 slot = _slotId(asset);
        address[] memory active = _activeGrantees(slot);
        for (uint256 i; i < active.length; i++) {
            FHE.allow(encVal, active[i]);
        }

        uint256 newVersion = currentVersion[asset] + 1;
        currentVersion[asset] = newVersion;

        valuationHistory[asset].push(ValuationRecord({
            timestamp: block.timestamp,
            version:   newVersion,
            updatedBy: msg.sender
        }));

        emit ValuationUpdated(asset, newVersion, msg.sender);
    }

    // ─── Grant / Revoke Valuation Access ─────────────────────────────────────

    /// @notice Grant an investor, lender, or auditor decrypt access with optional expiry.
    /// @param expiresAt 0 = no expiry. For lenders, set to loan maturity timestamp.
    function grantValuationAccess(
        address asset,
        address who,
        uint256 expiresAt
    ) external {
        require(isRegistered[asset], "FHEAssetValuation: not registered");
        require(
            msg.sender == owner() || authorisedValuators[msg.sender],
            "FHEAssetValuation: not authorised"
        );
        require(who != address(0), "FHEAssetValuation: zero address");

        FHE.allow(_encValuation[asset], who);
        _recordGrant(_slotId(asset), who, expiresAt);
    }

    function revokeValuationAccess(address asset, address who) external onlyOwner {
        require(isRegistered[asset], "FHEAssetValuation: not registered");
        _revokeGrant(_slotId(asset), who);
        // Note: FHE.allow() is not reversible on-chain.
        // True revocation requires updateValuation() without re-granting this address.
    }

    // ─── Public Valuation (e.g. for regulatory audit disclosure) ─────────────

    function allowPublicValuation(address asset) external onlyOwner {
        require(isRegistered[asset], "FHEAssetValuation: not registered");
        FHE.allowPublic(_encValuation[asset]);
    }

    // ─── Fhenix Async Decryption Reveal ───────────────────────────────────────

    function publishValuationResult(
        address asset,
        uint64  decryptedValue,
        bytes calldata signature
    ) external {
        require(isRegistered[asset], "FHEAssetValuation: not registered");
        FHE.publishDecryptResult(_encValuation[asset], decryptedValue, signature);
    }

    // ─── Access-Controlled Views ──────────────────────────────────────────────

    /// @notice Return encrypted valuation handle. Only permitted addresses can call.
    function encryptedValuation(address asset) external view returns (euint64) {
        require(isRegistered[asset], "FHEAssetValuation: not registered");
        _requireGrant(_slotId(asset));
        return _encValuation[asset];
    }

    /// @notice Return decrypted valuation (only once published via relayer, access-controlled).
    function valuationUSD(address asset) external view returns (uint256) {
        require(isRegistered[asset], "FHEAssetValuation: not registered");
        _requireGrant(_slotId(asset));
        (uint256 val, bool ready) = FHE.getDecryptResultSafe(_encValuation[asset]);
        return ready ? val : 0;
    }

    // ─── History Views ────────────────────────────────────────────────────────

    function getValuationHistoryLength(address asset) external view returns (uint256) {
        return valuationHistory[asset].length;
    }

    function getValuationHistoryRecord(
        address asset,
        uint256 index
    ) external view returns (ValuationRecord memory) {
        return valuationHistory[asset][index];
    }
}
