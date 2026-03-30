// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

interface IFHEPortfolioRegistry {
    /// @notice Synchronize a plaintext balance to the encrypted shadow registry.
    /// @dev    Called by AssetToken on every transfer/mint/burn.
    function syncBalance(address investor, uint256 amount) external;

    /// @notice Returns the encrypted balance handle for an investor.
    /// @dev    Access-controlled.
    function getEncryptedBalance(address asset, address investor) external view returns (bytes32);

    /// @notice Grant decrypt access to an auditor or the investor themselves.
    function grantBalanceAccess(address asset, address who, uint256 expiresAt) external;
}
