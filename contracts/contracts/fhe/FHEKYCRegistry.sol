// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.25;

import {FHE, ebool, InEbool} from "@fhenixprotocol/cofhe-contracts/FHE.sol";
import "./FHEAccessControl.sol";

/// @title FHEKYCRegistry
/// @notice Encrypted, multi-attribute KYC storage with authorised providers, expiry, and scoped access.
///
/// Design:
///   - Per-investor, per-attribute encrypted booleans keyed by bytes32 attribute ID.
///   - Multiple authorised KYC providers can write — no single point of failure.
///   - Each attribute carries expiry and version metadata — enforced on read.
///   - Auditor grants are scoped per attribute and time-bounded via FHEAccessControl.
///   - getEncryptedKYCAttr() is access-controlled — prevents metadata observation.
///   - Re-grant on attribute update: all active grantees receive the new ciphertext handle.
contract FHEKYCRegistry is FHEAccessControl {

    // ─── Attribute Key Constants ──────────────────────────────────────────────
    bytes32 public constant ATTR_IS_VERIFIED   = keccak256("IS_VERIFIED");
    bytes32 public constant ATTR_IS_ACCREDITED = keccak256("IS_ACCREDITED");
    bytes32 public constant ATTR_JURISDICTION  = keccak256("JURISDICTION_VERIFIED");
    bytes32 public constant ATTR_AML_CLEARED   = keccak256("AML_CLEARED");

    // ─── Slot ID derivation ────────────────────────────────────────────────────
    /// @dev slot = keccak256(abi.encodePacked(compliance, investor, attrKey))
    function _slotId(
        address compliance,
        address investor,
        bytes32 attrKey
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(compliance, investor, attrKey));
    }

    // ─── Encrypted attribute storage ──────────────────────────────────────────
    mapping(address => mapping(address => mapping(bytes32 => ebool))) private _encKYCAttrs;

    // ─── Attribute metadata ───────────────────────────────────────────────────
    struct KYCAttrMeta {
        uint256 setAt;
        uint256 expiresAt;  // 0 = no expiry
        uint256 version;
        bool    active;
    }
    mapping(address => mapping(address => mapping(bytes32 => KYCAttrMeta))) public kycAttrMeta;

    // ─── Events ───────────────────────────────────────────────────────────────
    event KYCAttributeSet(address indexed compliance, address indexed investor, bytes32 indexed attrKey, uint256 version);
    event KYCAttributeDeactivated(address indexed compliance, address indexed investor, bytes32 indexed attrKey);

    // ─── Provider management (operators from FHEAccessControl) ────────────────

    /// @notice Authorise a KYC provider to write attributes. Uses inherited authoriseOperator().
    function authoriseProvider(address provider) external onlyOwner {
        authorisedOperators[provider] = true;
        emit OperatorAuthorised(provider);
    }

    function revokeProvider(address provider) external onlyOwner {
        authorisedOperators[provider] = false;
        emit OperatorRevoked(provider);
    }

    // ─── Set a Single Encrypted KYC Attribute ─────────────────────────────────

    /// @param compliance  ERC-3643 compliance module address (scoping context)
    /// @param investor    Investor wallet
    /// @param attrKey     e.g. ATTR_AML_CLEARED
    /// @param attr        Encrypted boolean value
    /// @param expiresAt   0 = no expiry
    function setEncryptedKYCAttr(
        address compliance,
        address investor,
        bytes32 attrKey,
        InEbool memory attr,
        uint256 expiresAt
    ) external onlyOperator {
        _setAttr(compliance, investor, attrKey, attr, expiresAt);
    }

    // ─── Batch Set ────────────────────────────────────────────────────────────

    struct AttrInput {
        bytes32  attrKey;
        InEbool  attr;
        uint256  expiresAt;
    }

    function batchSetEncryptedKYCAttrs(
        address compliance,
        address investor,
        AttrInput[] calldata attrs
    ) external onlyOperator {
        require(investor   != address(0), "FHEKYCRegistry: zero investor");
        require(compliance != address(0), "FHEKYCRegistry: zero compliance");
        require(attrs.length > 0,         "FHEKYCRegistry: empty attrs");

        for (uint256 i; i < attrs.length; i++) {
            _setAttr(compliance, investor, attrs[i].attrKey, attrs[i].attr, attrs[i].expiresAt);
        }
    }

    // ─── Deactivate ───────────────────────────────────────────────────────────

    function deactivateAttr(
        address compliance,
        address investor,
        bytes32 attrKey
    ) external onlyOperator {
        kycAttrMeta[compliance][investor][attrKey].active = false;
        emit KYCAttributeDeactivated(compliance, investor, attrKey);
    }

    // ─── Grant Scoped Auditor Access ──────────────────────────────────────────

    /// @notice Grant an auditor decrypt access to ONE specific attribute, time-bounded.
    function grantKYCAccess(
        address compliance,
        address investor,
        address auditor,
        bytes32 attrKey,
        uint256 expiresAt
    ) external onlyOwner {
        _requireAttrActive(compliance, investor, attrKey);
        require(auditor != address(0), "FHEKYCRegistry: zero auditor");

        FHE.allow(_encKYCAttrs[compliance][investor][attrKey], auditor);
        _recordGrant(_slotId(compliance, investor, attrKey), auditor, expiresAt);
    }

    function revokeKYCAccess(
        address compliance,
        address investor,
        address auditor,
        bytes32 attrKey
    ) external onlyOwner {
        _revokeGrant(_slotId(compliance, investor, attrKey), auditor);
        // FHE.allow() is not on-chain reversible — true revocation requires
        // re-setting the attribute via setEncryptedKYCAttr without re-granting this auditor.
    }

    // ─── Access-Controlled Read ───────────────────────────────────────────────

    function getEncryptedKYCAttr(
        address compliance,
        address investor,
        bytes32 attrKey
    ) external view returns (ebool) {
        require(
            msg.sender == investor       ||
            msg.sender == compliance     ||
            msg.sender == owner()        ||
            authorisedOperators[msg.sender] ||
            isGrantActive(_slotId(compliance, investor, attrKey), msg.sender),
            "FHEKYCRegistry: not permitted"
        );
        _requireAttrActive(compliance, investor, attrKey);
        return _encKYCAttrs[compliance][investor][attrKey];
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    function isAttrValid(
        address compliance,
        address investor,
        bytes32 attrKey
    ) external view returns (bool) {
        KYCAttrMeta memory meta = kycAttrMeta[compliance][investor][attrKey];
        return meta.active &&
               (meta.expiresAt == 0 || block.timestamp < meta.expiresAt);
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    function _setAttr(
        address compliance,
        address investor,
        bytes32 attrKey,
        InEbool memory attr,
        uint256 expiresAt
    ) internal {
        ebool encAttr = FHE.asEbool(attr);
        FHE.allowThis(encAttr);
        FHE.allow(encAttr, investor);
        FHE.allow(encAttr, compliance);

        _encKYCAttrs[compliance][investor][attrKey] = encAttr;

        // Re-grant all previously active auditors on the new ciphertext
        bytes32 slot = _slotId(compliance, investor, attrKey);
        address[] memory active = _activeGrantees(slot);
        for (uint256 i; i < active.length; i++) {
            FHE.allow(encAttr, active[i]);
        }

        KYCAttrMeta storage meta = kycAttrMeta[compliance][investor][attrKey];
        meta.setAt     = block.timestamp;
        meta.expiresAt = expiresAt;
        meta.version  += 1;
        meta.active    = true;

        emit KYCAttributeSet(compliance, investor, attrKey, meta.version);
    }

    function _requireAttrActive(
        address compliance,
        address investor,
        bytes32 attrKey
    ) internal view {
        KYCAttrMeta memory meta = kycAttrMeta[compliance][investor][attrKey];
        require(meta.active, "FHEKYCRegistry: attribute not active");
        require(
            meta.expiresAt == 0 || block.timestamp < meta.expiresAt,
            "FHEKYCRegistry: attribute expired"
        );
    }
}
