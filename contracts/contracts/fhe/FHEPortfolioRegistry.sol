// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.25;

import {FHE, euint64} from "@fhenixprotocol/cofhe-contracts/FHE.sol";
import "./FHEAccessControl.sol";
import "../interfaces/IFHEPortfolioRegistry.sol";

/// @title FHEPortfolioRegistry
/// @notice Encrypted shadow registry for investor portfolios.
///         Maintains T-REX compliance on the public layer while providing
///         private shareholding snapshots on the Fhenix layer.
contract FHEPortfolioRegistry is FHEAccessControl, IFHEPortfolioRegistry {

    // ─── Slot ID derivation ──────────────────────────────────────────────────
    /// @dev slot = keccak256(abi.encodePacked("PORTFOLIO", asset, investor))
    function _slotId(address asset, address investor) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("PORTFOLIO", asset, investor));
    }

    // ─── Encrypted balances ──────────────────────────────────────────────────
    // Asset => Investor => Encrypted Balance
    mapping(address => mapping(address => euint64)) private _balances;

    // ─── Events ──────────────────────────────────────────────────────────────
    event PortfolioSynced(address indexed asset, address indexed investor, uint256 timestamp);

    // ─── Constructor ──────────────────────────────────────────────────────────
    constructor(address owner_) {
        _transferOwnership(owner_);
    }

    // ─── Shadow Sync (T-REX Bridge) ──────────────────────────────────────────
    
    /// @notice Synchronize a plaintext balance to the encrypted shadow registry.
    /// @dev    Called by AssetToken on every transfer/mint/burn.
    function syncBalance(address investor, uint256 amount) external override {
        // Validation: For a hackathon, we assume the caller is the AssetToken.
        // In prod, we would whitelist the Parent Factory or specific Tokens.
        
        euint64 encBalance = FHE.asEuint64(uint64(amount));
        FHE.allowThis(encBalance);
        FHE.allow(encBalance, investor);
        FHE.allow(encBalance, owner()); // Allow platform owner (auditor)

        _balances[msg.sender][investor] = encBalance;
        
        // Record the grant for the permit system
        _recordGrant(_slotId(msg.sender, investor), investor, 0);

        emit PortfolioSynced(msg.sender, investor, block.timestamp);
    }

    // ─── Access-Controlled Views ─────────────────────────────────────────────

    /// @notice Returns the encrypted balance handle for an investor.
    function getEncryptedBalance(address asset, address investor) external view override returns (bytes32) {
        _requireGrant(_slotId(asset, investor));
        return euint64.unwrap(_balances[asset][investor]);
    }

    /// @notice Grant decrypt access to an auditor or the investor themselves.
    function grantBalanceAccess(address asset, address who, uint256 expiresAt) external override {
        // Permission check: Usually the investor or the platform owner can grant access
        require(
            msg.sender == owner() || msg.sender == address(this), // Simplify for demo
            "FHEPortfolioRegistry: not authorised"
        );
        
        euint64 bal = _balances[asset][tx.origin]; // Using tx.origin for demo permit logic
        FHE.allow(bal, who);
        _recordGrant(_slotId(asset, tx.origin), who, expiresAt);
    }
}
