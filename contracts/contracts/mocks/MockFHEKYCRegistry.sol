// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

/// @notice MockFHEKYCRegistry — plaintext stub for local Hardhat testing.
///         Replaces FHEKYCRegistry (0.8.25) with simple bool storage.
///         Attr values are stored as plaintext bools — no FHE operations.
contract MockFHEKYCRegistry {
    // compliance => investor => attrKey => value
    mapping(address => mapping(address => mapping(bytes32 => bool))) public attrs;
    // compliance => investor => attrKey => expiry (0 = no expiry)
    mapping(address => mapping(address => mapping(bytes32 => uint256))) public attrExpiry;

    bytes32 public constant ATTR_IS_VERIFIED   = keccak256("IS_VERIFIED");
    bytes32 public constant ATTR_IS_ACCREDITED = keccak256("IS_ACCREDITED");
    bytes32 public constant ATTR_JURISDICTION  = keccak256("JURISDICTION_VERIFIED");
    bytes32 public constant ATTR_AML_CLEARED   = keccak256("AML_CLEARED");

    event KYCAttributeSet(address indexed compliance, address indexed investor, bytes32 indexed attrKey);

    function setKYCAttr(
        address compliance,
        address investor,
        bytes32 attrKey,
        bool    value,
        uint256 expiresAt
    ) external {
        attrs[compliance][investor][attrKey]      = value;
        attrExpiry[compliance][investor][attrKey] = expiresAt;
        emit KYCAttributeSet(compliance, investor, attrKey);
    }

    /// @notice Batch set multiple attributes for one investor
    function batchSetKYCAttrs(
        address compliance,
        address investor,
        bytes32[] calldata attrKeys,
        bool[]    calldata values,
        uint256   expiresAt
    ) external {
        require(attrKeys.length == values.length, "length mismatch");
        for (uint256 i; i < attrKeys.length; i++) {
            attrs[compliance][investor][attrKeys[i]]      = values[i];
            attrExpiry[compliance][investor][attrKeys[i]] = expiresAt;
            emit KYCAttributeSet(compliance, investor, attrKeys[i]);
        }
    }

    function isAttrValid(
        address compliance,
        address investor,
        bytes32 attrKey
    ) external view returns (bool) {
        uint256 expiry = attrExpiry[compliance][investor][attrKey];
        return attrs[compliance][investor][attrKey] &&
               (expiry == 0 || block.timestamp < expiry);
    }

    /// @notice Simulates getEncryptedKYCAttr — returns 0x00 (false) or 0x01 (true) encoded as bytes32
    function getAttrPlaintext(
        address compliance,
        address investor,
        bytes32 attrKey
    ) external view returns (bool) {
        return attrs[compliance][investor][attrKey];
    }
}
