// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

// Force Hardhat to compile these T-REX and OZ contracts so their artifacts
// are available in tests via ethers.getContractFactory().
//
// This file is NOT deployed — it exists only to trigger artifact generation.

import "@tokenysolutions/t-rex/contracts/registry/implementation/ClaimTopicsRegistry.sol";
import "@tokenysolutions/t-rex/contracts/registry/implementation/TrustedIssuersRegistry.sol";
import "@tokenysolutions/t-rex/contracts/registry/implementation/IdentityRegistryStorage.sol";
import "@tokenysolutions/t-rex/contracts/registry/implementation/IdentityRegistry.sol";
import "@tokenysolutions/t-rex/contracts/compliance/modular/ModularCompliance.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
