// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title FHEAccessControl
/// @notice Shared base contract for all FHE extension contracts.
///
/// Solves the 5 recurring patterns across FHEFeeManager, FHEAssetValuation, FHEKYCRegistry:
///   1. Access tracking — who has been granted access, so re-grants work on ciphertext update
///   2. Scoped grants — grant access to a specific "slot" (fee type, asset, attribute)
///   3. Expiry — time-bounded access
///   4. Revocation tracking — mark grants inactive (FHE.allow is not on-chain reversible)
///   5. Authorised roles — multiple trusted actors beyond just owner
abstract contract FHEAccessControl is Ownable {

    // ─── Authorised Operators ─────────────────────────────────────────────────
    /// @notice Addresses authorised to perform write operations (e.g. update fees, valuations)
    mapping(address => bool) public authorisedOperators;

    event OperatorAuthorised(address indexed operator);
    event OperatorRevoked(address indexed operator);

    modifier onlyOperator() {
        require(
            authorisedOperators[msg.sender] || msg.sender == owner(),
            "FHEAccessControl: not authorised operator"
        );
        _;
    }

    function authoriseOperator(address operator) external onlyOwner {
        require(operator != address(0), "FHEAccessControl: zero address");
        authorisedOperators[operator] = true;
        emit OperatorAuthorised(operator);
    }

    function revokeOperator(address operator) external onlyOwner {
        authorisedOperators[operator] = false;
        emit OperatorRevoked(operator);
    }

    // ─── Scoped Grant Tracking ────────────────────────────────────────────────
    /// @notice A scoped, time-bounded access grant for ONE specific data slot.
    struct Grant {
        bool    active;
        uint256 grantedAt;
        uint256 expiresAt;   // 0 = no expiry
    }

    /// @notice slotId => grantee => grant
    ///         slotId is defined by each child contract (e.g. keccak256(feeType), assetAddress, attrKey)
    mapping(bytes32 => mapping(address => Grant)) public grants;

    /// @notice slotId => ordered list of all grantees (for re-grant on update)
    mapping(bytes32 => address[]) internal _grantees;

    event AccessGranted(bytes32 indexed slotId, address indexed who, uint256 expiresAt);
    event AccessRevoked(bytes32 indexed slotId, address indexed who);

    // ─── Internal grant helpers ────────────────────────────────────────────────

    /// @dev Record a new grant. Adds to _grantees list only once.
    function _recordGrant(bytes32 slotId, address who, uint256 expiresAt) internal {
        if (!grants[slotId][who].active) {
            _grantees[slotId].push(who);
        }
        grants[slotId][who] = Grant({
            active:    true,
            grantedAt: block.timestamp,
            expiresAt: expiresAt
        });
        emit AccessGranted(slotId, who, expiresAt);
    }

    /// @dev Mark a grant as inactive. FHE.allow() is not reversible on-chain —
    ///      true revocation requires re-encrypting the ciphertext without this grantee.
    function _revokeGrant(bytes32 slotId, address who) internal {
        grants[slotId][who].active = false;
        emit AccessRevoked(slotId, who);
    }

    // ─── Access checks ────────────────────────────────────────────────────────

    function isGrantActive(bytes32 slotId, address who) public view returns (bool) {
        Grant memory g = grants[slotId][who];
        return g.active && (g.expiresAt == 0 || block.timestamp < g.expiresAt);
    }

    function _requireGrant(bytes32 slotId) internal view {
        require(
            msg.sender == owner() ||
            authorisedOperators[msg.sender] ||
            isGrantActive(slotId, msg.sender),
            "FHEAccessControl: not permitted"
        );
    }

    // ─── Grantee list view ────────────────────────────────────────────────────

    function getGrantees(bytes32 slotId) external view returns (address[] memory) {
        return _grantees[slotId];
    }

    /// @dev Returns the list of currently-active grantees for a slot.
    ///      Used by child contracts to re-grant access after ciphertext update.
    function _activeGrantees(bytes32 slotId) internal view returns (address[] memory) {
        address[] storage allGrantees = _grantees[slotId];
        uint256 count;
        for (uint256 i; i < allGrantees.length; i++) {
            if (isGrantActive(slotId, allGrantees[i])) count++;
        }
        address[] memory active = new address[](count);
        uint256 j;
        for (uint256 i; i < allGrantees.length; i++) {
            if (isGrantActive(slotId, allGrantees[i])) {
                active[j++] = allGrantees[i];
            }
        }
        return active;
    }
}
