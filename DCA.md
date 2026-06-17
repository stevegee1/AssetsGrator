# FCA Permanent Digital Sandbox — Application Form
**AssetsGrator | Submitted: March 2026**

---

## (1) Business Details

**1.1 Business name:**
AssetsGrator Ltd

**1.2.1 Business address line 1:**
20 Farringdon Street

**1.2.2 City/Town:**
London

**1.2.3 Postcode:**
EC4A 4AB

**1.2.4 Country:**
United Kingdom

**1.3 Companies House number (if available):**
*(Pending incorporation — application submitted)*

**1.4 Website URL:**
https://assetsgrator.com

**1.5.1 Is your business currently regulated by the FCA?**
No

**1.5.3 Is your business looking to apply for FCA authorisation during/after the Digital Sandbox test?**
Yes

> AssetsGrator intends to apply for FCA authorisation as a Recognised Investment Exchange (RIE) or under the FCA's Digital Securities Sandbox (DSS) regime, which permits operating a Digital Securities Depository (DSD) and a trading venue for tokenised securities. We will engage with the Innovation Pathways service in parallel.

**1.6 How long has your business been trading?**
Less than 12 months (incorporated Q1 2026; platform in active development since January 2026)

**1.7 What level of funding has your business received?**
Pre-seed / Founder-funded

**1.7.1 Funding details:**
The business is currently self-funded by founders, supplemented by private pre-seed backing. We are actively in discussions with UK-based angel investors and Web3-native venture funds for a seed round targeted at £500,000–£1,000,000 to fund regulatory engagement, legal structuring, and platform scaling.

**1.8 Number of employees:**
3 (2 founders + 1 technical lead)

**1.9.1 Has your business applied to FCA Innovation services in the past?**
No

---

## (2) Applicant Details

**2.1 First name:**
Segun

**2.2 Last name:**
*(Surname — please complete)*

**2.3 Job title:**
Chief Executive Officer

**2.4.1 Seniority:**
C-Suite / Founder

**2.5 Contact number:**
*(Please complete — +44 format)*

**2.6 Business email address:**
segun@assetsgrator.com

---

## (3) Innovation Details

**3.1 Please describe the product/service you wish to develop/test within the Digital Sandbox:**

AssetsGrator is a regulated real-world asset (RWA) tokenisation and fractional investment platform that combines two institutional-grade technologies:

1. **ERC-3643 (T-REX Protocol):** The international standard for regulated security tokens. Compliance rules — KYC verification, jurisdiction checks, lock-up periods — are structurally enforced at the smart contract level. Non-compliant transfers are cryptographically impossible, not merely policy-prohibited.

2. **Closed-Loop Sterling Platform Ledger:** All transactions and yields are settled in British Pounds (GBP) using a platform-managed ledger token (`GBPPlatformToken.sol`). This token is backed 1:1 by real sterling bank reserves. When a user deposits fiat via bank wire, our corporate bank API catches the incoming payment and alerts our backend to mint the corresponding ledger tokens, providing a gasless, fiat-like onboarding experience.

3. **KYC-Gated Collateralised Lending:** The lending layer (`LoanManager.sol`) allows borrowers to lock compliant tokenised assets as collateral, checks maximum LTV parameters dynamically via the `AssetValuation` oracle, and disburses/repays sterling-pegged tokens.

The platform enables investors to purchase fractional ownership tokens of UK real estate and other tangible assets from as little as £5, receive proportional income distributions in GBP, and borrow against their holdings—all under a fully compliant, regulated architecture.

Within the Digital Sandbox, we wish to:
- Test our KYC/AML compliance flow using synthetic investor identity data and ERC-3643 whitelisting.
- Validate our plaintext collateralised lending model (`LoanManager.sol`) against synthetic property valuations and LTV thresholds.
- Simulate regulated asset transfer compliance enforcement across multiple synthetic investor profiles.
- Develop the regulatory reporting layer: demonstrating that compliance officers can audit on-chain transactions and verify that every holder is fully whitelisted.

**3.2.1 Areas relevant to the innovation:**
- ☑ Digital asset/crypto
- ☑ RegTech
- ☑ Decentralised finance (DeFi)
- ☑ Digital ID
- ☑ WealthTech
- ☑ Open finance

**3.3 How is your product different from existing solutions in the market?**

Existing RWA tokenisation platforms share critical limitations that AssetsGrator eliminates:

| Limitation | Existing Platforms | AssetsGrator |
|---|---|---|
| **Compliance enforcement** | Off-chain KYC in a centralised database; tokens are standard ERC-20 with no on-chain restriction | ERC-3643 smart contract enforces KYC, jurisdiction, and lock-up at the token transfer level — structurally impossible to circumvent |
| **Settlement currency** | Native stablecoins (USDC/USDT), introducing currency risk for UK participants | Settles natively in GBP using our Closed-Loop Sterling Platform Ledger, matching bank transfers 1:1 |
| **On-Chain Lending** | Standard DeFi lending protocols with no identity gating or compliance checks | Plaintext `LoanManager.sol` with dynamic LTV and T-REX compliance integration, restricted to whitelisted participants |

No existing UK RWA platform combines structural on-chain compliance with Closed-Loop Sterling settlement. AssetsGrator is the first to do so.

**3.4 What is your target market and consumer group?**

**Primary — Institutional and Accredited Investors:**
UK-based family offices, high-net-worth individuals (HNWIs, FCA definition: >£100k investable assets or £250k annual income), and small institutional investors seeking exposure to real asset income streams without the typical £250,000+ minimum commitments. Initial focus: UK residential and commercial real estate.

**Secondary — Asset Owners and Developers:**
UK property developers, commercial real estate owners, and renewable energy project companies seeking to raise capital efficiently from a broad, compliant investor base under a tokenised structure — as an alternative to traditional private placement or REIT structures.

**Regulatory target:** Aligned to the FCA's digital securities sandbox (DSS) eligible asset classes and the broader UK Digital Securities legislation under the Financial Services and Markets Act 2023 (FSMA 2023).

**3.5 Main risks to consumers/markets and mitigation plan:**

| Risk | Mitigation |
|---|---|
| **Smart contract vulnerability** | Formal security audit prior to mainnet launch. All contracts open-source on GitHub. Bug bounty programme post-launch. |
| **Valuation feed latency** | Independent RICS valuations updated on-chain via our authorized valuation oracle `AssetValuation` with multi-signature validation. |
| **Regulatory classification risk (financial promotion)** | All communications are reviewed against FCA financial promotion rules (s.21 FSMA). Platform gated behind KYC — no public marketing of specific asset returns. |
| **Liquidity risk** | Secondary market via `AssetMarketplace` contract. Investors informed upfront of lock-up periods. No false liquidity promises. |
| **Data protection / UK GDPR** | KYC attributes processed off-chain by third-party provider. Only the whitelisting status (UK country code mapping) is stored on-chain in the `IdentityRegistry` to ensure compliance without exposing sensitive personal data. |

**3.6 What problem does your product/service solve and how will it benefit consumers/markets?**

**The problem:** UK real asset markets — particularly commercial real estate, renewable energy, and infrastructure — are structurally inaccessible to the majority of investors. Minimum participation in a commercial property investment is typically £250,000+, documentation is opaque, and no liquid secondary market exists. Simultaneously, asset owners are locked into expensive, slow private placement processes for capital raises.

Blockchain tokenisation solves access and liquidity, but using US-denominated stablecoins introduces foreign exchange risk and complexity for UK participants.

**The benefit:**
- **For investors:** Access to institutional-grade UK real assets from £5. Proportional rental/yield income settled in GBP. Ability to borrow against tokens. Fully compliant with UK securities law.
- **For asset owners:** Access to a broader, KYC-verified investor capital base with no minimum commitment floor. Faster capital formation under a fully compliant structure.
- **For regulators:** A model where compliance is structurally enforced (cannot be circumvented) and auditability is guaranteed. A template for how FCA-regulated digital asset platforms should handle investor data protection and sterling settlement.
- **For the market:** Advances the UK's position as a global digital securities hub.

**3.7 Does your team have expertise to use the integrated Jupyter Notebook?**
Yes

**3.7.1 Do you need access to the Authorised Push Payment Fraud Synthetic data?**
No — our testing requirements centre on synthetic investor identity, credit, and property valuation data.

**3.8 What type of data do you need?**

1. **Synthetic investor identity data:** Name, address, nationality, politically exposed person (PEP) flag, sanctions flag — structured to match the compliance attributes processed by our `IdentityRegistry` contract.
2. **Synthetic credit/collateral data:** Loan-to-value ratios, asset valuations, repayment histories — for testing our `LoanManager` lending model.
3. **Synthetic property transaction data:** UK commercial and residential property valuations, rental yield data, and title deed metadata — to validate our `AssetValuation` and `AssetFactory` contracts against realistic UK market inputs.
4. **Synthetic regulated transfer data:** Simulated investor-to-investor token transfer history across multiple synthetic wallet profiles with varying KYC/AML status — to validate ERC-3643 compliance enforcement under adversarial conditions.

**3.9.1 Proposed timeline for Digital Sandbox testing:**
6 months

**Milestones:**
| Month | Deliverable |
|---|---|
| 1–2 | Synthetic KYC/AML data integration; whitelisting compliance flow validation |
| 2–3 | Plaintext loan model testing against synthetic credit/collateral data |
| 3–4 | End-to-end regulated transfer simulation; compliance enforcement validation |
| 4–5 | Regulatory reporting layer and bank bridge API simulation |
| 5–6 | Full platform test; performance benchmarking; demo and report preparation |

**3.10 Number of people needing access:**
3 (CEO, CTO, legal/compliance lead)

**Success Metrics:**

| Metric | Target | Measurement |
|---|---|---|
| KYC whitelisting round-trip time | < 3 seconds | On-chain transaction timing |
| Compliance rule enforcement accuracy | 100% (zero false positives/negatives on synthetic profiles) | Automated test suite |
| Loan Manager math correctness | 100% agreement with target LTV and interest parameters | Mathematical verification vs spreadsheet models |
| Platform settlement latency | < 5 seconds | Block integration time |
| Synthetic asset transfer compliance | 100% of non-compliant transfers rejected | ERC-3643 test suite (37 tests passing) |
| Platform uptime during test | > 99.5% | Monitoring dashboard |

---

## (4) Future Plan

**4.1 How will you commercialise the product after exiting the Digital Sandbox?**

Post-sandbox, AssetsGrator will proceed on three parallel commercial tracks:

1. **FCA Authorisation:** Apply for authorisation as an Appointed Representative (AR) of an existing FCA-authorised firm in the first instance, transitioning to direct authorisation as the Digital Securities Sandbox (DSS) regime matures. This enables us to market to retail and professional investors under a compliant framework.

2. **Seed funding round:** Use demonstrated regulatory engagement and sandbox outcomes to close a £750K–£1.5M seed round. Funds allocated to: legal structuring (40%), engineering team expansion (35%), and marketing/compliance (25%).

3. **Asset pipeline:** Onboard 3–5 UK commercial real estate partners for the first live asset listings. Target £5M–£20M in tokenised assets in Year 1. Revenue model: platform management fee (1.5–2.5% per annum of assets under management) + transaction fee on secondary market activity (0.3%).

4. **International expansion:** UAE (ADGM), Singapore (MAS), and EU (MiCA) jurisdiction-specific compliance modules are architecturally supported by our ERC-3643 multi-jurisdiction design. Year 2 target: 3 jurisdictions live.

**4.2.1 Potential barriers to launch:**

- **Regulatory timeline risk:** FCA authorisation timelines can be 12–18 months. Mitigation: AR structure as interim path; proactive Innovation Pathways engagement.
- **Sterling reconciliation latency:** Matching manual bank wires to ledger minting. Mitigation: Core banking API automation.
- **Institutional trust / sales cycle:** Building credibility with UK property asset owners requires track record. Mitigation: Start with developer relationships; Digital Sandbox participation as a trust signal.
- **Legal structuring complexity:** SPV/trust structure for holding legal title deeds. Mitigation: Engaged Mishcon de Reya (UK fintech legal specialists) for structuring advice.

**4.3 Willingness to provide demo and summary report:**
✅ Yes — AssetsGrator confirms we will provide a working platform demo and a written summary report upon completion of the Digital Sandbox test.

**4.4 Willingness to participate in surveys:**
✅ Yes — AssetsGrator is willing to be contacted and to participate in FCA evaluation surveys during and after the sandbox test period.

---

## (5) Consent

AssetsGrator confirms that, by applying to the FCA Digital Sandbox, we consent that we will not use the data provided on the Digital Sandbox platform for any purpose beyond what is stated in this application form. We shall not share data assets from the Digital Sandbox platform with any third party without FCA consent. We acknowledge that the Financial Conduct Authority (FCA) makes no representations or warranties about the quality of the data provided on the Digital Sandbox and holds no responsibility for any product or decision made utilising the data.

**Signed:** Segun *(surname)*
**Title:** Chief Executive Officer, AssetsGrator Ltd
**Date:** March 2026

---

> *"We are not building a crypto product. We are building the regulated financial infrastructure that the UK digital securities market requires — and we are building it with the tools that institutional adoption demands."*
