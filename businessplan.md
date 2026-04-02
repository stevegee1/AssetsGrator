# AssetsGrator — Comprehensive Business Plan
**Confidential | April 2026 | Version 2.0**

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Company Overview](#2-company-overview)
3. [The Problem](#3-the-problem)
4. [The Solution](#4-the-solution)
5. [Smart Contract Architecture — The Full Stack](#5-smart-contract-architecture--the-full-stack)
6. [Asset Categories — What We Tokenise](#6-asset-categories--what-we-tokenise)
7. [Revenue & Fee Architecture](#7-revenue--fee-architecture)
8. [The FHE Privacy Layer](#8-the-fhe-privacy-layer)
9. [Market Analysis](#9-market-analysis)
10. [Competitive Landscape](#10-competitive-landscape)
11. [Go-To-Market Strategy](#11-go-to-market-strategy)
12. [Regulatory Strategy](#12-regulatory-strategy)
13. [Financial Projections](#13-financial-projections)
14. [Team & Governance](#14-team--governance)
15. [Funding Ask](#15-funding-ask)
16. [Risk Analysis](#16-risk-analysis)
17. [Roadmap](#17-roadmap)

---

## 1. Executive Summary

**AssetsGrator** is the world's first regulated, multi-asset real-world tokenisation platform built on a **dual-layer institutional privacy stack**: ERC-3643 (T-REX) for structural on-chain compliance, and Fhenix Fully Homomorphic Encryption (CoFHE) for cryptographic investor privacy.

We are not building an ERC-20 wrapper. We are building an end-to-end **Asset Lifecycle Management System** — from token deployment and KYC-gated primary market sale, through automated yield distribution and RICS-backed valuations, to governance-controlled maintenance reserves and investor redemptions — for **six distinct asset categories** including UK real estate, renewable energy, land, infrastructure, and commodities.

**Our differentiator:** Compliance is structurally enforced at the token transfer level. Investor privacy is cryptographically guaranteed. No existing platform does both.

**Current state (April 2026):**
- **19 smart contracts** live on Arbitrum Sepolia
- **5 FHE privacy contracts** in production
- **10 UK real estate tokens** seeded on-chain via `AssetFactory`
- Live frontend at `assetsgrator.com`
- `RECToken.sol` and `EnergyProductionOracle.sol` deployed and ready for Wave 2 energy onboarding

* **Funding target:** £X seed
* **Revenue model:** Fee-based — asset issuance, recurring AUM management (1.5%), and secondary market spread
* **12-month AUM target:** £X

---

## 2. Company Overview

| | |
|---|---|
| **Legal name** | AssetsGrator Ltd |
| **Incorporation** | England & Wales, Q1 2026 |
| **Registered address** | 20 Farringdon Street, London, EC4A 4AB |
| **Website** | https://www.assetsgrator.com |
| **Email** | [EMAIL_ADDRESS] |
| **Current Deployer** | `0x6d30492c8B55657fc0e6D7F40aB53bbDE22Acc77` |
| **Stage** | Pre-seed — live prototype on Arbitrum Sepolia |
| **Token standard** | ERC-3643 (T-REX v4) |
| **Privacy layer** | Fhenix CoFHE |

### Mission
To democratise access to institutional-grade real assets — from UK terrace houses to offshore wind farms — while maintaining the compliance rigour and investor confidentiality that institutional capital requires.

---

## 3. The Problem

### 3.1 The Access Gap
High-yield UK real assets are structurally inaccessible:
- Commercial real estate entry threshold: **£250,000+**
- Renewable energy project participation: **£1M+ typically via private equity**
- Carbon credit markets: **accessible only to corporates and large funds**
- Secondary market: effectively non-existent for most asset types

### 3.2 The Public Ledger Privacy Trap
Standard blockchain tokenisation makes everything public. For institutional investors this is fatal:
- A fund buying a £50M office tower cannot broadcast that position to competitors
- A borrower cannot expose their loan-to-value ratio to the open market
- A regulator cannot access KYC records without the platform disclosing them to everyone

Every existing RWA platform forces a choice between **compliance** (regulators can see everything) and **confidentiality** (institutions require privacy). No platform solves both. Until now.

### 3.3 The Regulatory Compliance Gap
Standard ERC-20-based platforms:
- Enforce KYC in a centralised database — all on-chain transfers are unchecked
- Cannot adapt to multi-jurisdictional compliance (UK FSMA, EU MiCA, UAE ADGM) without rebuilding
- Provide no cryptographic audit trail — regulators must trust the firm's own exports

---

## 4. The Solution

AssetsGrator = **Structural Compliance × Cryptographic Privacy × Multi-Asset Infrastructure**

- **ERC-3643 (T-REX):** Compliance rules are embedded in the token itself. Every `transfer()` call automatically validates: Is the recipient KYC-verified? Is the jurisdiction permitted? Is the lock-up satisfied? Non-compliant transfers are rejected at the EVM level — not flagged, not logged, **rejected**.

- **Fhenix CoFHE:** We run financial computations (KYC checks, valuation updates, fee calculations, loan negotiations) on encrypted inputs using on-chain FHE. Sensitive data is never exposed in plaintext to the public ledger.

- **Multi-Asset Factory:** A single `AssetFactory` contract can deploy a full ERC-3643 stack — token, compliance, treasury — for **any asset category**: real estate, land, renewable energy, infrastructure, commodities.

---

## 5. Smart Contract Architecture — The Full Stack

### 5.1 Deployed Contracts (Arbitrum Sepolia — Chain ID 421614)
> Deployer: `0x6d30492c8B55657fc0e6D7F40aB53bbDE22Acc77` · Deployed: 2026-03-30

#### T-REX Infrastructure (Shared — deployed once)

| Contract | Address | Role |
|---|---|---|
| `ClaimTopicsRegistry` | `0x827c98d9…` | Defines required KYC claim types (e.g. topic `1` = basic KYC) |
| `TrustedIssuersRegistry` | `0x7b1E2919…` | Approves which entities may issue KYC claims |
| `IdentityRegistryStorage` | `0x493390e9…` | Persistent identity data store (separable from logic for upgradability) |
| `IdentityRegistry` | `0xE413130d…` | Master KYC list — checked on every token transfer |
| `ModularCompliance` (impl) | `0x5Ff18c5a…` | Master copy, cloned per asset via EIP-1167 proxy pattern |
| `KYCComplianceModule` | `0xBFd57754…` | Stateless compliance plugin — verifies KYC on every transfer |

#### Asset Platform

| Contract | Address | Role |
|---|---|---|
| `AssetToken` (impl) | `0xcbfC0Ad4…` | ERC-3643 token implementation, EIP-1167 cloned per asset |
| `AssetFactory` | `0x3f26043b…` | One-call deployer for full asset stack (token + compliance + treasury) |
| `AssetMarketplace` | `0x6030A334…` | KYC-gated primary and secondary market, USDC settlement |
| `AssetRegistry` | `0x1bc8e14F…` | Off-chain-friendly index of all deployed assets with metadata |
| `AssetGovernance` | `0xA2A3222D…` | Token-weighted governance — maintenance spend, valuation disputes |
| `AssetTreasury` | *(per asset)* | Isolated USDC vault per asset — revenue distribution, redemptions |
| `MockUSDC` | `0x5cDc5E3a…` | Testnet settlement token (6 decimals) |

#### Energy & Environmental Layer

| Contract | Role |
|---|---|
| `EnergyProductionOracle` | Bridges IoT/SCADA data (MWh, revenue, capacity factor) on-chain per period |
| `EnergyRevenueDistributor` | Synthetix-style dividend engine: distributes energy revenue pro-rata to token holders without loops |
| `RECToken` | ERC-1155 multi-token: 1 unit = 1 MWh of verified renewable generation; supports batch mint, period finalisation, and permanent retirement |

#### FHE Privacy Layer

| Contract | Address | What it encrypts |
|---|---|---|
| `FHEKYCRegistry` | `0xA2c3c3B9…` | KYC flags (`IS_ACCREDITED`, `AML_CLEARED`) as `ebool` ciphertexts |
| `FHEAssetValuation` | `0x13C9B635…` | Asset appraisals as `euint32` — prevents front-running and data leakage |
| `FHEFeeManager` | `0xFF9d2eA9…` | Platform fee rates (revenue bps, maintenance bps, exit fee bps) as ciphertexts |
| `FHEPortfolioRegistry` | `0xA62a1612…` | Shadow-synced encrypted portfolio balances — updated on every mint/transfer/burn |
| `ConfidentialLoan` | `0x9485Fa34…` | Full lending lifecycle: principal, collateral ratio, repayments — all in ciphertext |

### 5.2 Per-Asset Deployment Flow (AssetFactory)

When `deployAsset()` is called:
1. **Clone** `AssetToken` implementation via EIP-1167 (90% cheaper than full deploy)
2. **Clone** `ModularCompliance` implementation
3. **Initialise** the token with all on-chain metadata (name, symbol, IPFS CID, location, category, valuation, price per unit)
4. **Wire** KYC module → compliance → token
5. **Deploy** a dedicated `AssetTreasury` with the asset token and `FHEFeeManager` reference
6. **Register** in `AssetFactory` registry by category and address
7. **Emit** `AssetDeployed` event

**Result:** A fully wired, KYC-gated, compliance-enforced, treasury-isolated ERC-3643 asset — deployed in a single transaction.

### 5.3 Asset Lifecycle States (`AssetStatus`)

```
PENDING → ACTIVE → PAUSED → CLOSED
```
- **PENDING:** Deployed, not yet minted. KYC verification and compliance setup phase.
- **ACTIVE:** Token is live, transfers enabled, treasury accepting revenue.
- **PAUSED:** Trading suspended (regulatory event, maintenance). Transfers blocked.
- **CLOSED:** Asset wound down. Redemptions still possible.

### 5.4 Shadow Portfolio Sync (`FHEPortfolioRegistry`)

Every `_transfer`, `_mint`, and `_burn` on any `AssetToken` triggers an internal `_sync()` hook:
```solidity
function _sync(address investor) internal {
    IFHEPortfolioRegistry(portfolioRegistry).syncBalance(investor, balanceOf(investor));
}
```
This maintains an **encrypted shadow registry** of every investor's balance across all assets — automatically, in real time, without any manual call. Institutional investors' portfolio compositions are never exposed on the public ledger.

---

## 6. Asset Categories — What We Tokenise

`IAssetToken.AssetCategory` defines six categories. All share the same ERC-3643 token standard and treasury infrastructure. Energy-specific fields (`capacityKW`, `annualYieldMWh`, `ppaContractCID`, `ppaTermYears`) are embedded in the `AssetMetadata` struct and default to zero for non-energy assets.

### 6.1 REAL_ESTATE — Yield-Bearing Title

**Sub-types:** `"residential flat"`, `"commercial office"`, `"industrial warehouse"`, `"BTL portfolio"`

**Mechanics:**
- Legal title deed CID stored in `ipfsCID` (IPFS / Arweave)
- Rental income deposited into `AssetTreasury.depositRevenue()` by the operator
- `FHEFeeManager` computes platform cut + maintenance reserve cut on each deposit
- Net yield increases the token's `valuationUSD` and `pricePerUnit` on-chain
- Investors redeem tokens for USDC at current `pricePerUnit` via `AssetTreasury.redeem()`
- Exit fees applied on redemption and routed to platform wallet

**Currently live (Wave 1):** 10 UK properties on-chain — Mayfair, Canary Wharf, Kensington, Manchester, Edinburgh, Birmingham, Bristol, Leeds, Oxford, Surrey.

### 6.2 LAND — Raw & Development Land

**Sub-types:** `"agricultural"`, `"development plot"`, `"greenbelt"`, `"brownfield"`

**Mechanics:**
- Returns driven by planning permission uplift and land banking appreciation
- RICS valuation updated quarterly via `AssetToken.updateValuation()`
- Governance module (`AssetGovernance`) enables token-weighted votes on development decisions
- Maintenance reserve held in `AssetTreasury` for planning application costs

### 6.3 RENEWABLE_ENERGY — Production-Linked Yield

**Sub-types:** `"solar PV"`, `"onshore wind"`, `"hydro"`, `"geothermal"`, `"battery storage"`

**Mechanics (the energy stack):**

1. **IoT/SCADA bridge:** `EnergyProductionOracle.reportProduction()` submits periodic production reports (MWh generated, USDC revenue earned, capacity factor, IPFS CID of metering evidence). Only authorised `REPORTER_ROLE` wallets can submit. All data is immutable on-chain.
2. **Period finalisation:** `finalisePeriod(periodId)` closes a generation period — no further data for that period can be submitted.
3. **Revenue distribution:** `EnergyRevenueDistributor.depositRevenue()` accepts USDC from the energy project operator. Uses a Synthetix-style `rewardPerToken` accumulator — gas-efficient regardless of number of holders. Platform fee deducted on deposit. Net revenue distributed pro-rata.
4. **Investor claim:** `EnergyRevenueDistributor.claimRevenue(tokenAddress)` or `claimRevenueMultiple([...])` for cross-asset claims in a single transaction.
5. **REC minting:** For every verified MWh reported by the oracle, `RECToken.mint(treasury, periodId, mwh)` creates a corresponding REC certificate.

**Key metadata on-chain:**
```
capacityKW      — installed generating capacity (e.g. 5000 = 5 MW)
annualYieldMWh  — projected annual output
ppaContractCID  — IPFS CID of the Power Purchase Agreement
ppaTermYears    — duration of the PPA (e.g. 15)
```

### 6.4 INFRASTRUCTURE — Long-Duration Real Assets

**Sub-types:** `"toll road"`, `"data centre"`, `"port"`, `"bridge"`, `"water treatment"`

**Mechanics:**
- Revenue generated from usage fees (tolls, rack rent, port dues)
- Long lock-up periods enforced via `TimeLocksModule` in `ModularCompliance`
- Infrastructure-grade governance: major capex decisions require a supermajority token vote

### 6.5 COMMODITIES — Tangible Stores of Value

**Sub-types:** `"gold"`, `"silver"`, `"agricultural"`, `"timber"`

**Mechanics:**
- Spot price oracle integration for live `pricePerUnit` updates
- Each unit redeemable for underlying commodity via custodian
- `KYCComplianceModule` enforces commodity-specific jurisdiction rules

### 6.6 OTHER — Future-Proof Catch-All

Designed to accommodate asset classes that do not yet exist in regulation — art, collectibles, intellectual property royalties — without requiring a contract upgrade.

### 6.7 RECToken — The Environmental Credit Layer

**Standard:** ERC-1155 multi-token
**Unit:** 1 token = 1 MWh of verified renewable generation
**Token ID encoding:** `YYYYMMDD` format (e.g. `20260101` = January 2026)

Every `RECToken` is linked to a parent `AssetToken` via `recMetadata.assetToken`. The full lifecycle:

| Action | Function | Who calls |
|---|---|---|
| Mint RECs for a period | `mint(to, periodId, mwh)` | `REC_ISSUER_ROLE` (platform) |
| Batch mint across periods | `mintBatch(to, periodIds[], mwh[])` | `REC_ISSUER_ROLE` |
| Finalise a period | `finalisePeriod(periodId)` | `REC_ISSUER_ROLE` |
| Trade/transfer RECs | ERC-1155 standard transfer | Any holder |
| Retire for compliance | `retire(periodId, mwh, reason)` | Any holder (permanent burn) |

RECs are certified to the UK's **REGO (Renewable Energy Guarantees of Origin)** standard and the `certificationBody` / `gridRegion` fields are stored immutably on-chain.

---

## 7. Revenue & Fee Architecture

### 7.1 The Fee Stack — Where Money Flows

Every asset on AssetsGrator generates fees across three touch points, all managed via `FHEFeeManager`:

#### A. Revenue Distribution (via `AssetTreasury.depositRevenue`)
When rental income or energy revenue is deposited:
```
Gross Revenue
├── Platform Cut   (computePlatformCutPlaintext)   → Platform Wallet (USDC)
├── Maintenance Cut (computeMaintenanceCutPlaintext) → Treasury Reserve (USDC, held)
└── Net Yield                                       → Increases token valuationUSD + pricePerUnit
```
The `FHEFeeManager` stores actual fee rates as FHE ciphertexts — auditors with a granted permit can decrypt the rates, but they are never exposed on the public ledger.

#### B. Exit Fee (via `AssetTreasury.redeem`)
When an investor redeems tokens for USDC:
```
Gross Redemption Value
├── Exit Fee (computeExitFeePlaintext) → Platform Wallet (USDC)
└── Net USDC                          → Investor wallet
```

#### C. Energy Revenue Distribution (via `EnergyRevenueDistributor.depositRevenue`)
For energy assets using the specialist distributor:
```
Gross Energy Revenue
├── Platform Fee (platformFeeBps, max 30%)  → Platform Wallet (USDC)
└── Net Amount                              → rewardPerToken accumulator (claimable by all holders)
```

### 7.2 Fee Schedule

| Fee | Rate | Contract | Trigger |
|---|---|---|---|
| **Asset Issuance** | 1–2.5% of asset value | Off-chain | One-time on tokenisation |
| **Platform Revenue Cut** | ~1.5% | `FHEFeeManager` → `AssetTreasury` | On each rental/yield deposit |
| **Maintenance Reserve** | ~1.0% | `FHEFeeManager` → `AssetTreasury` | On each rental/yield deposit |
| **Exit Fee** | ~0.5% | `FHEFeeManager` → `AssetTreasury.redeem` | On investor token redemption |
| **Marketplace Fee** | 0.3% | `AssetMarketplace` | Per secondary market trade |
| **Energy Platform Fee** | Up to 30% cap | `EnergyRevenueDistributor` | On each energy revenue deposit |
| **Oracle Service Fee** | £0.05/MWh | Off-chain | Per verified production report |
| **REC Minting Fee** | 5% of credit value | Off-chain | On RECToken issuance |

> **Note on FHE encryption:** The `platformRevenueBps`, `maintenanceReserveBps`, and `exitFeeBps` rates are stored as `euint32` ciphertexts in `FHEFeeManager`. The plaintext values are known only to the platform operator and any FCA auditor that has been granted a time-bounded `FHE.allow()` permit. Public computations use `computePlatformCutPlaintext()` which performs the calculation without revealing the rate.

### 7.3 Maintenance Reserve

Each `AssetTreasury` holds a `maintenanceReserveBalance` — a portion of revenue ring-fenced for asset upkeep. Only the `AssetGovernance` contract can authorise spending from this reserve via `spendFromReserve(to, amount, reason)`. This prevents the platform from unilaterally extracting maintenance funds.

---

## 8. The FHE Privacy Layer

### 8.1 Why FHE, Not ZK

Zero-knowledge proofs verify that a computation was done correctly — off-chain. FHE lets us *perform* the computation on-chain, inside the cipher, with full EVM composability. For continuous operations like KYC attribute checks, valuation updates, and fee calculations, FHE is the only viable approach.

### 8.2 The Five FHE Contracts

| Contract | Encrypted types | Use case |
|---|---|---|
| `FHEKYCRegistry` | `ebool (IS_ACCREDITED, AML_CLEARED)` | Gate lending and high-value primary sales to accredited investors without revealing their status |
| `FHEAssetValuation` | `euint32 (valuationUSD)` | Store RICS appraisals in ciphertext — prevents price-sensitive data leakage between reporting periods |
| `FHEFeeManager` | `euint32 (platformBps, maintenanceBps, exitFeeBps)` | Commercial margins are never visible on-chain; auditors access via time-bounded permits |
| `FHEPortfolioRegistry` | `euint64 (balance per investor)` | Shadow-synced on every T-REX mint/transfer/burn — no "Rich List" scraping of institutional portfolios |
| `ConfidentialLoan` | `euint64 (principal, collateral, interest)` | Loan terms negotiated in ciphertext; only borrower and lender see final figures |

### 8.3 The FHE Data Flow
```
1. Sensitive input arrives   → FHE.asEuint32(value)    Encrypt client-side
2. Ciphertext stored         → euint32 handle on-chain  Never plaintext
3. On-chain computation      → FHE.add() / FHE.select() Compute in cipher
4. Access grant              → FHE.allow(handle, addr)  Scoped to one address
5. Authorised decryption     → Permit-holder only        Nobody else can read
```

### 8.4 Regulatory Access Model
Regulators and auditors receive scoped, time-bounded decryption permits via `FHE.allow(handle, auditorAddress)`. The grant is:
- **Scoped:** Only specific data handles, not the whole contract
- **Time-bounded:** Expiry enforced at contract level
- **Logged:** The grant event is immutable on-chain — selective disclosure is impossible

---

## 9. Market Analysis

### 9.1 Total Addressable Market

| Market | Size |
|---|---|
| Global RWA tokenisation | $16T projected by 2030 (BCG) |
| UK commercial real estate | £1.4T (MSCI UK) |
| UK renewable energy assets | £200B+ (BEIS installed base) |
| Global carbon/REC credit markets | $2T by 2030 (BloombergNEF) |
| UK HNWI investable assets | £450B+ |

### 9.2 Target Segments

**Investors:**
- HNWIs (FCA definition: >£100k investable / >£250k annual income)
- UK family offices (£1M–£100M AUM)
- Diaspora investors seeking UK property exposure
- ESG-mandated funds requiring verifiable REC/carbon credit integration

**Asset Owners:**
- UK BTL portfolio landlords seeking capital recycling
- Commercial property developers
- Solar and wind farm operators
- Companies with REGO/carbon compliance obligations (REC retirement demand)

---

## 10. Competitive Landscape

| Platform | Standard | Privacy | Asset Classes | Jurisdiction |
|---|---|---|---|---|
| **RealT** | ERC-20 | None | Property only | US (Reg D) |
| **Tokeny** | ERC-3643 | None | Infrastructure | EU-focus |
| **Propy** | ERC-721 | None | Property only | US/EU |
| **Brickken** | ERC-20 | None | Property + Equity | EU |
| **Toucan / Moss** | ERC-20 | None | Carbon only | Global |
| **AssetsGrator** | **ERC-3643** | **FHE — full** | **Property + Energy + Land + Infra + Commodity + REC** | **UK-first + multi-jur** |

---

## 11. Go-To-Market Strategy

**Phase 1 — Regulatory Credibility (Months 1–6)**
- FCA Digital Sandbox participation
- Open-source all 19 contracts + third-party security audit
- Publish FHE privacy whitepaper

**Phase 2 — Controlled Launch (Months 6–12)**
- AR (Appointed Representative) status under FCA principal firm
- 3–5 UK real estate asset listings (target: £15M AUM)
- First energy asset: 5 MW solar PV farm (Midlands)
- First REC pipeline: 5,000 MWh verified → RECToken minted

**Phase 3 — Scale (Year 2)**
- Direct FCA authorisation under Digital Securities Sandbox
- IFA (Independent Financial Adviser) white-label distribution
- £50M AUM across all three verticals
- UAE (ADGM) compliance module activation

---

## 12. Regulatory Strategy

| Regulation | Coverage |
|---|---|
| FSMA 2023 / FCA Digital Securities Sandbox | Primary authorisation target |
| ERC-3643 structural compliance | Transfers auto-reject non-KYC wallets |
| UK GDPR — data minimisation | KYC attributes as FHE booleans: never plaintext PII on-chain |
| FCA financial promotions (s.21 FSMA) | Platform gated behind KYC; no public return projections |
| Ofgem REGO scheme | RECToken `certificationBody` field, `gridRegion = "UK-REGO"` |
| AML/CTF | KYCComplianceModule freeze capability; TrustedIssuersRegistry for claim issuers |

**Gnosis Safe (pre-mainnet):**
All critical admin roles (`AssetFactory` owner, `AssetMarketplace` owner, `TrustedIssuersRegistry` owner) will be transferred to a 2-of-3 multi-sig Safe before mainnet. Current EOA control is testnet-only.

---

## 13. Financial Projections

### Revenue Model

| Fee Stream | Y1 | Y2 | Y3 |
|---|---|---|---|
| Issuance fees (1.5% avg) | £150K | £600K | £2M |
| Management fees (1.5% AUM) | £150K | £750K | £3M |
| Marketplace fees (0.3%) | £50K | £200K | £600K |
| Energy oracle + REC | £10K | £100K | £400K |
| B2B API / licensing | — | £100K | £500K |
| **Total Revenue** | **£360K** | **£1.75M** | **£6.5M** |

### AUM Ramp

| | Y1 | Y2 | Y3 |
|---|---|---|---|
| Real Estate AUM | £8M | £30M | £100M |
| Energy AUM | £1M | £10M | £50M |
| Land / Other | £1M | £5M | £50M |
| **Total AUM** | **£10M** | **£45M** | **£200M** |

### P&L Summary

| | Y1 | Y2 | Y3 |
|---|---|---|---|
| Revenue | £360K | £1.75M | £6.5M |
| Operating costs | £1.1M | £1.5M | £3M |
| **EBITDA** | **(£740K)** | **£250K** | **£3.5M** |

---

## 14. Team & Governance

| Role | Background |
|---|---|
| **CEO & Co-founder** | Platform strategy, regulatory engagement, investor development |
| **CTO & Co-founder** | ERC-3643 architecture, FHE implementation, full-stack engineering |
| **Head of Compliance** | UK financial regulation, FCA authorisation, GDPR, AML |

**Pre-mainnet governance upgrades:**
- Transfer all admin roles to Gnosis Safe (2-of-3)
- Engage RICS-accredited surveyor for UK asset valuations
- Engage trail of Bits or Certik for full contract audit

---

## 15. Funding Ask

**Raising:** £1,500,000 Seed Round
**Instrument:** SAFE Note — 20% discount, £8M valuation cap
**Target close:** Q3 2026

| Allocation | % | Amount |
|---|---|---|
| Legal & regulatory (FCA, SPV, GDPR) | 30% | £450K |
| Engineering (team + audit) | 35% | £525K |
| Business development & marketing | 20% | £300K |
| Operations & infrastructure | 15% | £225K |

**This round unlocks:**
- FCA Digital Sandbox participation
- First 5 live asset listings across property and energy
- AR regulatory status
- Series A bridge at £45M AUM

---

## 16. Risk Analysis

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| FCA authorisation delay | Medium | High | AR structure as interim; proactive DSS engagement |
| Smart contract vulnerability | Low | Critical | Trail of Bits audit; open-source repo; bug bounty |
| FHE compute cost at scale | Medium | Medium | Batched ops; Fhenix mainnet optimisation roadmap |
| Energy oracle data manipulation | Low | High | Authorised `REPORTER_ROLE` only; IPFS evidence CID per report; dispute mechanism on-chain |
| REC double-counting | Low | High | `periodFinalised` mapping prevents re-minting; links to parent `AssetToken` |
| Legal title structuring | Medium | High | SPV per asset; legal counsel engaged |
| Institutional trust gap | Medium | Medium | FCA sandbox, open contracts, RICS valuations |
| Multi-sig key loss | Low | Critical | Gnosis Safe 2-of-3 before mainnet; hardware keys |

---

## 17. Roadmap

| Period | Milestone |
|---|---|
| **Q1 2026 ✅** | 19 contracts deployed on Arbitrum Sepolia. 10 UK properties seeded. FHE Privacy Layer live. |
| **Q2 2026** | `EnergyProductionOracle` integration with real solar data. `RECToken` minting pipeline activated. FCA Digital Sandbox application submitted. |
| **Q3 2026** | Seed round closed (£1.5M). AR status under FCA principal. First 3 live UK property listings. |
| **Q4 2026** | First energy asset live (5 MW solar). First REC batch minted. 2,000 KYC-verified investors. £10M AUM. |
| **Q1 2027** | Direct FCA DSS authorisation. Gnosis Safe multi-sig governance. IFA distribution network. |
| **Q2 2027** | £45M AUM. Energy vertical: 3 assets, £10M. Break-even. Series A preparation. |
| **Q3 2027** | UAE (ADGM) launch. REC secondary market. B2B FHE compliance API. |
| **Q4 2027** | EU (MiCA) compliance module. 300+ assets. £200M AUM target. Series A raise. |

---

## Closing Statement

> *"We are not building a crypto product. We are building the regulated financial infrastructure that institutional capital requires to participate in real assets on-chain — with the privacy of private banking and the auditability that regulators demand."*
>
> **The data never leaves the cipher. The yield flows to the people.**

---

*AssetsGrator Ltd | Confidential | April 2026 | help@assetsgrator.com*
