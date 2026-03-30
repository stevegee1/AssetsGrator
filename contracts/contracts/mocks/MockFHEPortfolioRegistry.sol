// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

/// @notice MockFHEPortfolioRegistry — plaintext stub for local Hardhat testing.
///         Replaces FHEPortfolioRegistry (0.8.25) so that AssetToken can call
///         syncBalance() without needing the real Fhenix co-processor.
contract MockFHEPortfolioRegistry {

    // asset → investor → balance (plaintext mirror)
    mapping(address => mapping(address => uint256)) public balances;

    event PortfolioSynced(address indexed asset, address indexed investor, uint256 balance);

    /// @notice Called by AssetToken on every transfer/mint/burn.
    function syncBalance(address investor, uint256 amount) external {
        balances[msg.sender][investor] = amount;
        emit PortfolioSynced(msg.sender, investor, amount);
    }

    /// @notice Returns plaintext balance (simulates encrypted FHE result).
    function getBalance(address asset, address investor) external view returns (uint256) {
        return balances[asset][investor];
    }

    /// @notice Stub — no-op for access control calls (access is always open in mock).
    function grantBalanceAccess(address, address, uint256) external {}

    /// @notice Stub — returns bytes32(0) for non-FHE tests.
    function getEncryptedBalance(address, address) external pure returns (bytes32) {
        return bytes32(0);
    }
}
