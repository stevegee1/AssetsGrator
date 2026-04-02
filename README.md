# AssetsGrator

## The First RWA Tokenisation Platform That Is Fully Compliant With Laws and Regulations — While Preserving the Confidentiality of Its Investors

> **Website:** [assetsgrator.com](https://www.assetsgrator.com/)
> **Contact:** [help@assetsgrator.com](mailto:help@assetsgrator.com)
> **Incorporated:** United Kingdom
> **Stack:** ERC-3643 · Fhenix CoFHE · Solidity 0.8.25 · Hardhat · Arbitrum Sepolia
> **Whitepaper:** [AssetsGrator Whitepaper](https://silk-parcel-39c.notion.site/AssetsGrator-2f1cb29cfeae80578d25eb78550a4f4b)
---

## Table of Contents

1. [Overview](#overview)
2. [Why Fhenix — Objectively](#why-fhenix--objectively)
3. [FHE Component Flow Diagrams](#fhe-component-flow-diagrams)
4. [The Architecture](#the-architecture)
5. [Smart Contract Suite](#smart-contract-suite)
6. [Test Coverage](#test-coverage)
7. [Milestone 1 — Completed](#milestone-1--completed)
8. [Milestone 2 — Roadmap](#milestone-2--roadmap)
9. [Milestone 3 — Roadmap](#milestone-3--roadmap)
10. [Business & Regulatory Context](#business--regulatory-context)
11. [Contact](#contact)

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

The platform's smart contracts are live on **Arbitrum Sepolia** (the primary Fhenix CoFHE co-processor testnet), with all core protocol logic tested and verified.

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

The following workflows are **architecturally impossible** without on-chain FHE:

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

**The effect:** Platform revenue labels, maintenance reserve percentages, marketplace commissions, and exit fees are stored as `euint32` ciphertexts. To maintain the high-performance settlement required for modern RWA trading, AssetsGrator utilizes a **Synchronous Revelation Bridge**:
- **Encrypted Construction**: Admin inputs are encrypted locally before deployment, ensuring no plaintext leakage in transaction history.
- **One-Time Revelation**: The platform explicitly "reveals" the current active rates via the Fhenix co-processor, caching them for synchronous Solidity math.
- **Atomic Settlement**: This allows `AssetMarketplace` and `AssetTreasury` to perform sub-second, multi-party fee splits in a single transaction, while keeping the underlying commercial governance 100% private during its lifecycle.

---

**The effect:** Fhenix FHE enables time-bounded, scoped decrypt permissions via `FHE.allow()`. An FCA examiner can be granted a 90-day window to decrypt the terms of a specific loan — and the smart contract enforces that the grant expires, is scoped to that loan only, and cannot be extended without a new on-chain action. The same architecture supports FSRA or SEC examiners with different scopes. Every access grant is itself an immutable on-chain audit trail — the firm cannot selectively disclose or modify what the regulator sees. This is the cryptographic equivalent of a regulated firm's statutory books — trusted, tamper-proof, and access-controlled.

---

### 6. Shadow Portfolio Sync (`FHEPortfolioRegistry`)

**The problem:** Public blockchains reveal "Rich Lists," allowing competitors or malicious actors to scrape the exact holdings and net worth of institutional investors. While ERC-3643 ensures only KYC'd users hold tokens, it does not prevent their participation levels from being permanently public. Institutional investors require "Net Worth Privacy" to avoid being targeted and to keep their portfolio allocation strategies confidential.

**The effect:** AssetsGrator implements a high-performance **Shadow Sync** pattern. Every plaintext transfer on the ERC-3643 compliance layer (Solidity 0.8.17) automatically triggers an encrypted balance synchronization in the Fhenix shadow registry (Solidity 0.8.25). This allows the platform to maintain a "Private Snapshot" of each investor's holdings. Total supply remains auditable and public, but individual shareholdings are 100% private, accessible only to the investor and their authorised auditors. This is the final piece of the "Institutional Privacy Stack," securing the participant as much as the asset.



---

## FHE Component Flow Diagrams

Each diagram traces data from an actor's client-side input through encrypted on-chain storage and computation to the authorised output. No plaintext leaves the Fhenix CoFHE co-processor.

---

### 1. `FHEKYCRegistry` — Encrypted KYC / AML

```
 KYC Provider
     │
     ▼
 ┌──────────────────────────────────────────┐
 │  cofhe-sdk (client side)                 │
 │  encryptInputs([IS_ACCREDITED, AML_CLR]) │
 └──────────────┬───────────────────────────┘
                │  encBool₁ 🔒  encBool₂ 🔒
                ▼
 ┌──────────────────────────────────────────┐
 │  FHEKYCRegistry.batchSetKYCAttrs()       │
 │  FHE.asEbool() × 2  ─  store ciphertext  │
 │  FHE.allowThis()  +  FHE.allow(investor) │
 └──────────────┬───────────────────────────┘
                │
                ▼
         ╔══════════════╗
         ║ ebool store  ║  ← never decrypted on public chain
         ╚══════╤═══════╝
                │
     ┌──────────┴─────────────┐
     │  Loan requests KYC     │
     │  verification          │
     └──────────┬─────────────┘
                │
                ▼
 ┌──────────────────────────────────────────┐
 │  FHE.and(IS_ACCREDITED, AML_CLEARED)     │
 │  FHE.decrypt(result)                     │
 │  ── async → Fhenix Threshold Network ──  │
 └────────────┬─────────────────────────────┘
              │
        ◇ result == 1 ?
       /               \
     Yes               No
      │                 │
      ▼                 ▼
  ✅ KYC verified   ❌ Loan blocked
  Loan can proceed

     ──── Auditor Scoped Access ────

 Platform  ──→  FHE.allow(handle, auditor, expiresAt)
                        │
                        ▼
              auditor.decryptForView(handle)
                        │
                        ▼
               true / false   [scoped, expires]
```

---

### 2. `ConfidentialLoan` — Encrypted Loan Lifecycle

```
 Borrower
     │
     ▼
 ┌──────────────────────────────────────────┐
 │  cofhe-sdk  encryptInputs(               │
 │    loanAmt, rateBps, ltvBps )           │
 └──────────────┬───────────────────────────┘
                │  encAmt 🔒  encRate 🔒  encLtv 🔒
                ▼
 ┌──────────────────────────────────────────┐
 │  ConfidentialLoan.originateLoan()        │
 │   ◇ kycVerifiedFor[borrower]?            │
 │     No  ──▶  revert                      │
 │     Yes ──▶  FHE.asEuint64(encAmt)       │
 │              store encrypted terms       │
 └──────┬───────────────────┬───────────────┘
        │                   │
        ▼                   ▼
 forcedTransfer       FHEFeeManager
 borrower → Loan      .computePlatformCut
 collateral 🔒         Plaintext(gross)   ← Synchronous Bridge
                             │
                       feePlain (uint256)
                             │
                       FHE.asEuint64(fee)
                             │
                       FHE.sub(encAmt, encFee)
                             │  encNet 🔒
                       FHE.decrypt(encNet)
                       async → Threshold Network
                             │
                   ┌─────────┴──────────┐
                   │ publishDisbursal    │
                   │ Amount(sig)        │
                   └─────────┬──────────┘
                             │
                   confirmDisbursal()
                   Treasury ──▶ Borrower
                         netUSDC 💰
                             │
                    ┌────────┴────────┐
                    │  Loan ACTIVE    │
                    └───┬─────────┬──┘
                        │         │
               Borrower repays   LTV breach check
                        │         │  (FHE.gt — no leak)
                   repayLoan()    ▼
                      🔒      confirmLiquidation()
                        │     Collateral → Treasury 🚨
                   REPAID        LIQUIDATED

     ──── Auditor Access ────

 FHE.allow(encAmt, auditor, expiresAt)
 auditor.decryptForView(encAmt)  [time-bounded]
```

---

### 3. `FHEAssetValuation` — Encrypted Asset Valuation

```
 Licensed Valuator
     │
     ▼
 ┌──────────────────────────────────────────┐
 │  cofhe-sdk  encryptInputs([£15,000,000]) │
 └──────────────┬───────────────────────────┘
                │  encVal euint64 🔒
                ▼
 ┌──────────────────────────────────────────┐
 │  FHEAssetValuation.registerAsset()       │
 │  FHE.asEuint64(encVal)                   │
 │  FHE.allowThis()  +  FHE.allow(owner)   │
 └──────────────┬───────────────────────────┘
                │
                ▼
         ╔══════════════╗
         ║ euint64 store║  ← no public appraisal leak
         ╚══════╤═══════╝
                │
     ┌──────────┴────────────────────┐
     │  ConfidentialLoan  LTV check  │
     └──────────┬────────────────────┘
                │
                ▼
 ┌──────────────────────────────────────────┐
 │  collatVal = encTotalVal × shares/supply │
 │  curLTV    = encDebt × 10000 / collatVal │
 │  breach    = FHE.gt(curLTV, encMaxLtv)  │
 │  ── all computed inside FHE ──           │
 │  FHE.decrypt(breach)  async              │
 └────────────┬─────────────────────────────┘
              │
        ◇ breach == true ?
       /               \
     Yes               No
      │                 │
      ▼                 ▼
  confirmLiquidation  Loan stays ACTIVE
  Collateral seized 🚨

     ──── Auditor Access ────

 grantValuationAccess(asset, auditor, expiresAt)
 auditor.decryptForView(encTotalVal)
         │
         ▼
  £15,000,000  [scoped, expires, immutable grant trail]
```

---

### 4. `FHEFeeManager` — Synchronous Revelation Bridge

```
 ┌──────────────────────────────────────────────────────┐
 │  PHASE 1 — Encrypted Construction                    │
 │                                                      │
 │  Admin  ──▶  cofhe-sdk.encryptInputs(                │
 │                platformBps, maintenanceBps,          │
 │                exitBps, marketplaceBps )             │
 │          encP 🔒  encM 🔒  encE 🔒  encMkt 🔒        │
 │                │                                     │
 │                ▼                                     │
 │  FHEFeeManager.deploy(encP, encM, encE, encMkt,...)  │
 │  FHE.asEuint32() × 4  ←  store as ciphertext        │
 │  FHE.allowThis() × 4  +  FHE.allow(owner) × 4      │
 └──────────────────────────────────────────────────────┘
                │
                ▼
 ┌──────────────────────────────────────────────────────┐
 │  PHASE 2 — One-Time Revelation  (admin triggers)     │
 │                                                      │
 │  requestRevelation()                                 │
 │  FHE.decrypt × 4  ──▶  Fhenix Threshold Network     │
 │                                                      │
 │  revealRate(Platform,    200, sig) ──▶ cache = 200  │
 │  revealRate(Maintenance, 100, sig) ──▶ cache = 100  │
 │  revealRate(Exit,        150, sig) ──▶ cache = 150  │
 │  revealRate(Marketplace, 100, sig) ──▶ cache = 100  │
 └──────────────────────────────────────────────────────┘
                │
                ▼
 ┌──────────────────────────────────────────────────────┐
 │  PHASE 3 — Synchronous Settlement  (every trade)    │
 │                                                      │
 │  AssetTreasury / Marketplace calls:                  │
 │                                                      │
 │  computePlatformCutPlaintext(gross)                  │
 │    ──▶  gross × _pPlatformBps / 10000               │
 │         single SLOAD — no FHE overhead              │
 │                                                      │
 │  computeMaintenanceCutPlaintext(gross)               │
 │  computeExitFeePlaintext(gross)                      │
 │  computeMarketplaceFeePlaintext(gross)               │
 │                                                      │
 │  All four splits in one atomic tx  💰                │
 └──────────────────────────────────────────────────────┘

     ── Rate Update (optional) ──

 Admin ──▶ updatePlatformRevenueBps(newBps)
           FHE.asEuint32(newBps)
           FHE.allow(handle, owner)
           _pPlatformBps = newBps  ← cache synced immediately
```

---

### 5. `FHEPortfolioRegistry` — Shadow Portfolio Sync

```
 AssetFactory
     │
     ▼  deploys with portfolioRegistry wired
 ┌──────────────────────────────────────────┐
 │  AssetToken  (ERC-3643, Solidity 0.8.17) │
 │  holds reference to FHEPortfolioRegistry │
 └──────┬───────────────┬──────────────┬────┘
        │               │              │
      _mint()       _transfer()     _burn()
        │               │              │
        └───────────────┴──────────────┘
                        │
                 _syncPortfolio()
                 [internal hook]
                        │
                        ▼
 ┌──────────────────────────────────────────┐
 │  FHEPortfolioRegistry.syncBalance(       │
 │    investor, newBalance )                │
 │                                          │
 │  FHE.asEuint64(newBalance) 🔒            │
 │  FHE.allowThis()                         │
 │  FHE.allow(investor)                    │
 └──────────────┬───────────────────────────┘
                │
                ▼
         ╔═══════════════════════╗
         ║  euint64 balance      ║
         ║  per asset/investor   ║  ← shadow encrypted store
         ╚═══════╤═══════════════╝
                 │
     ┌───────────┼────────────────┐
     │           │                │
  Investor    Auditor           Public
     │           │                │
     ▼           ▼                ▼
 own handle  FHE.allow()     ACL blocks
 decrypt ✅  scoped grant   ❌ no access
             time-bounded
             decrypt ✅

  Public chain: totalSupply visible ✅
  Individual holdings: 🔒 always encrypted
```


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
│  └──────┬───────┘    └────────┬────────┘    └──────┬────────┘  │
│         │                     │                    │           │
│  ┌──────▼───────┐    ┌────────▼────────┐    ┌──────▼────────┐  │
│  │FHEPortfolioR.│    │ FHEAccessControl│    │ConfidentialLoa│  │
│  │(euint64 bals)│    │ (Scoped Grants) │    │ (euint terms) │  │
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

**Total: 84 tests passing across 4 suites** (run with `npx hardhat test`)

### Suite 1 — `test/RWAPlatform.test.js` (Core Platform)

### Suite 2 — `test/FHEContracts.test.js` (FHE Privacy Layer)

### Suite 3 — `test/ConfidentialLoan.test.js` (Full Lending Lifecycle)

### Suite 4 — `test/PortfolioAndFeeBridge.test.js` (Portfolio & Fee Bridge)

New suite added post-milestone — covers:
- Shadow Sync triggers on mint, transfer, burn, and forcedTransfer
- Asset-scoped registry isolation (multiple assets)
- MockFHEFeeManagerV2 — marketplace commission, all fee types, update logic
- AssetFactory V2 — portfolioRegistry and fheFeeManager wired correctly
- AssetTreasury — revenue split via updated fee bridge

- Factory deployment with correct fee parameters
- Asset token deployment with metadata validation
- Token activation and unpausing lifecycle
- KYC-gated transfer enforcement (verified vs unverified wallets)
- Compliance module rejection of non-KYC transfers
- `AssetTreasury` fee split (platform 2%, maintenance 1%, exit 1.5%)
-  Revenue deposit and pro-rata distribution to token holders
-  Marketplace listing, cancellation, and purchase flow
-  Country-level transfer restriction enforcement
-  AssetFactory admin functions and fee cap validation

### Suite 2 — `test/FHEContracts.test.js` (FHE Privacy Layer)

Unit-tests every FHE contract in isolation with mock encryption:

-  `FHEKYCRegistry` — authorised provider writes encrypted attributes
-  `FHEKYCRegistry` — unauthorised writes are blocked
-  `FHEKYCRegistry` — combined KYC eligibility check (`IS_ACCREDITED ∧ AML_CLEARED`)
-  `FHEAssetValuation` — encrypted valuation registration and retrieval
-  `FHEAssetValuation` — multi-asset valuation tracking
-  `FHEFeeManager` — encrypted platform / maintenance / exit fee computation
-  `FHEFeeManager` — fee update with ACL re-grant
-  `FHEFeeManager` — simulated full loan lifecycle (originate → disburse → repay)

### Suite 3 — `test/ConfidentialLoan.test.js` (Full Lifecycle Integration)

End-to-end integration test of the complete confidential lending workflow:

**Setup & Wiring**
-  Treasury funded and approved
-  `isTreasuryReady` gate check

**KYC Two-Step Flow**
-  Borrower requests KYC verification (encrypted attribute submission)
-  Platform owner publishes KYC result (async FHE decrypt callback)
-  Rejected borrower cannot originate loan

**Origination**
-  Borrower originates loan — collateral shares locked in loan contract via `forcedTransfer`
-   Borrower can decrypt their own encrypted loan amount
-   Stranger cannot read encrypted loan fields (ACL enforcement)

**Disbursal (Two-Step)**
-  `publishDisbursalAmount` — Threshold Network signature verified, net amount stored
-  `confirmDisbursal` — USDC transferred from treasury to borrower, loan status → Active
-  Cannot disburse twice (re-entrancy and status guard)

**Auditor Access**
-  Owner grants time-bounded auditor access via `FHE.allow()`
-  Auditor decrypts loan amount within grant window

**Repayment (Two-Step)**
-  Borrower submits encrypted repayment amount, status → Repaid
-  Collateral remains locked until repayment is collected
-  `collectRepayment` — USDC pulled from borrower; collateral shares returned

**Liquidation (Two-Step)**
-  `checkAndLiquidate` — LTV breach computed entirely in FHE, anyone can call
-  `confirmLiquidation` — collateral transferred to platform treasury
-  Double liquidation attempt reverts correctly

---

## Milestone 1 — Completed

> **Scope:** Full on-chain protocol with privacy-preserving lending

| Deliverable | Status |
|-------------|--------|
| ERC-3643 compliant `AssetToken` + `AssetFactory` |  Done |
| `AssetTreasury` with fee splits and revenue distribution |  Done |
| `KYCComplianceModule` + `CountryRestrictModule` |  Done |
| `AssetMarketplace` (secondary P2P trading) |  Done |
| `AssetGovernance` (DAO voting for asset parameters) |  Done |
| `EnergyProductionOracle` + `EnergyRevenueDistributor` |  Done |
| `CarbonCreditToken` + `RECToken` | Done |
| `FHEKYCRegistry` — encrypted compliance attributes |  Done |
| `FHEAssetValuation` — encrypted appraisals |  Done |
| `FHEFeeManager` — encrypted fee computation |  Done |
| `FHEAccessControl` — auditor decrypt grants |  Done |
| `ConfidentialLoan` — full FHE-encrypted lending lifecycle |  Done |
| Test suite: 62 tests, 3 suites, all passing |  Done |
| Deployed on Arbitrum Sepolia (Fhenix CoFHE testnet) |  Done |

### Deployed Contract Addresses (Arbitrum Sepolia — Chain ID 421614)

> Deployed: 2026-03-30 · Deployer: `0x6d30492c8B55657fc0e6D7F40aB53bbDE22Acc77`

**T-REX Infrastructure**

| Contract | Address |
|---|---|
| `ClaimTopicsRegistry` | [0x827c98d9…](https://sepolia.arbiscan.io/address/0x827c98d9b5C361e7d0b1748A40B1Ea34162Ff979) |
| `TrustedIssuersRegistry` | [0x7b1E2919…](https://sepolia.arbiscan.io/address/0x7b1E2919D2B6bacB66Ec2745c845Df5d739Da349) |
| `IdentityRegistryStorage` | [0x493390e9…](https://sepolia.arbiscan.io/address/0x493390e984E71A709DE7C5aE05088492C75eA357) |
| `IdentityRegistry` | [0xE413130d…](https://sepolia.arbiscan.io/address/0xE413130d308d1587d0E080E9FFB4bb2826952701) |
| `ModularCompliance` | [0x5Ff18c5a…](https://sepolia.arbiscan.io/address/0x5Ff18c5a7DEEC9265C25741012f4c946F07328c8) |
| `KYCComplianceModule` | [0xBFd57754…](https://sepolia.arbiscan.io/address/0xBFd57754e52A7277f326d480CCEcD679c17892Ed) |

**Asset Platform**

| Contract | Address |
|---|---|
| `AssetToken` (impl) | [0xcbfC0Ad4…](https://sepolia.arbiscan.io/address/0xcbfC0Ad45EaF06C3B923e64959eAa0A6B369f83b) |
| `AssetFactory` | [0x3f26043b…](https://sepolia.arbiscan.io/address/0x3f26043bb5ac3058C8963D2C24dd1D1eC4D0CE67) |
| `AssetMarketplace` | [0x6030A334…](https://sepolia.arbiscan.io/address/0x6030A334fAcc6a207f1Ceb6fdbdc62EA01aC7f63) |
| `AssetRegistry` | [0x1bc8e14F…](https://sepolia.arbiscan.io/address/0x1bc8e14Fa92ab6F8Bf18832935f44C5704C436aD) |
| `AssetGovernance` | [0xA2A3222D…](https://sepolia.arbiscan.io/address/0xA2A3222D0ACB90428241Caa230B2148aE74d6a0e) |
| `MockUSDC` | [0x5cDc5E3a…](https://sepolia.arbiscan.io/address/0x5cDc5E3a8eC911e13A2261Ed177dED7EE6B1F4DE) |

**FHE Privacy Layer**

| Contract | Address |
|---|---|
| `FHEKYCRegistry` | [0xA2c3c3B9…](https://sepolia.arbiscan.io/address/0xA2c3c3B96FA38f3eb6E384E7602860d62aDC3fD5) |
| `FHEAssetValuation` | [0x13C9B635…](https://sepolia.arbiscan.io/address/0x13C9B635bc1F6D72616ED6dd9DE092209584743b) |
| `FHEFeeManager` | [0xFF9d2eA9…](https://sepolia.arbiscan.io/address/0xFF9d2eA96821d426Fc681177F625bD7052F18662) |
| `FHEPortfolioRegistry` | [0xA62a1612…](https://sepolia.arbiscan.io/address/0xA62a161251fEd2eb2cfdA5e328055A47d08dA360) |
| `ConfidentialLoan` | [0x9485Fa34…](https://sepolia.arbiscan.io/address/0x9485Fa34Af83488f967647D445689F535378cc87) |


---

## Milestone 2 — Roadmap

> **Scope:** Frontend dApp + Fhenix production deployment

| Deliverable | Target |
|-------------|--------|
| Improved Borrower portal — KYC submission, loan origination, repayment dashboard | Q2 2026 |
| Improved Investor portal — fractional share purchase, revenue tracking, governance voting | Q2 2026 |
| Improved Platform admin panel — KYC publishing, liquidation management | Q2 2026 |
| Wallet integration — MetaMask / WalletConnect with `cofhe-sdk` browser client | Q2 2026 |
| Real-time encrypted LTV dashboard (borrower-only view via FHE permit) | Q2 2026 |
| Arbitrum Sepolia verified contracts + Arbiscan source verification | Q2 2026 |
| IPFS integration for asset metadata and legal document CIDs | Q2 2026 |
| Automated revenue distribution from energy oracle data | Q2 2026 |

---

## Milestone 3 — Roadmap

> **Scope:** Institutional partnerships, multi-chain, and regulatory framework

| Deliverable | Target |
|-------------|--------|
| Multi-jurisdiction KYC provider integrations (Sumsub, Fractal ID) | Q3 2026 |
| Secondary market order book with encrypted bid/ask via FHE | Q3 2026 |
| Cross-chain collateral bridging (Ethereum ↔ Arbitrum) | Q3 2026 |
| Institutional lender whitelisting with FHE credit scoring | Q3 2026 |
| On-chain legal wrapper — tokenisation SPV structure (Nigeria, UAE, UK) | Q4 2026 |
| Carbon credit retirement workflow + MRV oracle integration | Q4 2026 |
| Accredited investor credential NFT (tied to FHE KYC flags) | Q4 2026 |
| DAO treasury management for platform fee redistribution | Q4 2026 |
| Security audit (Trail of Bits / Certik) | Q4 2026 |
| Regulatory sandbox engagement — FCA Digital Securities Sandbox | Q4 2026 |

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
# 84 passing (~4s)
```

### Run Individual Suites
```bash
npx hardhat test test/RWAPlatform.test.js       # Core platform (ERC-3643)
npx hardhat test test/FHEContracts.test.js      # FHE privacy layer
npx hardhat test test/ConfidentialLoan.test.js  # Full lending lifecycle
```

### Deploy to Arbitrum Sepolia (Fhenix CoFHE)
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
| **Network** | Arbitrum Sepolia (Fhenix CoFHE) |
| **Licence** | MIT |

---

*AssetsGrator is a technology platform. Tokenised assets issued through this platform constitute securities and are subject to applicable UK and international financial regulation. The platform's smart contracts are currently deployed on testnet and are pending independent security audit before any mainnet launch.*
