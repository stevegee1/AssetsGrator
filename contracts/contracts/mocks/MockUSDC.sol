// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice Minimal USDC mock: 6 decimals, public faucet, owner can mint.
contract MockUSDC is ERC20 {
    constructor() ERC20("USD Coin", "USDC") {}

    function decimals() public pure override returns (uint8) { return 6; }

    function faucet(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
