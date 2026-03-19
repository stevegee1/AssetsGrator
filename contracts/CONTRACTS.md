# AssetsGrator — Smart Contracts Business Guide

## What We're Building

A regulated real-estate tokenization platform on Polygon (Amoy testnet → Polygon mainnet).
Investors buy fractional ownership of properties using USDC, earn rental income, and can
redeem tokens at the current property valuation.

---

## Contracts Deployed & Why Each Exists

### Platform Infrastructure (deployed once, shared by all properties)

| Contract | Why it exists |
|---|---|
| **IdentityRegistry** | Master KYC list. Stores which wallet addresses have been verified. Every token transfer checks this. |
| **IdentityRegistryStorage** | Separate storage layer for the IdentityRegistry (T-REX pattern — separates data from logic so logic can be upgraded). |
| **ClaimTopicsRegistry** | Defines what types of KYC claims are accepted (e.g. topic `1` = basic KYC). |
| **TrustedIssuersRegistry** | Defines which entities are authorised to issue KYC claims (e.g. your compliance officer's wallet). |
| **PropertyFactory** | Master deployer. Calling `deployProperty()` creates a full token stack for a new property, wires all components together automatically. |
| **PropertyMarketplace** | Primary and secondary market. Investors buy tokens here. Enforces KYC on every purchase via ERC-3643. |
| **PropertyRegistry** | Off-chain-friendly index of all deployed property tokens with their metadata. |

### Implementation Templates (deployed once, cloned per property)

| Contract | Why it exists |
|---|---|
| **PropertyToken (impl)** | Master copy. Factory clones this for each property using EIP-1167 — 90% cheaper than deploying full bytecode each time. |
| **ModularCompliance (impl)** | Master copy of the compliance plugin system. Cloned per property. |
| **KYCComplianceModule** | Shared singleton (stateless — reads from IdentityRegistry). Added to each property's compliance during `deployProperty()`. |

### Per-Property Contracts (deployed automatically by `deployProperty()`)

| Contract | Why it exists |
|---|---|
| **PropertyToken** *(one per property)* | The ERC-3643 security token. Represents fractional units. Holds valuation, price per unit, IPFS metadata CID. |
| **ModularCompliance** *(one per property)* | Compliance rule engine for this specific token. Owner can add/remove modules at any time (e.g. country restrictions, max balance caps). |
| **PropertyTreasury** *(one per property)* | USDC vault. Receives primary sale proceeds and rental income. Handles investor redemptions. Each property's funds are completely isolated. |

---

## Current Deployment (Polygon Amoy Testnet)

| Contract | Address |
|---|---|
| IdentityRegistry | `0x85a8930D4C08390A6ca6809d90581d8C1Dcda531` |
| PropertyFactory | `0xa7E51613FB6fFA7e5A01b99F019993100B66a636` |
| PropertyMarketplace | `0x5AC9927f1f2073b5053cA53ea750698Bb30be49c` |
| PropertyRegistry | `0xF4cDEF49445e79745BAD03f810227Af89e0a64F1` |
| ClaimTopicsRegistry | `0xB00aDb2Cf090f34625eec69fdE68105259288d88` |
| TrustedIssuersRegistry | `0xC600dB405e166958097abE47877Ca6F0eCa5CAFD` |
| KYCComplianceModule | `0x1Da86fDbA0C56d000C7B3D63335766dbFd18fC64` |

> ⚠️ **These are testnet addresses.** Mainnet requires a full redeploy.

---

## 🔐 Sensitive Addresses — Who Controls What

> [!CAUTION]
> The following addresses have admin powers. If any private key is compromised,
> an attacker can drain funds, freeze tokens, or create fake properties.

| Address / Role | Powers | Current Holder | Risk |
|---|---|---|---|
| **PropertyFactory owner** | Deploy new properties, set platform fees, set platform wallet | Deployer EOA `0x6d304...c77` | 🔴 Critical — can change fee recipient |
| **PropertyMarketplace owner** | Change fee recipient, change platform fee %, change payment token | Deployer EOA | 🔴 Critical — controls all fee flows |
| **TrustedIssuersRegistry owner** | Add/remove KYC issuers (who can whitelist investors) | Deployer EOA | 🔴 Critical — can whitelist anyone |
| **IdentityRegistry agents** | Add/remove KYC records for individual wallets | Deployer EOA | 🔴 Critical — direct investor whitelist |
| **PropertyToken owner** *(per property)* | Mint/burn tokens, freeze wallets, update valuation, add compliance modules | Platform operator EOA | 🟠 High — controls token lifecycle |
| **PropertyTreasury owner** *(per property)* | Emergency withdraw all USDC, update platform wallet | Platform operator EOA | 🟠 High — can drain property vault |
| **Platform wallet** | Receives all platform fees from rent and sales | `0x6d304...c77` (deployer) | 🟡 Medium — fee destination |

---

## Have We Implemented Gnosis Safe?

**No. Not yet.**

Currently every sensitive role above is held by a single **Externally Owned Account (EOA)** —
a single private key. This means:

- If that key is lost → access is permanently lost
- If that key is stolen → all platform funds and properties are at risk
- All actions are single-party with no review or delay

### What Gnosis Safe would give us

A **multi-signature wallet** (e.g. 2-of-3 or 3-of-5 keyholders must approve):

```
Before: deployer signs → tx immediately executes
After:  [Alice signs] + [Bob signs] + [Carol signs] → tx executes  (2-of-3 required)
```

This means no single person can drain funds or change critical config.

### What needs to be moved to a Safe before mainnet

| Action | Priority |
|---|---|
| Transfer `PropertyFactory` ownership to multi-sig | 🔴 Before mainnet |
| Transfer `PropertyMarketplace` ownership to multi-sig | 🔴 Before mainnet |
| Transfer `TrustedIssuersRegistry` ownership to multi-sig | 🔴 Before mainnet |
| Move `Platform Wallet` to multi-sig | 🟠 Recommended |
| Use multi-sig as `PropertyToken` owner per property | 🟠 Recommended |

### How to set it up (Polygon Mainnet)

1. Create a Safe at [safe.global](https://safe.global) on Polygon
2. Set threshold (e.g. 2-of-3 keyholders)
3. After deploying contracts, call:
   ```js
   await factory.transferOwnership(SAFE_ADDRESS);
   await marketplace.transferOwnership(SAFE_ADDRESS);
   await trustedIssuersRegistry.transferOwnership(SAFE_ADDRESS);
   ```
4. All future admin actions require multi-sig approval through the Safe UI

---

## Compliance Module Extensibility

Each property's `ModularCompliance` contract accepts additional modules **after deployment**.
The platform operator can call `compliance.addModule(address)` at any time to add new rules:

| Module (future) | Regulatory use case |
|---|---|
| `CountryRestrictModule` | Block US investors (Reg S compliance) |
| `MaxBalanceModule` | No wallet holds >10% (anti-concentration) |
| `TimeLocksModule` | 12-month lock-up for early investors |
| `SupplyLimitModule` | Hard cap total token supply |

This is the key architectural advantage of ERC-3643 over standard ERC-20.
