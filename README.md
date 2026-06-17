# AssetsGrator

## The First UK RWA Tokenisation Platform Supporting On-Chain Collateralised Lending with Closed-Loop Sterling Settlement

> **Website:** [assetsgrator.com](https://www.assetsgrator.com/)
> **Contact:** [help@assetsgrator.com](mailto:help@assetsgrator.com)
> **Incorporated:** United Kingdom

---

## Table of Contents

1. [Overview](#overview)
2. [The Architecture](#the-architecture)
3. [Smart Contract Suite](#smart-contract-suite)
4. [Test Coverage](#test-coverage)
5. [Milestones](#milestones)
6. [Business & Regulatory Context](#business--regulatory-context)
7. [Running the Project](#running-the-project)
8. [Contact](#contact)

---

## Overview

**AssetsGrator** is a UK-incorporated financial technology company building a regulated platform for the tokenisation and trading of Real-World Assets (RWA). We enable institutional and accredited investors to participate in fractional ownership of high-value assets — renewable energy projects, commercial real estate, infrastructure, and carbon credits — through blockchain-issued security tokens that are **fully compliant with applicable securities law from day one**.

This is not a crypto speculation product. AssetsGrator is designed to operate within the framework of financial regulation — currently aligned to the UK's FCA token regulatory sandbox and evolving UK digital securities legislation. Every participant on the platform must pass KYC and AML screening before they can hold, transfer, or borrow against any asset. Every transfer is governed by enforceable compliance rules that run automatically on-chain — powered by the **ERC-3643 (T-REX) standard**, which embeds identity verification, jurisdiction checks, and lock-up enforcement directly into the token contract itself, making non-compliant transfers structurally impossible.

### The Problem We Are Solving

Traditional asset markets are fragmented, illiquid, and inaccessible. A pension fund, family office, or sophisticated individual investor in the UK who wants exposure to a £50M solar farm is locked out — the minimum participation is multi-million pounds, the documentation is opaque, and the secondary market does not exist. Meanwhile, asset owners (developers, project companies) struggle to raise capital efficiently from a broad investor base under a compliant structure.

Blockchain tokenisation solves the liquidity and access problem, but standard public tokenisation structures rely on US-denominated stablecoins (like USDC or USDT). This exposes UK-based institutional and retail investors to foreign exchange risk and introduces legal friction under UK financial promotions and securities laws. Furthermore, institutional investors require compliant, on-chain lending protocols where they can borrow against their digital security holdings without violating regulatory requirements.

### The AssetsGrator Solution — ERC-3643 × Sterling Platform Ledger

We have architected a platform where **regulatory compliance and investor security are not in conflict** — they reinforce each other:

- **ERC-3643 (T-REX Protocol)** is the international standard for regulated security tokens. It embeds identity verification, compliance rules, and transfer restrictions directly into the token contract. Every transfer automatically checks: Is the recipient KYC-verified? Is the jurisdiction permitted? Is the lock-up period satisfied? There is no way to move a token outside these rules — the compliance is structural, not advisory.

- **Closed-Loop Sterling Platform Ledger:** Settles natively in British Pounds (GBP) using a platform-managed GBP token (`GBPPlatformToken.sol`). The platform owner mints/burns these tokens in lockstep with real-world bank wire deposits and redemptions. This maintains complete math and scaling compatibility (6 decimals) with audited settlement logic, while enabling a gasless, fiat-like onboarding experience.

- **KYC-Gated Collateralised Lending:** The lending layer (`LoanManager.sol`) allows verified participants to lock fractional ERC-3643 `AssetToken` units as collateral to borrow GBP tokens. Loan-to-value (LTV) limits are calculated dynamically via our valuation oracle (`AssetValuation.sol`), with automatic liquidation rules if boundaries are breached.

Together, ERC-3643 ensures that **only verified, compliant investors can participate**, and the Sterling ledger ensures that **transactions are denominated in the local currency of the assets and platform participants**, with compliant lending integrated directly into the stack.

The platform's smart contracts are live on **Arbitrum Sepolia** (the primary L2 testnet), with all core protocol logic tested and verified.

---

## The Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        AssetsGrator Platform                    │
│                                                                 │
│  ┌──────────────┐    ┌─────────────────┐    ┌───────────────┐  │
│  │  AssetFactory │───▶│   AssetToken    │───▶│ AssetTreasury │  │
│  │  (ERC1967     │    │   (ERC-3643)    │    │ (Fee Splits)  │  │
│  │   Proxy)      │    │                 │    │               │  │
│  └──────────────┘    └────────┬────────┘    └───────────────┘  │
│                               │                                 │
│              ERC-3643 Compliance Layer                          │
│  ┌──────────────┐    ┌────────▼────────┐    ┌───────────────┐  │
│  │KYCCompliance │    │IdentityRegistry  │    │CountryRestrict│  │
│  │   Module     │    │    (T-REX)       │    │   Module      │  │
│  └──────────────┘    └─────────────────┘    └───────────────┘  │
│                               │                                 │
│              Sterling platform Ledger Layer                     │
│  ┌────────────────────────────▼────────────────────────────┐   │
│  │               GBPPlatformToken (6 decimals)              │   │
│  │  • Mentions USDC under the hood to preserve audited math  │   │
│  │  • Restricted Mint/Burn matching fiat bank wire deposits │   │
│  └────────────────────────────┬────────────────────────────┘   │
│                               │                                 │
│              Collateralised Lending Stack                       │
│  ┌────────────────────────────▼────────────────────────────┐   │
│  │                      LoanManager                         │   │
│  │  • Locks AssetToken as collateral                       │   │
│  │  • Dynamically reads LTV via AssetValuation oracle      │   │
│  │  • Disburses and collects GBP platform tokens           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Supporting Contracts                                           │
│  ┌──────────────┐    ┌─────────────────┐    ┌───────────────┐  │
│  │AssetMarketpl.│    │ AssetGovernance │    │AssetRegistry  │  │
│  │ (P2P trades) │    │  (DAO voting)   │    │  (Metadata)   │  │
│  └──────────────┘    └─────────────────┘    └───────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Smart Contract Suite

### Core Platform — `contracts/`

| Contract | Purpose |
|----------|---------|
| `AssetToken.sol` | ERC-3643 security token representing fractional RWA ownership |
| `AssetFactory.sol` | ERC1967 upgradeable factory — deploys token + compliance + treasury for each asset |
| `AssetTreasury.sol` | Receives asset revenue (GBP), splits platform/maintenance/exit fees, distributes to holders |
| `AssetRegistry.sol` | On-chain metadata registry (IPFS CID, category, valuation, legal hash) |
| `AssetMarketplace.sol` | Peer-to-peer secondary market for fractional share transfers |
| `AssetGovernance.sol` | DAO-style proposal and voting for asset parameter changes |
| `KYCComplianceModule.sol` | T-REX modular compliance — checks identity registry on every transfer |
| `CountryRestrictModule.sol` | Jurisdiction-level transfer restrictions (OFAC, UK/EU sanctions) |
| `TimeLocksModule.sol` | Lock-up period enforcement for regulated security tokens |
| `EnergyProductionOracle.sol` | Trusted oracle for kWh production data feeding revenue calculations |
| `EnergyRevenueDistributor.sol` | Auto-distributes energy sale proceeds pro-rata to token holders |
| `CarbonCreditToken.sol` | ERC-3643 carbon offset token with retirement and verification logic |
| `RECToken.sol` | Renewable Energy Certificate token (IEC/RECS standard compatible) |
| `GBPPlatformToken.sol` | 6-decimal GBP platform token representing fiat bank wire ledger entries |
| `LoanManager.sol` | Collateralised loan contract allowing borrowers to lock RWA tokens and borrow GBP |
| `AssetValuation.sol` | Public oracle registry storing RICS property and asset valuations |

---

## Test Coverage

**Total: 37 tests passing across 2 suites** (run with `npx hardhat test`)

### Suite 1 — `test/RWAPlatform.test.js` (Core Platform)
Covers factory deployment, asset creation, ERC-3643 compliance, revenue splitting, marketplace transactions, governance rules, and admin operations.

### Suite 2 — `test/LoanManager.test.js` (Collateralised Lending)
Covers the full lending lifecycle in plaintext:
- **KYC Gating:** Verifies that non-KYC wallets cannot originate loans.
- **Collateral Custody:** Verifies that `AssetToken` collateral is securely locked in the contract via ERC-3643 compliance agents.
- **Loan Origination:** Disburses GBP tokens (minus platform cut) based on dynamic LTV parameters.
- **Repayments:** Allows borrowers to repay debt in full and reclaim their locked RWA tokens.
- **Liquidations:** Enforces collateral seizure to the platform treasury if the due date passes or LTV breaches thresholds due to oracle valuation drops.

---

## Milestones

### Milestone 1 — Completed

> **Scope:** Full on-chain protocol with Sterling ledger and lending stack

| Deliverable | Status |
|-------------|--------|
| ERC-3643 compliant `AssetToken` + `AssetFactory` |  Done |
| `AssetTreasury` with fee splits and revenue distribution |  Done |
| `KYCComplianceModule` + `CountryRestrictModule` |  Done |
| `AssetMarketplace` (secondary P2P trading) |  Done |
| `AssetGovernance` (DAO voting for asset parameters) |  Done |
| `GBPPlatformToken` (6-decimal sterling platform ledger) | Done |
| `LoanManager` (plaintext collateralised lending protocol) | Done |
| `AssetValuation` oracle (appraisal updates & LTV queries) | Done |
| Full Hardhat test suite passing (37 tests) |  Done |
| Deployed to Arbitrum Sepolia |  Done |

### Milestone 2 — Roadmap

> **Scope:** Frontend dApp + Bank Bridge Integration

| Deliverable | Target |
|-------------|--------|
| Borrower portal — KYC submission, loan origination, repayment dashboard | Q3 2026 |
| Investor portal — fractional GBP share purchase, revenue tracking, governance voting | Q3 2026 |
| Compliance officer dashboard — whitelisting, valuation updates, manual liquidations | Q3 2026 |
| Bank Bridge API simulation — automatic minting/burning of GBPPlatformToken | Q3 2026 |
| Arbitrum Sepolia contract verification | Q3 2026 |

---

## Business & Regulatory Context

### The Market Opportunity

Global illiquid asset markets — real estate ($350T), infrastructure ($4T), private equity ($12T) — remain inaccessible to the vast majority of investors due to high minimum tickets, complex settlement, and opaque secondary markets. The RWA tokenisation sector is projected to reach **$16 trillion by 2030** (BCG / 21Shares research).

In the UK specifically, the FCA and HM Treasury are actively shaping a regulatory framework for digital securities under the Financial Services and Markets Act 2023. The UK government has committed to making Britain a global hub for digital asset investment — and AssetsGrator is built to operate within that framework.

### Regulatory Compliance Architecture

AssetsGrator is built to satisfy the compliance expectations of the FCA, institutional legal counsel, and sophisticated investors. The following requirements are met **structurally in the smart contracts** — not through off-chain promises:

| Requirement | How AssetsGrator Addresses It |
|-------------|-------------------------------|
| KYC / AML | `IdentityRegistry` — every participant verified before any transfer |
| Securities law | ERC-3643 (T-REX) — the global standard for regulated, compliant security tokens |
| Local Currency Settlement | Native GBP platform token ledger backed 1:1 by corporate bank reserves |
| Investor accreditation | Investor flags checked before loan origination or high-value participation |
| Sanctions compliance | `CountryRestrictModule` — OFAC / HMT / EU sanctions enforced at the transfer level |
| Lock-up / holding periods | `TimeLocksModule` — statutory lock-up periods enforced in the compliance module |
| Tax event transparency | Revenue distributions are on-chain, compliant, and attributable |
| Data protection | KYC processing handled off-chain; only whitelisting status is logged on-chain |

---

## Running the Project

### Prerequisites
```bash
node >= 18
hardhat >= 2.22
```

### Install
```bash
cd contracts
npm install
```

### Run All Tests
```bash
npx hardhat test
# 37 passing (~3s)
```

### Deploy to Arbitrum Sepolia
```bash
npx hardhat run scripts/deploy.js --network arbitrumSepolia
```

---

## Contact

AssetsGrator is incorporated in the United Kingdom and is building toward FCA regulatory registration for digital securities activities.

| | |
|--|--|
| **Website** | [www.assetsgrator.com](https://www.assetsgrator.com/) |
| **General Enquiries** | [help@assetsgrator.com](mailto:help@assetsgrator.com) |
| **Network** | Arbitrum Sepolia |
| **Licence** | MIT |

---

*AssetsGrator is a technology platform. Tokenised assets issued through this platform constitute securities and are subject to applicable UK and international financial regulation. The platform's smart contracts are currently deployed on testnet and are pending independent security audit before any mainnet launch.*
