# Fhenix Grant Milestones — PropAsset (AssetsGrator)

> **Project:** Confidential RWA Tokenization Platform on Fhenix
> **Stack:** ERC-3643 (T-REX) + Fhenix FHE + Next.js frontend
> **Goal:** Add a confidential compliance and lending layer to a production-ready multi-asset tokenization platform

---

## Milestone 1 — Private Identity & Confidential Compliance Layer

**Duration:** Weeks 1–4
**Theme:** *"No one knows who is verified, only that they are."*

### What Gets Built

#### `ConfidentialKYCModule.sol` (replaces `KYCComplianceModule.sol`)
- Replace public `isVerified(address) → bool` with an FHE-encrypted `ebool` per investor
- KYC status stored as ciphertext on-chain — block explorers show nothing meaningful
- `moduleCheck()` runs inside the encrypted domain; transfers are approved or rejected without leaking identity attributes
- Blacklist enforcement remains, also encrypted
- Holder count cap (e.g. SEC Reg D 2,000 limit) enforced via FHE comparison

#### `ConfidentialAssetToken.sol` (extends `AssetToken.sol`)
- `valuationUSD` and `pricePerUnit` converted from `uint256` → `euint64`
- Asset metadata struct updated: sensitive financial fields become encrypted types
- All existing views (`pricePerUnit()`, `valuationUSD()`) require a valid **Fhenix Permit** to decrypt
- Public views return sealed ciphertext; only permit holders get plaintext

### 🛡️ The Buyer Experience (UX Strategy)
To ensure users don't "buy blindly," we implement a dual-visibility model:
- **Public Data:** `pricePerUnit`, `availableUnits`, and IPFS property docs remain public. Buyers see the exact market price they are paying.
- **Private Data:** The underlying `valuationUSD` (total project value) and treasury reserves are encrypted. 
- **The Reveal:** Once an investor completes their private KYC, they are automatically granted a **Self-Permit** that allows them to decrypt the valuation and their own yield claims.

### What Stays the Same
- `AssetFactory.sol` deploy pattern (EIP-1167 clones) — unchanged
- `CountryRestrictModule.sol` — jurisdiction rules stay public (they are public law)
- `CarbonCreditToken.sol` and `RECToken.sol` — public by design (regulatory requirement)

### Deliverable
- Both contracts deployed on **Fhenix Testnet**
- Unit tests: encrypted KYC check, transfer gating, encrypted valuation update
- Simple frontend demo: investor tries to view valuation → sees `[ENCRYPTED]` without a permit

---

## Milestone 2 — Permit-Gated Auditor Access & Private Treasury

**Duration:** Weeks 5–8
**Theme:** *"Auditors see exactly what they need. Nothing more."*

### What Gets Built

#### `ConfidentialTreasury.sol` (replaces `AssetTreasury.sol`)
- `maintenanceReserveBalance` → `euint64`
- `depositRevenue()`: three-way split (platform fee, maintenance, net yield) computed in FHE — revenue figures never exposed
- `revenuePool` accumulator encrypted — competitors cannot infer deal quality from yield rates
- `redeem()` payout computed on encrypted price without revealing the price to the mempool

#### Auditor Permit System
- Platform owner can issue a **scoped Fhenix Permit** to a regulator or auditor address
- Permit grants decrypt access to specific fields only: e.g. `valuationUSD` for one asset, for one 30-day window
- Auditor calls `auditValuation(permit)` → gets plaintext; everyone else gets ciphertext
- Permit revocation: owner can invalidate a permit before its expiry

#### `ConfidentialGovernance` (extension to `AssetGovernance.sol`)
- Vote weights (`voteWeight` mapping) encrypted during the voting period
- Individual votes are sealed — prevents whale intimidation and vote-buying
- Results tallied by FHE at `finalizeProposal()` — only the outcome (PASSED/REJECTED) is public

### What Stays the Same
- `EnergyProductionOracle.sol` — IoT/SCADA reports remain public (investor trust depends on it)
- `TimeLocksModule.sol` — timelocks are a security guarantee that must be visible

### Deliverable
- Contracts deployed and integrated on **Fhenix Testnet**
- Frontend: auditor wallet connects, loads permit, sees decrypted treasury figures
- Frontend: non-auditor wallet sees `[ENCRYPTED]` on all sensitive fields
- End-to-end test: full asset lifecycle — deploy → mint → invest → revenue deposit → auditor inspect

---

## Milestone 3 — Confidential RWA Lending (`ConfidentialLoan.sol`)

**Duration:** Weeks 9–14
**Theme:** *"Institutional-grade lending where the terms stay between lender and borrower."*

### What Gets Built

#### `ConfidentialLoan.sol` (new contract — the centrepiece)

This is the novel contribution. No equivalent exists on any public RWA chain.

**Loan Lifecycle:**
```
1. Borrower posts AssetToken units as collateral (locked in contract)
2. Lender commits USDC
3. Loan terms stored encrypted on-chain:
     euint64  principal
     euint32  interestRateBps
     euint64  outstandingBalance
     uint256  dueDate            ← public (settlement date is fine to be known)
4. Repayments decrement outstandingBalance in FHE — no plaintext ever hits chain
5. On default: FHE condition fires (outstandingBalance > 0 AND timestamp > dueDate)
              → collateral liquidated → terms still never revealed to third parties
```

**Key properties:**
- Lender and borrower each hold a **Fhenix Permit** scoped to their own loan
- No third party (not even a block explorer) can see the rate or outstanding balance
- Liquidation is provably fair: triggered by an FHE-verified condition, not a centralised oracle
- Multiple loans can be stacked against the same underlying asset (each with private terms)

#### Integration with Existing Stack
- `AssetTreasury.spendFromReserve()` can be gated behind a `ConfidentialLoan` solvency check
- `AssetGovernance` can propose loan parameter changes via governance proposal
- `EnergyRevenueDistributor`: energy yield revenue can be auto-routed as loan repayment

### What the Loan Feature Unlocks for the Grant Narrative
| Without Fhenix | With Fhenix FHE |
|---|---|
| Loan terms public on-chain → institutional non-starter | Terms fully encrypted → institutional-grade privacy |
| Front-running risk at liquidation | Liquidation condition computed in ciphertext — no MEV |
| Competitors can monitor borrow rates | Zero information leakage |

### Deliverable
- `ConfidentialLoan.sol` deployed on **Fhenix Testnet**
- End-to-end demo: borrow against a tokenized solar farm → repay → auditor verifies solvency via permit
- Frontend: loan dashboard — borrower sees their own terms (permit-decrypted); lender sees counterparty status; public sees nothing
- Written report: architecture writeup, security considerations, and integration guide for other Fhenix RWA builders

---

## Summary Table

| Milestone | Duration | Core Contract | Key Fhenix Feature |
|---|---|---|---|
| **1** — Private KYC & Encrypted Asset | Weeks 1–4 | `ConfidentialKYCModule` + `ConfidentialAssetToken` | `ebool` identity, `euint64` valuations |
| **2** — Auditor Permits & Private Treasury | Weeks 5–8 | `ConfidentialTreasury` + Permit System | Scoped permits, encrypted revenue |
| **3** — Confidential RWA Lending | Weeks 9–14 | `ConfidentialLoan` | Encrypted loan terms, FHE liquidation |

---

*What stays public by design: `CarbonCreditToken`, `RECToken`, `EnergyProductionOracle`, `CountryRestrictModule`, `TimeLocksModule` — because transparency is their value.*
