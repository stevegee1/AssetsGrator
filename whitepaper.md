# AssetsGrator: A Cryptographically Enforced, Multi-Asset Real-World Tokenisation Protocol

**Technical Whitepaper — Version 1.0**
**AssetsGrator Ltd · London, England · April 2026**
**Confidential — For Approved Investors and Regulatory Reviewers**

> *"The data never leaves the cipher. The yield flows to the people."*

---

## Abstract

This paper presents AssetsGrator — a regulated, institutional-grade platform for the on-chain tokenisation of real-world assets (RWAs) across six asset categories: real estate, land, renewable energy, infrastructure, commodities, and environmental credits. AssetsGrator is distinguished by two foundational technical properties that no existing tokenisation platform simultaneously achieves:

1. **Structural compliance enforcement** via the ERC-3643 (T-REX) security token standard, in which KYC verification, jurisdiction rules, and lock-up periods are cryptographically embedded at the token transfer level — making non-compliant transfers impossible, not merely prohibited.

2. **Cryptographic investor privacy** via Fhenix Fully Homomorphic Encryption (CoFHE), in which sensitive financial data — KYC attributes, asset valuations, fee rates, portfolio balances, and loan terms — are computed on-chain inside the cipher, never exposed in plaintext on the public ledger.

The result is a platform architecture that satisfies two historically contradictory institutional requirements: full regulatory auditability and full investor confidentiality. This paper documents the technical design, smart contract architecture, cryptographic privacy model, asset lifecycle mechanics, energy production infrastructure, environmental credit framework, economic model, and regulatory compliance strategy.

As of April 2026, AssetsGrator has deployed **19 smart contracts** on Arbitrum Sepolia (Chain ID 421614), with **5 FHE privacy contracts** live and **10 UK real estate tokens** seeded on-chain.

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Background and Prior Work](#2-background-and-prior-work)
3. [System Architecture Overview](#3-system-architecture-overview)
4. [The ERC-3643 Compliance Layer](#4-the-erc-3643-compliance-layer)
5. [The FHE Privacy Layer](#5-the-fhe-privacy-layer)
6. [Asset Factory and Token Lifecycle](#6-asset-factory-and-token-lifecycle)
7. [Asset Categories and On-Chain Metadata](#7-asset-categories-and-on-chain-metadata)
8. [The Renewable Energy Stack](#8-the-renewable-energy-stack)
9. [Renewable Energy Certificate (REC) Framework](#9-renewable-energy-certificate-rec-framework)
10. [Treasury and Revenue Distribution Architecture](#10-treasury-and-revenue-distribution-architecture)
11. [Governance Model](#11-governance-model)
12. [Economic Model and Fee Architecture](#12-economic-model-and-fee-architecture)
13. [Regulatory Framework and Legal Structure](#13-regulatory-framework-and-legal-structure)
14. [Security Analysis](#14-security-analysis)
15. [Deployment and Infrastructure](#15-deployment-and-infrastructure)
16. [Roadmap](#16-roadmap)
17. [Conclusion](#17-conclusion)
18. [References](#18-references)

---

## 1. Introduction

### 1.1 The Real Asset Access Problem

Real-world assets — UK commercial property, renewable energy infrastructure, agricultural land, toll roads, and environmental credits — represent the largest store of wealth in the global economy. According to BCG and HSBC, the combined value of illiquid real-world assets globally is estimated at **$16 trillion**, with UK-specific markets alone exceeding **£1.6 trillion** across real estate and renewable energy.

Access to these asset classes has historically been restricted by structural barriers:

- **Capital thresholds**: Commercial real estate typically requires £250,000 or more of minimum investment. Renewable energy project participation is typically available only to private equity funds with £1M+ minimum commitments.
- **Illiquidity**: Secondary markets for real asset interests barely exist. A property investor is typically locked in for 5–10 years.
- **Information asymmetry**: Asset valuations, lease terms, and income streams are not standardised or publicly available.
- **Jurisdictional fragmentation**: Cross-border participation in UK real assets is operationally complex and legally fraught.

Blockchain tokenisation addresses all four. Fractional security tokens can reduce minimum participation to any denomination, create programmable secondary markets, standardise on-chain metadata, and automate cross-border compliance rules. The RWA tokenisation market is forecast to reach $16 trillion in tokenised assets by 2030 (BCG, 2023).

### 1.2 The Privacy Paradox of Public Ledgers

Standard blockchain tokenisation, however, introduces a fatal problem for institutional investors: **radical transparency**.

On a public EVM chain:
- Every wallet balance is visible
- Every transfer is traceable
- Every on-chain data field — valuations, fee rates, portfolio compositions — is readable by any observer

This is incompatible with institutional participation. A sovereign wealth fund acquiring a position in a £50M London office tower cannot broadcast that position to competitors and counterparties in real time. A corporate borrower cannot expose its loan-to-value ratio to the open market. A fund manager cannot allow its portfolio composition to be scraped and reverse-engineered.

Every existing RWA tokenisation platform forces a binary choice: **compliance** (regulators can see everything, so can everyone else) or **confidentiality** (data is kept off-chain, destroying auditability). No platform resolves both simultaneously.

### 1.3 The Compliance Gap

ERC-20-based tokenisation platforms enforce KYC in a centralised database. The token itself has no awareness of compliance rules. An operator can bypass the database and transfer tokens to any wallet. This is not structural compliance — it is administrative compliance, fragile to insider action and incompatible with regulatory expectations for financial securities.

The ERC-3643 standard (T-REX protocol), developed by Tokeny Solutions, solves this by embedding compliance logic directly in the token transfer function. AssetsGrator adopts this standard as the foundational compliance layer.

### 1.4 AssetsGrator's Contribution

AssetsGrator combines three innovations into a single, production-deployed system:

| Layer | Innovation | Standard |
|---|---|---|
| Compliance | Structural KYC enforcement at transfer level | ERC-3643 (T-REX v4) |
| Privacy | On-chain encrypted computation | Fhenix CoFHE |
| Multi-asset | Single factory for 6 asset categories | Custom `AssetFactory` |

This is not a theoretical framework. All components described in this paper are live on Arbitrum Sepolia as of Q1 2026.

---

## 2. Background and Prior Work

### 2.1 Real-World Asset Tokenisation

The tokenisation of real-world assets on public blockchains has progressed through several distinct generations:

**Generation 1 (2018–2021): ERC-20 wrappers.** Platforms such as RealT (US residential property), Propy (property deeds), and early Polymath deployments tokenised assets as standard ERC-20 tokens with off-chain compliance databases. KYC was enforced at the application layer, not the protocol layer. Token transfers were technically unrestricted.

**Generation 2 (2021–2024): ERC-3643.** The T-REX protocol, developed by Tokeny Solutions and standardised as EIP-3643, moved compliance logic into the token itself. Platforms including Tokeny, Securitize, and INX adopted this standard. However, these platforms remained entirely transparent — all on-chain data, including investor positions and fee structures, was publicly visible.

**Generation 3 (2024–present): Privacy-preserving RWA.** Emerging platforms have begun exploring ZK-proof-based compliance attestation (e.g. Polygon ID, zkKYC). These approaches verify that a computation was performed correctly without revealing inputs, but they do not enable on-chain computation on private data. FHE represents a different capability: computing on encrypted data directly, inside the EVM.

AssetsGrator is the first production deployment of Generation 3 architecture for multi-asset RWA tokenisation.

### 2.2 Fully Homomorphic Encryption

Fully Homomorphic Encryption (FHE) is a form of encryption that permits arbitrary computation to be performed on ciphertext, producing an encrypted result that, when decrypted, is identical to the result of performing the same computation on the plaintext.

Formally, for an FHE scheme `Enc`:
```
Dec(f(Enc(x), Enc(y))) = f(x, y)
```

The theoretical possibility of FHE was established by Craig Gentry in 2009. Practical implementations have been developed through TFHE (Chillotti et al., 2016), CKKS (Cheon et al., 2017), and BFV schemes. Fhenix implements an EVM-compatible FHE co-processor (CoFHE) using the TFHE scheme, optimised for boolean and integer operations relevant to financial smart contracts.

### 2.3 ERC-3643 (T-REX Standard)

ERC-3643, proposed by Joachim Lebrun et al. and standardised in 2023, defines a framework for regulated security tokens on EVM blockchains. Its core innovation is the **`_beforeTokenTransfer` hook** pattern: every ERC-20 transfer check calls a pluggable `ModularCompliance` contract, which may invoke any number of `IComplianceModule` plugins. Each plugin can independently accept or revert a proposed transfer.

The result is a token that is structurally incapable of transferring to a non-compliant wallet — the EVM itself enforces the rule. This is categorically different from administrative compliance, where a regulator must trust that the operator is enforcing the rules.

---

## 3. System Architecture Overview

AssetsGrator is a layered system. From bottom to top:

```
┌─────────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER                        │
│  Next.js frontend · Wagmi · RainbowKit · WalletConnect       │
├─────────────────────────────────────────────────────────────┤
│                     PLATFORM CONTRACTS                       │
│  AssetFactory · AssetMarketplace · AssetRegistry             │
│  AssetGovernance · AssetTreasury · EnergyRevenueDistributor  │
├─────────────────────────────────────────────────────────────┤
│                   ERC-3643 COMPLIANCE LAYER                  │
│  IdentityRegistry · ModularCompliance · KYCComplianceModule  │
│  ClaimTopicsRegistry · TrustedIssuersRegistry                │
├─────────────────────────────────────────────────────────────┤
│                      FHE PRIVACY LAYER                       │
│  FHEKYCRegistry · FHEAssetValuation · FHEFeeManager          │
│  FHEPortfolioRegistry · ConfidentialLoan                     │
├─────────────────────────────────────────────────────────────┤
│                    EXECUTION ENVIRONMENT                      │
│  Arbitrum Sepolia (Chain ID 421614) · Fhenix CoFHE           │
└─────────────────────────────────────────────────────────────┘
```

### 3.1 Design Principles

**Structural over administrative compliance.** Rules are embedded in the token, not enforced by the application. A compromised frontend cannot transfer tokens to non-KYC wallets.

**Confidentiality by cryptography, not by trust.** Sensitive data is encrypted at the point of storage. No party — including AssetsGrator Ltd — can access investor KYC attributes, valuations, or loan terms without explicit, time-bounded, on-chain permission grants.

**Multi-asset from genesis.** The same compliance stack, treasury infrastructure, and fee management contracts serve all six asset categories. New asset types do not require new contract deployments.

**EIP-1167 clone efficiency.** Asset deployments use the minimal proxy pattern. Each new asset token clones from a shared implementation, reducing deployment cost by approximately 90% compared to full contract deployments.

**Composability.** Every contract exposes a clean interface. The `AssetFactory`, `AssetMarketplace`, `EnergyRevenueDistributor`, and `RECToken` are independently composable with external protocols.

---

## 4. The ERC-3643 Compliance Layer

### 4.1 Architecture

The T-REX compliance infrastructure consists of five shared contracts deployed once and reused by all asset tokens:

| Contract | Address (Arbitrum Sepolia) | Function |
|---|---|---|
| `ClaimTopicsRegistry` | `0x827c98d9…` | Registry of required KYC claim topic IDs |
| `TrustedIssuersRegistry` | `0x7b1E2919…` | Whitelist of authorised KYC claim issuers |
| `IdentityRegistryStorage` | `0x493390e9…` | Persistent identity data store (upgradeable) |
| `IdentityRegistry` | `0xE413130d…` | Master registry — checked on every transfer |
| `ModularCompliance` (impl) | `0x5Ff18c5a…` | Pluggable compliance module host (EIP-1167 cloned per asset) |
| `KYCComplianceModule` | `0xBFd57754…` | Stateless plugin verifying KYC on every transfer |

### 4.2 Transfer Validation Flow

When `AssetToken.transfer(recipient, amount)` is called, the ERC-3643 hook executes the following logic before any balance update:

```
transfer(recipient, amount)
  └── _beforeTokenTransfer(sender, recipient, amount)
        └── ModularCompliance.transferred(sender, recipient, amount)
              └── KYCComplianceModule.moduleTransferAction(sender, recipient, amount)
                    └── IdentityRegistry.isVerified(recipient)
                          ├── TRUE  → transfer proceeds
                          └── FALSE → REVERT("Compliance: recipient not verified")
```

This rejection happens at the EVM level. No amount of application-layer manipulation can force a transfer to a non-verified wallet. The compliance rule is as strong as the blockchain's own consensus mechanism.

### 4.3 KYC Claim Structure

KYC status is stored as on-chain claims against ONCHAINID identity contracts. Each investor holds an ONCHAINID, to which claims of type `TOPIC_ID = 1` (basic KYC) are issued by a trusted issuer registered in `TrustedIssuersRegistry`.

When `IdentityRegistry.isVerified(address)` is called:
1. It retrieves the investor's ONCHAINID address.
2. It checks that the ONCHAINID holds a valid claim of the required topic.
3. It checks that the claim was issued by a trusted issuer.
4. If all checks pass, the investor is considered verified.

This architecture is intentionally decentralised: the KYC claim issuer and the token operator are distinct roles. A regulated KYC provider can issue claims independently of the platform.

### 4.4 Compliance Modules

`ModularCompliance` is a pluggable host. Beyond `KYCComplianceModule`, the protocol supports:

- **`TimeLocksModule`**: Enforces statutory holding periods. An investor who acquires tokens in a primary sale cannot transfer them until a specified `unlockTime` has passed. Used for real estate assets under UK investor protection rules.
- **`CountryRestrictModule`**: Blocks transfers to wallets associated with sanctioned jurisdictions. Updated via `TrustedIssuersRegistry` governance.
- **`MaxBalanceModule`**: Caps any single address's token holding at a defined percentage of total supply — enforcing concentration limits for regulatory compliance.

New modules can be added to any asset's compliance stack at any time via `ModularCompliance.addModule(address)`, enabling real-time regulatory adaptation without token contract upgrades.

### 4.5 Freeze and Force Transfer

`AssetToken` exposes two emergency compliance functions:

```solidity
function freezeAddress(address addr, bool freeze) external onlyAgent;
function forcedTransfer(address from, address to, uint256 amount) external onlyAgent;
```

`freezeAddress` is used for AML compliance holds — when a Suspicious Activity Report (SAR) is filed with the NCA, the implicated wallet can be frozen immediately, preventing all transfers. `forcedTransfer` is used by appointed compliance agents (e.g. a court order, inheritance execution) to move tokens on behalf of a wallet owner.

Both functions are restricted to the `AGENT_ROLE`, which will be transferred to a Gnosis Safe 2-of-3 multi-sig before mainnet.

---

## 5. The FHE Privacy Layer

### 5.1 Why FHE, Not ZK

Zero-knowledge proofs (ZKPs) enable a prover to demonstrate that a statement is true without revealing the inputs. This is well-suited to one-time attestation — proving that a KYC attribute has been verified — but is fundamentally unsuited to continuous, stateful financial computation.

For a valuation update, fee calculation, loan repayment schedule, or portfolio balance sync, the system needs to:
1. **Read** an encrypted state value
2. **Compute** a new value based on it
3. **Write** the new encrypted value back

ZKPs cannot do step 3 in a general-purpose, EVM-composable way without trusted off-chain computation. FHE does all three inside the EVM, with full composability.

| Property | ZKP | FHE |
|---|---|---|
| One-time attestation | ✅ Excellent | ✅ Possible |
| Continuous on-chain computation on private data | ❌ Requires off-chain trusted prover | ✅ Native |
| EVM composability | Partial | ✅ Full |
| General-purpose operations on encrypted integers | ❌ Circuit-specific | ✅ Native |

### 5.2 Fhenix CoFHE

Fhenix CoFHE (Co-processor for Fully Homomorphic Encryption) is an EVM extension that provides native FHE operations as Solidity precompiles. The underlying scheme is TFHE (Fast Fully Homomorphic Encryption over the Torus), which supports efficient boolean and integer operations.

Solidity types available in Fhenix CoFHE:

| Type | Description | Used by |
|---|---|---|
| `ebool` | Encrypted boolean | `FHEKYCRegistry` |
| `euint32` | Encrypted 32-bit unsigned integer | `FHEAssetValuation`, `FHEFeeManager` |
| `euint64` | Encrypted 64-bit unsigned integer | `FHEPortfolioRegistry`, `ConfidentialLoan` |

Operations available: `FHE.add()`, `FHE.sub()`, `FHE.mul()`, `FHE.select()`, `FHE.asEuint32()`, `FHE.allow()`, `FHE.decrypt()` (requester-specific), and comparison operators (`FHE.gt()`, `FHE.lt()`, `FHE.eq()`).

### 5.3 The Five Privacy Contracts

#### 5.3.1 `FHEKYCRegistry` — Encrypted Identity Attributes

**Address:** `0xA2c3c3B9…`
**Encrypted types:** `ebool IS_ACCREDITED`, `ebool AML_CLEARED`

The FHEKYCRegistry stores two boolean flags per investor as FHE ciphertexts. These flags gate access to high-value primary market allocations and the `ConfidentialLoan` facility. The plaintext values — whether a wallet is accredited or AML-cleared — are never visible on the public chain.

```solidity
mapping(address => ebool) private isAccredited;
mapping(address => ebool) private amlCleared;

function setKYCAttributes(address investor, bool _accredited, bool _amlCleared) external onlyAdmin {
    isAccredited[investor] = FHE.asEbool(_accredited);
    amlCleared[investor]   = FHE.asEbool(_amlCleared);
    FHE.allow(isAccredited[investor], investor);
    FHE.allow(amlCleared[investor], investor);
}
```

When the `ConfidentialLoan` contract needs to verify eligibility, it calls `FHEKYCRegistry.checkAccredited(borrower)`, which returns an `ebool` result — the loan contract knows whether the borrower is eligible without ever seeing the underlying attribute.

#### 5.3.2 `FHEAssetValuation` — Encrypted RICS Appraisals

**Address:** `0x13C9B635…`
**Encrypted types:** `euint32 valuationUSD`

Asset valuations — updated quarterly per RICS standards — are stored as encrypted `euint32` values. This prevents front-running of valuation updates (a known attack vector in transparent tokenised asset markets, where traders observe valuation transactions in the mempool and position ahead of them).

```solidity
mapping(address => euint32) private valuations;

function updateValuation(address assetToken, euint32 newValuation) external onlyRICSAgent {
    valuations[assetToken] = newValuation;
    FHE.allow(newValuation, address(this));
    FHE.allow(newValuation, assetToken);
}
```

The `AssetToken` contract can read the encrypted valuation for internal calculations without the valuation being exposed to observers.

#### 5.3.3 `FHEFeeManager` — Encrypted Commercial Margins

**Address:** `0xFF9d2eA9…`
**Encrypted types:** `euint32 platformRevenueBps`, `euint32 maintenanceReserveBps`, `euint32 exitFeeBps`

Fee rates are stored as encrypted basis points. The `AssetTreasury` calls `computePlatformCutPlaintext(grossRevenue)` to calculate the platform's share of each revenue deposit — the calculation happens inside the cipher, producing a plaintext USDC amount without ever exposing the underlying fee rate.

This is commercially significant: AssetsGrator's fee structure — its competitive margin — is never visible to competitors, asset owners, or investors scraping the chain.

Regulators and FCA auditors access fee rates via time-bounded `FHE.allow()` grants issued by the contract owner:

```solidity
function grantAuditorAccess(address auditor) external onlyOwner {
    FHE.allow(platformRevenueBps, auditor);
    FHE.allow(maintenanceReserveBps, auditor);
    FHE.allow(exitFeeBps, auditor);
    emit AuditorAccessGranted(auditor, block.timestamp);
}
```

The grant event is immutable on-chain — selective or covert disclosure is impossible.

#### 5.3.4 `FHEPortfolioRegistry` — Shadow-Synced Encrypted Balances

**Address:** `0xA62a1612…`
**Encrypted types:** `euint64 balance` per (investor, assetToken) pair

Every `_transfer`, `_mint`, and `_burn` on any `AssetToken` triggers a `_sync()` hook that updates the investor's encrypted balance in the FHEPortfolioRegistry:

```solidity
// Inside AssetToken._afterTokenTransfer:
function _sync(address investor) internal {
    IFHEPortfolioRegistry(portfolioRegistry).syncBalance(
        investor,
        FHE.asEuint64(balanceOf(investor))
    );
}
```

This creates an **encrypted shadow registry** of every investor's holdings across all assets. Portfolio compositions — which institutional investors cannot expose — are never visible on the public ledger. An investor can decrypt their own portfolio using a permit generated by their wallet.

#### 5.3.5 `ConfidentialLoan` — Encrypted Lending Lifecycle

**Address:** `0x9485Fa34…`
**Encrypted types:** `euint64 principal`, `euint64 collateral`, `euint64 interestAccrued`, `euint64 repaidAmount`

The `ConfidentialLoan` contract enables collateral-backed borrowing against tokenised asset holdings. All loan terms — principal, collateral ratio, interest rate, repayment schedule — are stored and computed as FHE ciphertexts.

The loan lifecycle:
1. **Origination:** Borrower and lender agree encrypted terms off-chain. `createLoan(borrower, lender, encryptedPrincipal, encryptedCollateral)` stores ciphertexts on-chain.
2. **Collateral lock:** Borrower's AssetTokens are locked in escrow within the contract.
3. **Repayment:** Each `repay(loanId, encryptedAmount)` call updates `repaidAmount` via `FHE.add()`.
4. **Eligibility check:** `FHEKYCRegistry.checkAccredited(borrower)` is called; the result is an `ebool` — loan cannot originate if KYC check fails, without revealing why.
5. **Settlement:** When `repaidAmount >= principal + interest` (evaluated homomorphically), collateral is released.

No on-chain observer — including the platform — can determine the loan amount, interest rate, or repayment history of any borrower.

### 5.4 The FHE Access Permission Model

FHE ciphertexts in Fhenix CoFHE are permission-gated. A ciphertext handle can only be decrypted by an address that holds an explicit `FHE.allow()` grant for that handle.

The access model for each data type in AssetsGrator:

| Data | Encrypted as | Can decrypt |
|---|---|---|
| KYC accreditation flag | `ebool` | Investor (self), `ConfidentialLoan` (computation only), FCA auditor (time-bounded grant) |
| Asset valuation | `euint32` | `AssetToken` contract (computation), RICS agent, FCA auditor |
| Fee rates | `euint32` | `AssetTreasury` (computation), platform operator, FCA auditor |
| Portfolio balance | `euint64` | Investor (self), `AssetToken` (computation) |
| Loan terms | `euint64` | Borrower, lender, FCA auditor (court-ordered grant) |

All grants are logged on-chain as immutable events. The platform cannot grant access to regulators selectively or covertly — the grant itself is a public, permanent record.

---

## 6. Asset Factory and Token Lifecycle

### 6.1 `AssetFactory` — One-Call Asset Deployment

The `AssetFactory` contract (`0x3f26043b…`) deploys a complete, wired, KYC-gated ERC-3643 asset stack in a single transaction. This dramatically reduces the operational overhead of onboarding new assets and eliminates per-asset configuration errors.

`deployAsset()` call flow:

```
deployAsset(name, symbol, category, valuation, pricePerUnit, totalSupply, ipfsCID, metadata)
  1. Clone AssetToken (EIP-1167 minimal proxy)
  2. Clone ModularCompliance (EIP-1167 minimal proxy)
  3. Call AssetToken.init(name, symbol, compliance, identityRegistry, ...)
  4. Call ModularCompliance.addModule(KYCComplianceModule)
  5. Deploy AssetTreasury(assetToken, FHEFeeManager, platformWallet)
  6. Call AssetToken.setTreasury(assetTreasury)
  7. Call AssetRegistry.registerAsset(assetToken, category, metadata)
  8. Emit AssetDeployed(assetToken, category, deployer)
  9. Return assetToken address
```

**EIP-1167 Efficiency:** Using the minimal proxy pattern, each `AssetToken` clone is a 45-byte bytecode forwarding calls to the shared implementation. Deployment cost is approximately 100,000 gas, vs. 2,000,000+ gas for a full contract deployment.

### 6.2 Asset Lifecycle State Machine

Each `AssetToken` progresses through four lifecycle states:

```
PENDING ──────────────────► ACTIVE ─────────────► PAUSED
   │                           │                      │
   │ (KYC setup complete,       │ (regulatory hold,     │
   │  compliance wired,         │  maintenance,         │
   │  first mint executed)      │  AML investigation)   │
   │                           │                      │
   └───────────────────────────┴──────────────────────► CLOSED
                                                         │
                                                    (redemptions
                                                     still open)
```

State transitions are restricted to the `ADMIN_ROLE` (Gnosis Safe, pre-mainnet: deployer EOA). Transfers are rejected in `PENDING`, `PAUSED`, and `CLOSED` states.

### 6.3 Minting and Primary Market

Primary market allocation occurs through `AssetMarketplace` (`0x6030A334…`). The marketplace:

1. Verifies that `msg.sender` holds a valid KYC claim via `IdentityRegistry.isVerified()`
2. Accepts USDC payment at `pricePerUnit × amount`
3. Calls `AssetToken.mint(buyer, amount)` — which triggers the shadow portfolio sync
4. Emits `TokensPurchased(buyer, assetToken, amount, totalPaid)`

The marketplace enforces KYC at both layers: ERC-3643 (the token cannot be minted to a non-verified address) and `AssetMarketplace` itself (the purchase call reverts before attempting to mint if KYC is absent).

### 6.4 Secondary Market

Secondary token transfers are direct ERC-3643 transfers between KYC-verified investors. Each transfer automatically validates:
- Both sender and recipient are in `IdentityRegistry`
- No applicable jurisdiction restrictions apply
- Lock-up period has expired (`TimeLocksModule`)
- Neither wallet is frozen

The `AssetMarketplace` also supports a managed secondary order book, collecting a 0.3% fee on matched trades.

---

## 7. Asset Categories and On-Chain Metadata

All asset tokens share the `AssetMetadata` struct:

```solidity
struct AssetMetadata {
    string  location;         // Human-readable address or GPS coordinates
    string  assetSubType;     // e.g. "solar PV", "commercial office", "agricultural"
    uint256 valuationUSD;     // Current RICS/independent valuation (USD, 6 decimals)
    uint256 pricePerUnit;     // USDC price per token unit (6 decimals)
    string  ipfsCID;          // IPFS CID of legal documentation or title deed
    uint32  capacityKW;       // [Energy only] Installed generating capacity in kW
    uint32  annualYieldMWh;   // [Energy only] Projected annual generation
    string  ppaContractCID;   // [Energy only] IPFS CID of Power Purchase Agreement
    uint8   ppaTermYears;     // [Energy only] Duration of PPA in years
    AssetStatus status;       // PENDING | ACTIVE | PAUSED | CLOSED
    AssetCategory category;   // REAL_ESTATE | LAND | RENEWABLE_ENERGY | INFRA | COMMODITY | OTHER
}
```

Energy-specific fields default to zero for non-energy assets. This unified struct means the `AssetFactory`, `AssetRegistry`, and `AssetMarketplace` handle all six categories without conditional branching.

### 7.1 REAL_ESTATE

**Legal instrument:** UK HM Land Registry title deed (CID in `ipfsCID`)
**Revenue driver:** Rental income deposited to `AssetTreasury.depositRevenue()`
**Valuation cadence:** Quarterly RICS appraisal via `updateValuation()`
**Wave 1 live assets:** 10 UK properties (Mayfair, Canary Wharf, Kensington, Manchester, Edinburgh, Birmingham, Bristol, Leeds, Oxford, Surrey)

### 7.2 LAND

**Legal instrument:** Title deed, planning permission documents
**Revenue driver:** Land value appreciation, development uplift
**Governance:** Token-weighted votes on development decisions via `AssetGovernance`
**Valuation cadence:** Quarterly or on planning permission events

### 7.3 RENEWABLE_ENERGY

**Legal instrument:** Generation licence, PPA contract (IPFS CID stored on-chain)
**Revenue driver:** Electricity sales under PPA or spot market; governed by `EnergyRevenueDistributor`
**Key additional fields:** `capacityKW`, `annualYieldMWh`, `ppaContractCID`, `ppaTermYears`
**Infrastructure:** Full energy stack described in Section 8

### 7.4 INFRASTRUCTURE

**Legal instrument:** Concession agreement, operating licence
**Revenue driver:** Usage fees (tolls, rack rent, port dues)
**Governance:** Supermajority required for major capex decisions
**Lock-up:** Extended `TimeLocksModule` periods reflect long-duration infrastructure assets

### 7.5 COMMODITIES

**Legal instrument:** Custody certificate, warehouse receipt
**Revenue driver:** Spot price appreciation
**Valuation:** Oracle-driven live price feeds
**Redemption:** Each unit redeemable for underlying commodity via designated custodian

### 7.6 OTHER / ENVIRONMENTAL CREDITS

Future-proof catch-all category. Encompassing IP royalties, art, collectibles, and emerging asset classes that are not yet classifiable under existing regulatory frameworks. Environmental credits — carbon credits, RECs — are initially handled here, with the dedicated `RECToken` infrastructure described in Section 9.

---

## 8. The Renewable Energy Stack

Renewable energy assets require a specialised data pipeline: real-time production data must flow from physical metering infrastructure into on-chain revenue distribution, without introducing trusted third parties or centralised data manipulation risk.

AssetsGrator's energy stack is a three-contract system:

```
IoT / SCADA / Smart Meter
         │
         ▼
EnergyProductionOracle ──► EnergyRevenueDistributor ──► Investors
         │
         ▼
     RECToken
```

### 8.1 `EnergyProductionOracle`

The oracle bridges physical energy metering data on-chain. Only wallets holding `REPORTER_ROLE` can submit production reports:

```solidity
struct ProductionReport {
    uint256 periodId;        // Reporting period (YYYYMMDD format)
    uint256 mwhGenerated;    // MWh of electricity generated
    uint256 revenueUSDC;     // USDC revenue from energy sales
    uint256 capacityFactor;  // Actual/nameplate capacity ratio (basis points)
    string  evidenceCID;     // IPFS CID of metering certificate or invoice
    bool    finalised;       // Whether the period is closed
}
```

`reportProduction()` writes the report on-chain immutably. `finalisePeriod(periodId)` closes the period — no further reports can be submitted for that period. This prevents retroactive data manipulation and provides a tamper-evident audit trail that regulators can inspect.

**Reporter authorisation model:** The `REPORTER_ROLE` is granted to the metering authority or accredited energy data aggregator. Multiple reporters can be authorised per asset, providing redundancy. Reporter disputes are resolved via the governance contract.

### 8.2 `EnergyRevenueDistributor`

Revenue distribution for energy assets uses a **Synthetix-style staking reward accumulator** — a constant-time, O(1) distribution algorithm that avoids the gas-prohibitive loop pattern.

**Core algorithm:**

```solidity
uint256 public rewardPerTokenStored;
mapping(address => uint256) public userRewardPerTokenPaid;
mapping(address => uint256) public pendingRewards;

function rewardPerToken() public view returns (uint256) {
    if (totalSupply == 0) return rewardPerTokenStored;
    return rewardPerTokenStored + (pendingRevenue * 1e18 / totalSupply);
}

function earned(address account) public view returns (uint256) {
    return (balanceOf(account) * (rewardPerToken() - userRewardPerTokenPaid[account]) / 1e18)
           + pendingRewards[account];
}
```

When an operator calls `depositRevenue(assetToken, amount)`:
1. Platform fee is deducted via `FHEFeeManager.computePlatformCutPlaintext(amount)`
2. Net amount is added to the accumulator: `rewardPerTokenStored += netAmount * 1e18 / totalSupply`
3. Revenue is immediately claimable by all current token holders
4. No loops, no iteration over holders — gas cost is constant regardless of investor count

Investors call `claimRevenue(assetToken)` or `claimRevenueMultiple([assetToken1, assetToken2, ...])` for multi-asset claims in a single transaction.

---

## 9. Renewable Energy Certificate (REC) Framework

### 9.1 RECToken Standard

`RECToken` is an ERC-1155 multi-token contract where each token ID represents a generation period and each unit represents **1 MWh of verified renewable generation**.

```solidity
struct RECMetadata {
    address assetToken;         // Parent energy AssetToken
    string  certificationBody;  // e.g. "Ofgem REGO"
    string  gridRegion;         // e.g. "UK-REGO-GB"
    bool    retired;            // Permanently burned for compliance
}
```

**Token ID encoding:** `YYYYMMDD` integer (e.g. `20260601` = June 2026). This allows efficient batch operations across periods and provides human-readable period identification.

### 9.2 REC Lifecycle

| Stage | Function | Actor |
|---|---|---|
| Oracle reports MWh | `reportProduction(periodId, mwh, ...)` | REPORTER_ROLE |
| Period closed | `finalisePeriod(periodId)` | REPORTER_ROLE |
| RECs minted | `mint(treasury, periodId, mwh)` | REC_ISSUER_ROLE |
| Batch mint | `mintBatch(treasury, periodIds[], mwhs[])` | REC_ISSUER_ROLE |
| Transfer / trade | ERC-1155 `safeTransferFrom` | Any holder |
| Retirement | `retire(periodId, amount, reason)` | Any holder |

**Retirement is permanent.** `retire()` burns the tokens and marks the period as retired in the metadata. The burn event is immutable — no double-counting of environmental credits is possible. This aligns with the Ofgem REGO retirement model and international REC standards (IEC, RECS International).

### 9.3 Certification Alignment

RECToken is designed to align with:
- **UK:** Ofgem REGO (Renewable Energy Guarantees of Origin). `certificationBody = "Ofgem"`, `gridRegion = "UK-REGO-GB"`
- **International:** RECS International, I-REC Standard. Fields support any certification body.
- **Voluntary carbon markets:** When structured as carbon credit certificates, RECToken can represent Verified Carbon Standard (VCS) or Gold Standard units.

The `assetToken` link ties each REC to its physical generation source — the solar farm, wind turbine, or hydro plant — providing provenance traceability that regulators and corporate ESG compliance teams require.

---

## 10. Treasury and Revenue Distribution Architecture

### 10.1 `AssetTreasury` — Isolated Per-Asset Vault

Each deployed asset has a dedicated `AssetTreasury` contract. Isolation ensures that:
- Revenue from one asset cannot contaminate another
- Maintenance reserves are ring-fenced and governance-controlled
- Redemptions are processed against the correct asset's USDC balance

**Key functions:**

```solidity
// Revenue deposit (operator → treasury)
function depositRevenue(uint256 grossAmount) external onlyOperator {
    uint256 platformCut     = FHEFeeManager.computePlatformCutPlaintext(grossAmount);
    uint256 maintenanceCut  = FHEFeeManager.computeMaintenanceCutPlaintext(grossAmount);
    uint256 netYield        = grossAmount - platformCut - maintenanceCut;
    
    USDC.transferFrom(msg.sender, platformWallet, platformCut);
    maintenanceReserveBalance += maintenanceCut;
    
    // Update token valuation and price per unit
    AssetToken(assetToken).updateValuation(
        currentValuation + netYield
    );
}

// Investor redemption
function redeem(uint256 tokenAmount) external {
    uint256 grossUSDC  = tokenAmount * AssetToken(assetToken).pricePerUnit();
    uint256 exitFee    = FHEFeeManager.computeExitFeePlaintext(grossUSDC);
    uint256 netUSDC    = grossUSDC - exitFee;
    
    AssetToken(assetToken).burn(msg.sender, tokenAmount);
    USDC.transfer(msg.sender, netUSDC);
    USDC.transfer(platformWallet, exitFee);
}
```

### 10.2 Maintenance Reserve

The `maintenanceReserveBalance` is held in the `AssetTreasury` and can only be accessed via `AssetGovernance`. Investors vote on maintenance expenditure proposals — the platform cannot unilaterally extract reserve funds.

```solidity
function spendFromReserve(address to, uint256 amount, string calldata reason)
    external onlyGovernance {
    require(amount <= maintenanceReserveBalance, "Insufficient reserve");
    maintenanceReserveBalance -= amount;
    USDC.transfer(to, amount);
    emit MaintenanceSpend(to, amount, reason);
}
```

---

## 11. Governance Model

### 11.1 `AssetGovernance`

Each asset's governance is managed by `AssetGovernance` (`0xA2A3222D…`), a token-weighted voting contract.

**Proposal types:**
- Maintenance reserve spend
- Valuation dispute (challenge a submitted RICS appraisal)
- Compliance module addition/removal
- Asset status change (ACTIVE → PAUSED)

**Voting mechanics:**
- 1 token = 1 vote
- Quorum: 10% of total supply (configurable per asset)
- Voting period: 7 days
- Majority threshold: >50% of participating votes (configurable; infrastructure assets use 67%)

### 11.2 Platform Governance

Platform-level parameters — fee rates in `FHEFeeManager`, trusted issuer registry updates, marketplace fee changes — are governed by the platform multi-sig. Pre-mainnet: deployer EOA. Post-mainnet: Gnosis Safe 2-of-3.

---

## 12. Economic Model and Fee Architecture

### 12.1 Fee Structure

All fee rates are stored as encrypted `euint32` basis points in `FHEFeeManager`. Plaintext computations are performed via the `computeXPlaintext()` functions. Maximum aggregate platform fee across all revenue streams is capped at **3%** of transaction value by smart contract invariant.

| Fee Stream | Rate | Trigger Event |
|---|---|---|
| Asset Issuance | 1.0–2.5% of asset value | One-time on tokenisation |
| Platform Revenue Cut | ~1.5% AUM annually | Each revenue deposit |
| Maintenance Reserve | ~1.0% AUM annually | Each revenue deposit |
| Exit Fee | ~0.5% | Investor token redemption |
| Secondary Market | 0.3% | Peer-to-peer trade execution |
| Energy Platform Fee | Up to 30% cap | Energy revenue deposit |
| Oracle Service Fee | £0.05/MWh | Per verified production report |
| REC Minting Fee | 5% of credit value | On `RECToken.mint()` |

### 12.2 Revenue Projections

| Stream | Year 1 | Year 2 | Year 3 |
|---|---|---|---|
| Issuance fees | £150K | £600K | £2.0M |
| Management fees (AUM) | £150K | £750K | £3.0M |
| Marketplace (0.3%) | £50K | £200K | £600K |
| Energy oracle + REC | £10K | £100K | £400K |
| B2B API / licensing | — | £100K | £500K |
| **Total Revenue** | **£360K** | **£1.75M** | **£6.5M** |

### 12.3 AUM Targets

| Category | Year 1 | Year 2 | Year 3 |
|---|---|---|---|
| Real Estate | £8M | £30M | £100M |
| Renewable Energy | £1M | £10M | £50M |
| Land / Other | £1M | £5M | £50M |
| **Total AUM** | **£10M** | **£45M** | **£200M** |

---

## 13. Regulatory Framework and Legal Structure

### 13.1 UK Financial Services and Markets Act 2000 (FSMA 2000)

AssetsGrator Ltd is incorporated in England and Wales. Asset Tokens issued through the platform constitute **specified investments** under FSMA 2000, specifically **securities** as defined in Article 3 of the Regulated Activities Order (RAO).

The platform operates under the following regulatory framework:

**Current status (testnet / pre-authorisation):** Operating under the FCA Financial Promotions exemption for communications to certified high net worth individuals and sophisticated investors (Financial Promotions Order 2005, Articles 48 and 50A). No financial promotions are made to retail investors. The platform is gated behind KYC verification and investor classification.

**Target authorisation pathway:**
1. **Appointed Representative (AR)** status under an FCA-authorised principal firm — target Q3 2026.
2. **Direct FCA authorisation** under the Digital Securities Sandbox (DSS) — target Q1 2027.
3. **Full FSMA Part IV Permission** for dealing in investments as principal — target Q3 2027.

### 13.2 ERC-3643 and the Compliance Argument

A key regulatory argument AssetsGrator makes is that ERC-3643's structural compliance enforcement — where the blockchain itself rejects non-compliant transfers — represents a categorically stronger compliance posture than any administrative database-based approach.

Under FSMA Section 19 and FCA Supervision Manual (SUP), regulated firms must maintain adequate systems and controls to manage compliance risk. A system in which compliance rules are enforced at the cryptographic level, with no ability for an operator to bypass them, satisfies this requirement in a way that a centralised allowlist database cannot.

### 13.3 UK GDPR and FHE

The General Data Protection Regulation (UK GDPR) requires data minimisation: personal data should not be processed beyond what is necessary. The FHE architecture satisfies this principle: KYC attributes stored on-chain as boolean ciphertexts contain no personally identifiable information (PII) in their encrypted form. The plaintext KYC documents are processed by a regulated KYC provider and are not stored on AssetsGrator's servers.

The ICO has acknowledged that encrypted data that cannot be decrypted without the controller's keys may fall outside the definition of personal data. The FHE model — where AssetsGrator itself cannot decrypt investor KYC attributes without an explicit `FHE.allow()` grant — approaches this threshold.

### 13.4 Ofgem REGO and RECToken

RECToken is designed to align with the Ofgem Renewable Energy Guarantees of Origin (REGO) scheme. Each REC represents 1 MWh of verified renewable generation, certified by an authorised metering authority. The `retire()` function permanently destroys the token upon retirement, preventing double-counting — the primary regulatory concern in voluntary and compliance REC markets.

### 13.5 AML/CTF Framework

AssetsGrator operates under the UK Money Laundering, Terrorist Financing and Transfer of Funds (Information on the Payer) Regulations 2017 (MLR 2017). Compliance obligations include:

- Customer Due Diligence (CDD) on all investors
- Enhanced Due Diligence (EDD) for Politically Exposed Persons (PEPs) and high-risk jurisdictions
- Ongoing monitoring of on-chain transactions
- Suspicious Activity Reporting (SAR) to the National Crime Agency (NCA)
- Record retention for five years post-relationship

The `KYCComplianceModule.freezeAddress()` function enables immediate compliance holds. The `CountryRestrictModule` enforces jurisdiction-level blocks consistent with OFAC, HM Treasury, UN, and EU sanctions lists.

---

## 14. Security Analysis

### 14.1 Smart Contract Attack Surface

| Attack Vector | Mitigation |
|---|---|
| Reentrancy | Checks-Effects-Interactions pattern throughout; `nonReentrant` modifier on treasury functions |
| Access control bypass | Role-based access (`onlyOwner`, `onlyAgent`, `onlyGovernance`) with OpenZeppelin `AccessControl` |
| Integer overflow | Solidity 0.8.x native overflow protection; explicit `SafeMath` where division involved |
| Oracle manipulation | `REPORTER_ROLE` gating; `finalisePeriod` prevents retroactive changes; IPFS evidence CID |
| Front-running (valuations) | FHE encryption of valuations prevents observers reading valuation transactions |
| Proxy implementation attack | EIP-1167 minimal proxies have no upgrade vector — implementation is immutable |
| Governance capture | Quorum + time delay prevents flash-loan voting attacks |
| Multi-sig key loss | Pre-mainnet: EOA. Post-mainnet: Gnosis Safe 2-of-3 with hardware keys |

### 14.2 FHE Security Properties

The TFHE scheme used by Fhenix CoFHE provides IND-CPA (indistinguishability under chosen-plaintext attack) security. Under this security model:

- An adversary observing ciphertext handles on-chain learns nothing about the plaintext values.
- Even if an adversary observes all encrypted operations (additions, selections, comparisons), they cannot reconstruct plaintext without the decryption key.
- The Fhenix co-processor holds the FHE evaluation key (enabling computation) but not the decryption key (held by the user). This is the bootstrapping model for threshold FHE.

### 14.3 Planned Security Audit

A full security audit by Trail of Bits or CertiK is planned prior to mainnet deployment, covering:
- All 19 smart contracts
- Access control model
- FHE permission grant lifecycle
- EIP-1167 proxy pattern correctness
- Oracle input validation

---

## 15. Deployment and Infrastructure

### 15.1 Contract Addresses (Arbitrum Sepolia, Chain ID 421614)

**T-REX Infrastructure:**

| Contract | Address |
|---|---|
| `ClaimTopicsRegistry` | `0x827c98d9…` |
| `TrustedIssuersRegistry` | `0x7b1E2919…` |
| `IdentityRegistryStorage` | `0x493390e9…` |
| `IdentityRegistry` | `0xE413130d…` |
| `ModularCompliance` (impl) | `0x5Ff18c5a…` |
| `KYCComplianceModule` | `0xBFd57754…` |

**Platform:**

| Contract | Address |
|---|---|
| `AssetToken` (impl) | `0xcbfC0Ad4…` |
| `AssetFactory` | `0x3f26043b…` |
| `AssetMarketplace` | `0x6030A334…` |
| `AssetRegistry` | `0x1bc8e14F…` |
| `AssetGovernance` | `0xA2A3222D…` |
| `MockUSDC` | `0x5cDc5E3a…` |

**FHE Privacy:**

| Contract | Address |
|---|---|
| `FHEKYCRegistry` | `0xA2c3c3B9…` |
| `FHEAssetValuation` | `0x13C9B635…` |
| `FHEFeeManager` | `0xFF9d2eA9…` |
| `FHEPortfolioRegistry` | `0xA62a1612…` |
| `ConfidentialLoan` | `0x9485Fa34…` |

### 15.2 Frontend

The platform frontend is a Next.js 16 application deployed on Railway, with:
- WalletConnect v2 / RainbowKit wallet integration
- Wagmi v2 for contract interaction
- Transak on-ramp integration for GBP/USDC conversion
- FHE permit generation client-side (no private data transmitted to backend)
- KYC-gated properties page — unauthenticated visitors cannot view live deal listings

### 15.3 Execution Environment

| Component | Choice | Rationale |
|---|---|---|
| EVM Chain | Arbitrum Sepolia (testnet) | Low gas, EVM-equivalent, Fhenix CoFHE compatible |
| FHE Co-processor | Fhenix CoFHE | Only production-grade EVM FHE co-processor |
| IPFS | Pinata | Decentralised storage for legal documents and evidence CIDs |
| Token Settlement | MockUSDC (testnet) / USDC (mainnet) | 6-decimal stablecoin settlement |
| Frontend Hosting | Railway | CI/CD from GitHub, environment variable management |

---

## 16. Roadmap

| Quarter | Milestone |
|---|---|
| **Q1 2026 ✅** | 19 contracts deployed. 10 UK real estate tokens. 5 FHE contracts live. Frontend deployed. |
| **Q2 2026** | `EnergyProductionOracle` integration with live solar data. `RECToken` minting pipeline activated. FCA Digital Sandbox application submitted. Public audit repository open. |
| **Q3 2026** | Seed round closed (£1.5M target). Appointed Representative status under FCA principal. First 3 live UK property listings on mainnet. |
| **Q4 2026** | First energy asset live (5 MW solar, Midlands). First REC batch minted. 2,000 KYC-verified investors. £10M AUM. |
| **Q1 2027** | Direct FCA DSS authorisation. Gnosis Safe multi-sig governance. IFA (Independent Financial Adviser) distribution network. |
| **Q2 2027** | £45M AUM. Energy vertical: 3 assets. Break-even. Series A preparation. |
| **Q3 2027** | UAE (ADGM) compliance module. REC secondary market. B2B FHE compliance API licensing. |
| **Q4 2027** | EU MiCA compliance module. 300+ assets. £200M AUM target. Series A raise. |

---

## 17. Conclusion

AssetsGrator is built on a simple but profound observation: institutional capital cannot participate in public blockchain tokenisation without privacy guarantees, and those privacy guarantees must be cryptographic — not administrative — to be credible and regulatorily defensible.

The combination of ERC-3643 structural compliance and Fhenix FHE cryptographic privacy resolves this conflict. Compliance is enforced at the EVM level. Privacy is enforced by mathematics. Neither depends on trusting the platform operator.

The result is a system with three properties that no existing RWA tokenisation platform can simultaneously claim:

1. **Non-byppassable compliance** — the blockchain itself enforces KYC rules on every transfer.
2. **Cryptographic investor privacy** — sensitive financial data is never exposed in plaintext on the public ledger.
3. **Multi-asset infrastructure** — real estate, land, renewable energy, infrastructure, commodities, and environmental credits all run on the same protocol.

We believe this architecture represents the institutional layer that real-world asset tokenisation has been missing — and the foundation on which the next £200 billion of UK real asset value can move on-chain.

---

## 18. References

1. BCG / ADDX. *Relevance of On-Chain Asset Tokenization in 'Crypto Winter'*. 2022.
2. Gentry, C. *A Fully Homomorphic Encryption Scheme*. Stanford University. 2009.
3. Chillotti, I. et al. *TFHE: Fast Fully Homomorphic Encryption over the Torus*. 2016.
4. Lebrun, J. et al. *EIP-3643: T-REX — Token for Regulated EXchanges*. Ethereum Improvement Proposals. 2021.
5. Tokeny Solutions. *T-REX Protocol Documentation v4*. 2023.
6. Fhenix. *CoFHE Developer Documentation*. 2024.
7. Financial Conduct Authority. *FCA Digital Securities Sandbox: Final Rules*. 2024.
8. HM Treasury. *Future Financial Services Regulatory Regime for Cryptoassets: Consultation and Call for Evidence*. 2023.
9. Ofgem. *Renewable Energy Guarantees of Origin (REGO) Scheme*. 2024.
10. MSCI. *UK Real Estate Market Size Report*. 2024.
11. BloombergNEF. *Carbon Markets Outlook*. 2024.
12. IEC. *International REC Standard Framework*. 2024.
13. OpenZeppelin. *EIP-1167: Minimal Proxy Contract*. 2018.
14. Financial Services and Markets Act 2000 (FSMA). UK Parliament.
15. Money Laundering, Terrorist Financing and Transfer of Funds Regulations 2017 (MLR 2017). UK Parliament.
16. UK General Data Protection Regulation (UK GDPR). 2021.

---

*AssetsGrator Ltd · Incorporated in England and Wales · 20 Wenlock Road, London, N1 7GU*
*help@assetsgrator.com · https://www.assetsgrator.com*
*Version 1.0 · April 2026 · Confidential*

> This whitepaper is provided for informational purposes only and does not constitute financial, investment, legal, or tax advice. AssetsGrator Ltd is not authorised by the Financial Conduct Authority. This document is directed only at persons who are certified high net worth individuals or sophisticated investors as defined under the Financial Services and Markets Act 2000 (Financial Promotions) Order 2005. Past performance is not a reliable indicator of future results. Capital is at risk.
