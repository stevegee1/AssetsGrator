# AssetsGrator

## The First RWA Tokenisation Platform That Is Fully Compliant With Laws and Regulations — While Preserving the Confidentiality of Its Investors

> **Website:** [assetsgrator.com](https://www.assetsgrator.com/)
> **Contact:** [help@assetsgrator.com](mailto:help@assetsgrator.com)
> **Incorporated:** United Kingdom
> **Stack:** ERC-3643 · Fhenix FHE · Solidity 0.8.25 · Hardhat · Helios Testnet

---

## Table of Contents

1. [Overview](#overview)
2. [Why Fhenix — Objectively](#why-fhenix--objectively)
3. [The Architecture](#the-architecture)
4. [Smart Contract Suite](#smart-contract-suite)
5. [Test Coverage](#test-coverage)
6. [Milestone 1 — Completed](#milestone-1--completed)
7. [Milestone 2 — In Progress](#milestone-2--in-progress)
8. [Milestone 3 — Roadmap](#milestone-3--roadmap)
9. [Business & Regulatory Context](#business--regulatory-context)
10. [Contact](#contact)

---

## Overview

**AssetsGrator** is a UK-incorporated financial technology company building a regulated platform for the tokenisation and trading of Real-World Assets (RWA). We enable institutional and accredited investors to participate in fractional ownership of high-value assets — renewable energy projects, commercial real estate, infrastructure, and carbon credits — through blockchain-issued security tokens that are **fully compliant with applicable securities law from day one**.

This is not a crypto speculation product. AssetsGrator is designed to operate within the framework of financial regulation — currently aligned to the UK's FCA token regulatory sandbox and evolving UK digital securities legislation. Every participant on the platform must pass KYC and AML screening before they can hold, transfer, or borrow against any asset. Every transfer is governed by enforceable compliance rules that run automatically on-chain — powered by the **ERC-3643 (T-REX) standard**, which embeds identity verification, jurisdiction checks, and lock-up enforcement directly into the token contract itself, making non-compliant transfers structurally impossible. Regulators and auditors have structured access to exactly the data they are legally entitled to — and nothing more — enforced through **Fhenix Fully Homomorphic Encryption (FHE)**, which issues time-bounded, scoped decrypt permissions (`FHE.allow()`) to authorised parties without exposing any other investor's data on the public chain.

### The Problem We Are Solving

Traditional asset markets are fragmented, illiquid, and inaccessible. A pension fund, family office, or sophisticated individual investor in the UK who wants exposure to a £50M solar farm is locked out — the minimum participation is multi-million pounds, the documentation is opaque, and the secondary market does not exist. Meanwhile, asset owners (developers, project companies) struggle to raise capital efficiently from a broad investor base under a compliant structure.

Blockchain tokenisation solves the liquidity and access problem, but it introduces a new compliance problem: **every transaction is permanently public**. Institutional investors cannot disclose their portfolio compositions to competitors. Borrowers cannot expose their loan terms to the market. Regulated financial data has confidentiality obligations that a standard public blockchain violates by design.

### The AssetsGrator Solution — ERC-3643 × FHE

We have architected a platform where **regulatory compliance and investor confidentiality are not in conflict** — they reinforce each other:

- **ERC-3643 (T-REX Protocol)** is the international standard for regulated security tokens. It embeds identity verification, compliance rules, and transfer restrictions directly into the token contract. Every transfer automatically checks: Is the recipient KYC-verified? Is the jurisdiction permitted? Is the lock-up period satisfied? There is no way to move a token outside these rules — the compliance is structural, not advisory.

- **Fhenix Fully Homomorphic Encryption (FHE)** allows the platform to compute on sensitive financial data — loan amounts, valuations, interest rates, KYC flags — without ever decrypting that data on the public chain. The Fhenix CoFHE runtime is the first and only EVM-compatible FHE execution environment. It means we can run compliance checks, calculate LTV ratios, and compute fees entirely in encrypted form, with only the final authorised result (e.g. net disbursement amount) revealed — and only to the authorised party.

Together, ERC-3643 ensures that **only verified, compliant investors can participate**, and FHE ensures that **their participation is never exposed to the market**. This is the combination that makes institutional adoption viable — and it is why AssetsGrator is built specifically on Fhenix.

The platform's smart contracts are live on the **Fhenix Helios testnet**, with all core protocol logic tested and verified.

### Why AssetsGrator Is a Category First

Existing RWA tokenisation platforms — including well-known projects such as [RealT](https://realt.co/) — have made meaningful progress in fractionalising real-world assets. However, they share a fundamental structural limitation: **compliance is advisory and privacy does not exist**.

RealT, for example, uses standard ERC-20 tokens with off-chain KYC. The KYC check happens in a centralised database before onboarding — but once a token is held, every transfer, every balance, and every transaction is fully visible to any observer on the public chain. There is no on-chain enforcement preventing a non-KYC'd wallet from receiving tokens on a secondary market. There is no mechanism for an investor to participate without broadcasting their position to the world. There is no auditor access framework that is cryptographically enforced. And the platform operates exclusively under US law — it cannot structurally adapt to UK, EU, UAE, or other jurisdictions without rebuilding from scratch.

**AssetsGrator is different in three concrete ways:**

1. **Compliance is on-chain and structural, not off-chain and advisory.** ERC-3643 makes it impossible — at the smart contract level — for any token to move to an unverified wallet, to a sanctioned jurisdiction, or outside a lock-up period. No operator action is required. No database can be circumvented. The law is in the code.

2. **Investor confidentiality is preserved without breaking any law.** Fhenix FHE means that KYC attributes, loan terms, asset valuations, and fee rates are computed on-chain in encrypted form. Investors are private. But they are not anonymous — every encrypted data point is attributable to a verified, on-chain identity. This is the distinction that regulators care about: **confidentiality is not anonymity**. We know exactly who our investors are. The public does not need to.

3. **The platform is fully auditable by authorised parties.** Any regulator, any licensed auditor, in any jurisdiction, can be granted time-bounded and scoped access to specific encrypted records via `FHE.allow()`. This is cryptographically enforced — the firm cannot selectively disclose, modify, or withhold records. The audit trail is immutable and tamper-proof.

This three-way combination — structural compliance, investor confidentiality, and cryptographic auditability — has not been achieved by any existing RWA platform. It is the foundation AssetsGrator is built on.

---


## Why Fhenix — Objectively

This is not a "we added FHE for the grant" project. The following workflows are **architecturally impossible** without on-chain FHE:

### 1. Encrypted KYC / AML Compliance (`FHEKYCRegistry`)
Traditional KYC means KYC data lives in a centralised database, or is hashed and worthless on-chain. With Fhenix, KYC attribute flags (`IS_ACCREDITED`, `AML_CLEARED`) are stored as encrypted booleans (`ebool`). The loan contract **evaluates compliance without knowing the investor's actual risk profile**. An institution can prove they are qualified without disclosing to the world _why_.

### 2. Encrypted Loan Terms (`ConfidentialLoan`)
### 1. Encrypted KYC / AML Attributes (`FHEKYCRegistry`)

**The problem:** KYC data in a centralised database creates a single point of breach and a GDPR liability. Hashed on-chain data is verifiable but computationally useless — you cannot evaluate compliance rules against a hash. Publishing KYC attributes in plaintext exposes investor profiling data to the entire world, which violates data protection law in the UK (UK GDPR), EU (GDPR), and most other jurisdictions we intend to operate in.

**The effect:** With Fhenix FHE, KYC attribute flags (`IS_ACCREDITED`, `AML_CLEARED`) are stored on-chain as encrypted booleans (`ebool`). The loan contract evaluates whether an investor is eligible — without ever seeing the underlying flags in plaintext. The investor proves they qualify without disclosing why. This satisfies the data minimisation principle under UK GDPR and enables AssetsGrator to operate under equivalent data protection frameworks in the US (SEC RegD), UAE (ADGM), and beyond without re-architecting the compliance layer.

---

### 2. Encrypted Loan Terms (`ConfidentialLoan`)

**The problem:** A borrower pledging fractional shares of a £10M solar farm as collateral is negotiating commercially sensitive terms — loan amount, interest rate, and LTV ratio. If those terms are visible on-chain, competitors can undercut us by offering slightly better rates to the same borrower, counterparties can price their own positions against the borrower's known exposure, and the borrower's risk profile becomes permanently public. Furthermore, in some jurisdictions (e.g. the UK's Consumer Duty, MiFID II), financial intermediaries have an obligation not to expose client transaction details unnecessarily.

**The effect:** All four values — loan amount (`euint64`), interest rate (`euint32`), LTV ratio (`euint64`), and platform fee — are passed as encrypted inputs. The Fhenix co-processor computes the net disbursement entirely in FHE. Only the final result (net USDC to disburse) is published via the async decryption callback signed by the Fhenix Threshold Network. No observer at any point can reconstruct what rate was agreed or what fee was charged.

---

### 3. Encrypted Asset Valuation (`FHEAssetValuation`)

**The problem:** If a professional valuer's appraisal of a £30M commercial property is published on-chain, it immediately becomes market-moving information. Arbitrageurs can front-run any liquidity event. Competitors can poach the valuer's methodology. In regulated markets, price-sensitive information must be controlled — premature disclosure of a material valuation can constitute market manipulation under the UK Market Abuse Regulation (UK MAR).

**The effect:** Valuations are submitted as `euint64` ciphertexts. LTV breach computations run entirely in FHE:
```
collateralValue  = encTotalValuation × collateralShares / totalSupply
currentLTV_bps   = encOutstandingDebt × 10,000 / collateralValue
breach           = FHE.gt(currentLTV_bps, encMaxLtvBps)
```
The liquidation trigger is an encrypted boolean — the market never learns the internally-appraised value until a liquidation is formally confirmed by the platform. This keeps AssetsGrator compliant with UK MAR and equivalent non-public price-sensitive information (NPSI) rules in any jurisdiction.

---

### 4. Encrypted Fee Structures (`FHEFeeManager`)

**The problem:** If platform fee rates (revenue share, maintenance reserve, exit fee) are readable on-chain, every competitor can immediately replicate our exact commercial model. A fintech's fee schedule is a core business asset — equivalent to a term sheet or a pricing manual. Exposing it publicly destroys competitive advantage and invites undercutting before we've had the chance to establish market position. Additionally, fee structures may vary by jurisdiction or investor class; a single public rate visible to all parties contradicts the ability to offer differentiated pricing lawfully under different regulatory frameworks.

**The effect:** Platform revenue basis points, maintenance reserve percentages, and exit fees are stored as `euint32` ciphertexts. All fee computation happens in FHE — `computePlatformCutFromHandle(encGrossAmount)` returns the fee as an encrypted value without revealing either the rate or the gross amount to observers. Only the net disbursement is ever published. This allows AssetsGrator to apply jurisdiction-specific or investor-class-specific fee schedules without any public disclosure, and to update rates without broadcasting the change to competitors.

---

### 5. Auditor-Scoped Decrypt Grants (`FHEAccessControl`)

**The problem:** Regulators in different countries have different rights of access to financial data. A UK FCA supervisor, a UAE FSRA examiner, and a Nigerian SEC officer may each have a legitimate but distinct legal entitlement to inspect specific loan records. On a standard blockchain, granting one auditor access to a transaction exposes the entire ledger. On a centralised system, there is no cryptographic guarantee that the firm has not modified the records before disclosure.

**The effect:** Fhenix FHE enables time-bounded, scoped decrypt permissions via `FHE.allow()`. An FCA examiner can be granted a 90-day window to decrypt the terms of a specific loan — and the smart contract enforces that the grant expires, is scoped to that loan only, and cannot be extended without a new on-chain action. The same architecture supports FSRA or SEC examiners with different scopes. Every access grant is itself an immutable on-chain audit trail — the firm cannot selectively disclose or modify what the regulator sees. This is the cryptographic equivalent of a regulated firm's statutory books — trusted, tamper-proof, and access-controlled.


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
│                                                                 │
│              Fhenix FHE Layer (CoFHE Runtime)                   │
│  ┌──────────────┐    ┌─────────────────┐    ┌───────────────┐  │
│  │FHEKYCRegistry│    │FHEAssetValuation│    │ FHEFeeManager │  │
│  │ (ebool attrs)│    │ (euint64 apprais│    │(euint32 rates)│  │
│  └──────────────┘    └─────────────────┘    └───────────────┘  │
│                               │                                 │
│  ┌────────────────────────────▼────────────────────────────┐   │
│  │               ConfidentialLoan                          │   │
│  │  • euint64 loanAmount  • euint32 rateBps                │   │
│  │  • euint64 ltvBps      • euint64 encNetDisbursement     │   │
│  │  • ERC-3643 collateral custody via forcedTransfer       │   │
│  │  • Async FHE decrypt via Fhenix Threshold Network       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Supporting Contracts                                           │
│  ┌──────────────┐    ┌─────────────────┐    ┌───────────────┐  │
│  │AssetMarketpl.│    │ AssetGovernance │    │AssetRegistry  │  │
│  │ (P2P trades) │    │  (DAO voting)   │    │  (Metadata)   │  │
│  └──────────────┘    └─────────────────┘    └───────────────┘  │
│                                                                 │
│  Tokenised Asset Classes                                        │
│  ┌──────────────┐    ┌─────────────────┐    ┌───────────────┐  │
│  │EnergyRevenue │    │  CarbonCredit   │    │   RECToken    │  │
│  │ Distributor  │    │    Token        │    │  (Renewable   │  │
│  │(kWh → USDC)  │    │  (CO₂ offset)   │    │   Energy Cert)│  │
│  └──────────────┘    └─────────────────┘    └───────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technical Challenges & How We Solved Them

### Challenge 1 — ERC-3643 `forcedTransfer` Still Enforces Identity

**Problem:** We assumed `forcedTransfer` fully bypasses compliance so the loan contract (not a KYC'd investor) could custody collateral. In practice, T-REX's `Token.sol` checks `identityRegistry.isVerified(_to)` even inside `forcedTransfer`. Every address — including smart contracts — that receives tokens must be registered.

**Solution:** In the test fixture (and in production deployment), we register the `ConfidentialLoan` contract, the `AssetTreasury`, and the platform treasury wallet in the `IdentityRegistry`. For contracts that are not investors, a mock `onchainID` suffices — the compliance module only checks existence, not claim validity for agent-initiated transfers.

---

### Challenge 2 — FHE ACL Ordering (`allowThis` before `allow`)

**Problem:** Fhenix's `MockACL.allow(handle, account, requester)` requires `isAllowed(handle, requester)` to return true before it will grant access to `account`. Our `FHEFeeManager` was calling `FHE.allow(cut, msg.sender)` _before_ calling `FHE.allowThis(cut)` — meaning the FeeManager tried to grant access before it had access itself.

**Solution:** Always call `FHE.allowThis(handle)` first to establish the contract's own permission, then call `FHE.allow(handle, recipient)`. Additionally, the calling contract (`ConfidentialLoan`) must explicitly grant the FeeManager access to any encrypted value it passes as an argument: `FHE.allow(encAmount, address(feeManager))` before calling `computePlatformCutFromHandle(encAmount)`.

---

### Challenge 3 — EIP-191 vs Raw ECDSA in Mock Threshold Network

**Problem:** Our test helper used `wallet.signMessage(msgHash)` to simulate the Fhenix Threshold Network's decrypt result signature. `wallet.signMessage()` prepends the EIP-191 prefix (`\x19Ethereum Signed Message:\n32`), but `MockTaskManager._verifyDecryptResult` uses raw `ECDSA.recover(keccak256(abi.encodePacked(ctHash, result)), signature)`. The recovered signer never matched → all `publishDisbursalAmount` calls reverted.

**Solution:** Use `new ethers.SigningKey(key).sign(msgHash)` for raw signing: no prefix, matching the contract's verification exactly.

---

### Challenge 4 — T-REX Proxy Initialisation Order

**Problem:** `AssetFactory` deploys `AssetToken` clones that each need their own `IdentityRegistry` and `ModularCompliance` references set via `init()`. Deploying the Factory as a plain constructor (without an ERC1967 proxy) broke the ownership model — the factory's `initialize()` uses `__Ownable_init()` which only works in an upgradeable proxy context.

**Solution:** Deploy all T-REX registry contracts calling `init()` on each (not constructors), then deploy `AssetFactory` implementation and wire it through an `ERC1967Proxy` passing encoded `initialize()` calldata. This mirrors the production T-REX deployment spec and unlocks upgradeable ownership.

---

### Challenge 5 — Proportional LTV with FHE Division

**Problem:** Classic LTV (`loanValue / collateralValue`) requires two encrypted `euint64` values to be divided. Fhenix FHE supports `FHE.div(a, b)` but both operands must be of the same type and security zone. Additionally, collateral value for fractional shares is proportional: `totalValuation × shares / totalSupply`, which mixes encrypted and plaintext values.

**Solution:** We use `FHE.mul(encTotalVal, plainShares)` then `FHE.div(result, plainTotalSupply)` — mixing encrypted × plaintext is efficient and avoids an extra encrypted division. The LTV breach check becomes a single `FHE.gt(encCurrentLTV, encMaxLTV)` returning an `ebool` that the threshold network decrypts asynchronously.

---

## Smart Contract Suite

### Core Platform — `contracts/`

| Contract | Purpose |
|----------|---------|
| `AssetToken.sol` | ERC-3643 security token representing fractional RWA ownership |
| `AssetFactory.sol` | ERC1967 upgradeable factory — deploys token + compliance + treasury for each asset |
| `AssetTreasury.sol` | Receives asset revenue (USDC), splits platform/maintenance/exit fees, distributes to holders |
| `AssetRegistry.sol` | On-chain metadata registry (IPFS CID, category, valuation, legal hash) |
| `AssetMarketplace.sol` | Peer-to-peer secondary market for fractional share transfers |
| `AssetGovernance.sol` | DAO-style proposal and voting for asset parameter changes |
| `KYCComplianceModule.sol` | T-REX modular compliance — checks identity registry on every transfer |
| `CountryRestrictModule.sol` | Jurisdiction-level transfer restrictions (OFAC, EU sanctions) |
| `TimeLocksModule.sol` | Lock-up period enforcement for regulated security tokens |
| `EnergyProductionOracle.sol` | Trusted oracle for kWh production data feeding revenue calculations |
| `EnergyRevenueDistributor.sol` | Auto-distributes energy sale proceeds pro-rata to token holders |
| `CarbonCreditToken.sol` | ERC-3643 carbon offset token with retirement and verification logic |
| `RECToken.sol` | Renewable Energy Certificate token (IEC/RECS standard compatible) |

### FHE Privacy Layer — `contracts/fhe/`

| Contract | Purpose |
|----------|---------|
| `ConfidentialLoan.sol` | FHE-encrypted collateralised USDC loans against fractional RWA shares |
| `FHEKYCRegistry.sol` | Encrypted KYC/AML flag storage with provider-gated attribute writes |
| `FHEAssetValuation.sol` | Encrypted appraisal registry; LTV computation in FHE |
| `FHEFeeManager.sol` | Encrypted fee rates; platform cut computed in FHE on gross loan amounts |
| `FHEAccessControl.sol` | Time-bounded auditor decrypt grants via `FHE.allow()` scoping |

---

## Test Coverage

**Total: 62 tests passing across 3 suites** (run with `npx hardhat test`)

### Suite 1 — `test/RWAPlatform.test.js` (Core Platform)

Tests the full ERC-3643 asset lifecycle end-to-end:

- ✅ Factory deployment with correct fee parameters
- ✅ Asset token deployment with metadata validation
- ✅ Token activation and unpausing lifecycle
- ✅ KYC-gated transfer enforcement (verified vs unverified wallets)
- ✅ Compliance module rejection of non-KYC transfers
- ✅ `AssetTreasury` fee split (platform 2%, maintenance 1%, exit 1.5%)
- ✅ Revenue deposit and pro-rata distribution to token holders
- ✅ Marketplace listing, cancellation, and purchase flow
- ✅ Country-level transfer restriction enforcement
- ✅ AssetFactory admin functions and fee cap validation

### Suite 2 — `test/FHEContracts.test.js` (FHE Privacy Layer)

Unit-tests every FHE contract in isolation with mock encryption:

- ✅ `FHEKYCRegistry` — authorised provider writes encrypted attributes
- ✅ `FHEKYCRegistry` — unauthorised writes are blocked
- ✅ `FHEKYCRegistry` — combined KYC eligibility check (`IS_ACCREDITED ∧ AML_CLEARED`)
- ✅ `FHEAssetValuation` — encrypted valuation registration and retrieval
- ✅ `FHEAssetValuation` — multi-asset valuation tracking
- ✅ `FHEFeeManager` — encrypted platform / maintenance / exit fee computation
- ✅ `FHEFeeManager` — fee update with ACL re-grant
- ✅ `FHEFeeManager` — simulated full loan lifecycle (originate → disburse → repay)

### Suite 3 — `test/ConfidentialLoan.test.js` (Full Lifecycle Integration)

End-to-end integration test of the complete confidential lending workflow:

**Setup & Wiring**
- ✅ Treasury funded and approved
- ✅ `isTreasuryReady` gate check

**KYC Two-Step Flow**
- ✅ Borrower requests KYC verification (encrypted attribute submission)
- ✅ Platform owner publishes KYC result (async FHE decrypt callback)
- ✅ Rejected borrower cannot originate loan

**Origination**
- ✅ Borrower originates loan — collateral shares locked in loan contract via `forcedTransfer`
- ✅ Borrower can decrypt their own encrypted loan amount
- ✅ Stranger cannot read encrypted loan fields (ACL enforcement)

**Disbursal (Two-Step)**
- ✅ `publishDisbursalAmount` — Threshold Network signature verified, net amount stored
- ✅ `confirmDisbursal` — USDC transferred from treasury to borrower, loan status → Active
- ✅ Cannot disburse twice (re-entrancy and status guard)

**Auditor Access**
- ✅ Owner grants time-bounded auditor access via `FHE.allow()`
- ✅ Auditor decrypts loan amount within grant window

**Repayment (Two-Step)**
- ✅ Borrower submits encrypted repayment amount, status → Repaid
- ✅ Collateral remains locked until repayment is collected
- ✅ `collectRepayment` — USDC pulled from borrower; collateral shares returned

**Liquidation (Two-Step)**
- ✅ `checkAndLiquidate` — LTV breach computed entirely in FHE, anyone can call
- ✅ `confirmLiquidation` — collateral transferred to platform treasury
- ✅ Double liquidation attempt reverts correctly

---

## Milestone 1 — Completed ✅

> **Scope:** Full on-chain protocol with privacy-preserving lending

| Deliverable | Status |
|-------------|--------|
| ERC-3643 compliant `AssetToken` + `AssetFactory` | ✅ Done |
| `AssetTreasury` with fee splits and revenue distribution | ✅ Done |
| `KYCComplianceModule` + `CountryRestrictModule` | ✅ Done |
| `AssetMarketplace` (secondary P2P trading) | ✅ Done |
| `AssetGovernance` (DAO voting for asset parameters) | ✅ Done |
| `EnergyProductionOracle` + `EnergyRevenueDistributor` | ✅ Done |
| `CarbonCreditToken` + `RECToken` | ✅ Done |
| `FHEKYCRegistry` — encrypted compliance attributes | ✅ Done |
| `FHEAssetValuation` — encrypted appraisals | ✅ Done |
| `FHEFeeManager` — encrypted fee computation | ✅ Done |
| `FHEAccessControl` — auditor decrypt grants | ✅ Done |
| `ConfidentialLoan` — full FHE-encrypted lending lifecycle | ✅ Done |
| Test suite: 62 tests, 3 suites, all passing | ✅ Done |
| Deployed on Fhenix Helios testnet | ✅ Done |

---

## Milestone 2 — In Progress 🔨

> **Scope:** Frontend dApp + Fhenix Helios production deployment

| Deliverable | Target |
|-------------|--------|
| Borrower portal — KYC submission, loan origination, repayment dashboard | Q2 2025 |
| Investor portal — fractional share purchase, revenue tracking, governance voting | Q2 2025 |
| Platform admin panel — asset deployment, KYC publishing, liquidation management | Q2 2025 |
| Wallet integration — MetaMask / WalletConnect with `cofhe-sdk` browser client | Q2 2025 |
| Real-time encrypted LTV dashboard (borrower-only view via FHE permit) | Q2 2025 |
| Fhenix Helios mainnet deployment scripts + verified contracts | Q2 2025 |
| IPFS integration for asset metadata and legal document CIDs | Q2 2025 |
| Automated revenue distribution from energy oracle data | Q2 2025 |

---

## Milestone 3 — Roadmap 🗺️

> **Scope:** Institutional partnerships, multi-chain, and regulatory framework

| Deliverable | Target |
|-------------|--------|
| Multi-jurisdiction KYC provider integrations (Sumsub, Fractal ID) | Q3 2025 |
| Secondary market order book with encrypted bid/ask via FHE | Q3 2025 |
| Cross-chain collateral bridging (Ethereum ↔ Fhenix) | Q3 2025 |
| Institutional lender whitelisting with FHE credit scoring | Q3 2025 |
| On-chain legal wrapper — tokenisation SPV structure (Nigeria, UAE, UK) | Q4 2025 |
| Carbon credit retirement workflow + MRV oracle integration | Q4 2025 |
| Accredited investor credential NFT (tied to FHE KYC flags) | Q4 2025 |
| DAO treasury management for platform fee redistribution | Q4 2025 |
| Security audit (Trail of Bits / Certik) | Q4 2025 |
| Regulatory sandbox engagement — SEC RegD exemption framework | Q4 2025 |

---

## Business & Regulatory Context

### The Market Opportunity

Global illiquid asset markets — real estate ($350T), infrastructure ($4T), private equity ($12T) — remain inaccessible to the vast majority of investors due to high minimum tickets, complex settlement, and opaque secondary markets. The RWA tokenisation sector is projected to reach **$16 trillion by 2030** (BCG / 21Shares research).

In the UK specifically, the FCA and HM Treasury are actively shaping a regulatory framework for digital securities under the Financial Services and Markets Act 2023. The UK government has committed to making Britain a global hub for digital asset investment — and AssetsGrator is built to operate within that framework, not around it.

We are targeting three immediate market segments:
1. **Renewable energy infrastructure** — solar, wind, and battery storage projects seeking compliant retail/institutional capital
2. **Commercial real estate** — enabling fractional ownership with enforced lock-up, KYC, and transparent yield distribution
3. **Carbon and sustainability credits** — tokenised carbon offsets and RECs with on-chain retirement and MRV verification

### Regulatory Compliance Architecture

AssetsGrator is built to satisfy the compliance expectations of the FCA, institutional legal counsel, and sophisticated investors. The following requirements are met **structurally in the smart contracts** — not through off-chain promises:

| Requirement | How AssetsGrator Addresses It |
|-------------|-------------------------------|
| KYC / AML | `IdentityRegistry` + `FHEKYCRegistry` — every participant verified before any transfer |
| Securities law | ERC-3643 (T-REX) — the global standard for regulated, compliant security tokens |
| Investor accreditation | `IS_ACCREDITED` flag checked (encrypted) before loan origination or high-value participation |
| Regulatory audit access | Time-bounded FHE decrypt grants — auditors see what they are entitled to, nothing more |
| Sanctions compliance | `CountryRestrictModule` — OFAC / HMT / EU sanctions enforced at the transfer level |
| Lock-up / holding periods | `TimeLocksModule` — statutory lock-up periods enforced in the compliance module |
| Tax event transparency | Revenue distributions are on-chain and attributable; investor identity remains private |
| Data protection | KYC attributes stored as FHE ciphertexts — no personal financial data exposed on-chain |

### Why Institutional Investors Cannot Use Standard Blockchain

Any institution putting a £5M position into a tokenised asset on a public ledger today is forced to broadcast:
- Their full portfolio composition to direct competitors
- Their acquisition price to counterparties who will immediately reprice against them
- Their loan exposure to arbitrageurs who can front-run margin calls

This is not a theoretical risk — it is why institutional adoption of public blockchain has stalled. **Confidentiality is a legal and fiduciary obligation for asset managers, not a preference.**

**FHE is the only technology that resolves this at the protocol level.** Zero-knowledge proofs can prove that something is true but cannot compute on private values. Multi-party computation requires always-online participants. Only FHE allows the chain itself to compute on encrypted data — compliance checks, fee calculations, LTV ratios — and return only the authorised result. AssetsGrator is the first RWA platform where institutional compliance and institutional privacy are satisfied simultaneously, in the same transaction.

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
# 62 passing (~3s)
```

### Run Individual Suites
```bash
npx hardhat test test/RWAPlatform.test.js       # Core platform (ERC-3643)
npx hardhat test test/FHEContracts.test.js      # FHE privacy layer
npx hardhat test test/ConfidentialLoan.test.js  # Full lending lifecycle
```

### Deploy to Fhenix Helios
```bash
npx hardhat run scripts/deploy.js --network helios
```

---

## Contact

AssetsGrator is incorporated in the United Kingdom and is building toward FCA regulatory registration for digital securities activities.

| | |
|--|--|
| **Website** | [www.assetsgrator.com](https://www.assetsgrator.com/) |
| **General Enquiries** | [help@assetsgrator.com](mailto:help@assetsgrator.com) |
| **Network** | Fhenix Helios Testnet |
| **Licence** | MIT |

---

*AssetsGrator is a technology platform. Tokenised assets issued through this platform constitute securities and are subject to applicable UK and international financial regulation. The platform's smart contracts are currently deployed on testnet and are pending independent security audit before any mainnet launch.*
