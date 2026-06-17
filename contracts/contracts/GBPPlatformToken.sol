// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title GBPPlatformToken
/// @notice A custom 6-decimal GBP-pegged ledger token for AssetsGrator.
///         Minting and burning is restricted to the platform owner/operator bank bridge.
contract GBPPlatformToken is ERC20, Ownable {
    constructor(address owner_) ERC20("AssetsGrator GBP", "GBP") {
        _transferOwnership(owner_);
    }

    /// @notice Override decimals to return 6 to match existing USDC scaling logic.
    function decimals() public view virtual override returns (uint8) {
        return 6;
    }

    /// @notice Mint new GBP tokens when a fiat bank wire deposit is confirmed.
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /// @notice Burn GBP tokens when a user initiates a withdrawal back to their bank account.
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }
}
