import Link from 'next/link';

export const metadata = { title: 'KYC Policy | AssetsGrator', description: 'AssetsGrator KYC and AML policy under UK Money Laundering Regulations 2017.' };

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section style={{ marginBottom: '2.5rem' }}>
    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text-primary)', borderBottom: '2px solid var(--brand-light)', paddingBottom: '0.4rem' }}>{title}</h2>
    {children}
  </section>
);

const P = ({ children }: { children: React.ReactNode }) => (
  <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>{children}</p>
);

const Li = ({ children }: { children: React.ReactNode }) => (
  <li style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>{children}</li>
);

export default function KYCPage() {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '3rem 0 5rem' }}>
      <div className="container" style={{ maxWidth: 780 }}>

        <div style={{ marginBottom: '2.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--brand)', marginBottom: 8 }}>Legal</p>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>KYC & AML Policy</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Last updated: April 2026 · Framework: MLR 2017 · POCA 2002 · FSMA 2000</p>
        </div>

        <Section title="1. Regulatory Framework">
          <P>AssetsGrator operates under the UK Money Laundering, Terrorist Financing and Transfer of Funds (Information on the Payer) Regulations 2017 ("MLR 2017") and the Proceeds of Crime Act 2002 ("POCA"). All persons accessing investment functionality must complete identity verification before any on-chain interaction with asset tokens.</P>
        </Section>

        <Section title="2. Who Must Complete KYC">
          <P>All of the following must complete KYC before accessing the platform:</P>
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '0.75rem' }}>
            <Li>Individual investors</Li>
            <Li>Corporate investors (additional beneficial ownership documentation required)</Li>
            <Li>Borrowers using the ConfidentialLoan facility</Li>
            <Li>Any wallet address that will hold, transfer, or receive Asset Tokens</Li>
          </ul>
          <P>There are no exemptions. The ERC-3643 smart contract will structurally block any transfer to a wallet not listed in the IdentityRegistry — KYC is enforced at the protocol level, not just administratively.</P>
        </Section>

        <Section title="3. What We Verify">
          <P><strong>Individual investors:</strong></P>
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '0.75rem' }}>
            <Li>Government-issued photo ID (passport preferred)</Li>
            <Li>Proof of address (utility bill or bank statement, dated within 3 months)</Li>
            <Li>Investor classification declaration (high net worth / sophisticated investor)</Li>
            <Li>Source of funds / source of wealth (for investments above £10,000)</Li>
            <Li>PEP and sanctions screening</Li>
          </ul>
          <P><strong>Corporate investors:</strong></P>
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '0.75rem' }}>
            <Li>Certificate of incorporation</Li>
            <Li>Memorandum and articles of association</Li>
            <Li>Register of directors and beneficial owners (persons with &gt;25% ownership)</Li>
            <Li>KYC on each beneficial owner as per individual requirements</Li>
            <Li>Source of funds declaration</Li>
          </ul>
        </Section>

        <Section title="4. How On-Chain KYC Works">
          <P>Upon successful KYC verification, two on-chain actions occur:</P>
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '0.75rem' }}>
            <Li><strong>T-REX Identity Claim:</strong> An on-chain identity claim is written to the IdentityRegistry contract, authorising the wallet to hold and transfer Asset Tokens under ERC-3643.</Li>
            <Li><strong>FHE Attribute Storage:</strong> KYC attributes (accreditation status, AML clearance) are written to the FHEKYCRegistry as encrypted ciphertexts. These are used for eligibility checks (e.g. loan origination) without revealing the underlying data on-chain.</Li>
            <Li><strong>Wallet Whitelisting:</strong> The wallet address is whitelisted in the compliance module — token transfers to non-whitelisted wallets are rejected at the smart contract level.</Li>
          </ul>
        </Section>

        <Section title="5. Investor Classification (UK)">
          <P>To access the platform, investors must self-certify as one of the following under the Financial Promotions Order 2005:</P>
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '0.75rem' }}>
            <Li><strong>High Net Worth Individual:</strong> Net assets exceeding £250,000, or annual income exceeding £100,000</Li>
            <Li><strong>Self-Certified Sophisticated Investor:</strong> Meets FCA criteria for experience and knowledge</Li>
            <Li><strong>Professional Investor:</strong> FCA-defined professional client classification</Li>
          </ul>
          <P>Retail investors cannot access investment functionality under any circumstances.</P>
        </Section>

        <Section title="6. PEPs and Sanctions">
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '0.75rem' }}>
            <Li>Politically Exposed Persons (PEPs) are subject to Enhanced Due Diligence (EDD) before access is granted</Li>
            <Li>Wallets associated with sanctioned individuals or entities (OFAC / HM Treasury / UN / EU) are permanently blocked via the CountryRestrictModule</Li>
            <Li>Sanctions screening is re-run on all active investors on a weekly basis</Li>
          </ul>
        </Section>

        <Section title="7. Ongoing Monitoring">
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '0.75rem' }}>
            <Li>KYC is re-verified every 12 months at minimum</Li>
            <Li>Material changes (change of name, nationality, beneficial ownership) must be notified immediately</Li>
            <Li>Continuous transaction monitoring is applied to on-chain activity</Li>
            <Li>Suspicious activity is reported to the National Crime Agency (NCA) via Suspicious Activity Report (SAR) where required</Li>
          </ul>
        </Section>

        <Section title="8. Data Handling">
          <P>KYC data is handled in accordance with our <Link href="/legal/privacy" style={{ color: 'var(--brand)' }}>Privacy Policy</Link>. Sensitive identity attributes stored on-chain are encrypted via FHE and never exposed in plaintext.</P>
        </Section>

        <div style={{ marginTop: '3rem', padding: '1.25rem 1.5rem', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, color: 'var(--text-secondary)' }}>
          AssetsGrator Ltd · Incorporated in England and Wales ·{' '}
          <a href="mailto:help@assetsgrator.com" style={{ color: 'var(--brand)' }}>help@assetsgrator.com</a>
        </div>
      </div>
    </div>
  );
}
