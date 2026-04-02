import Link from 'next/link';

export const metadata = { title: 'Terms of Service | AssetsGrator', description: 'Terms governing use of the AssetsGrator platform.' };

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

export default function TermsPage() {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '3rem 0 5rem' }}>
      <div className="container" style={{ maxWidth: 780 }}>

        {/* Header */}
        <div style={{ marginBottom: '2.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--brand)', marginBottom: 8 }}>Legal</p>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>Terms of Service</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Last updated: April 2026 · Governing law: England & Wales</p>
        </div>

        <Section title="1. About AssetsGrator">
          <P>AssetsGrator Ltd ("AssetsGrator", "we", "us") is a company incorporated in England and Wales. We operate a technology platform that facilitates the tokenisation of real-world assets ("RWAs") — including commercial real estate, renewable energy infrastructure, carbon credits, and Renewable Energy Certificates (RECs) — using blockchain-based security tokens issued under the ERC-3643 (T-REX) standard.</P>
          <P>The platform is currently deployed on Arbitrum Sepolia testnet and is undergoing preparation for regulatory engagement with the Financial Conduct Authority (FCA) under the UK Digital Securities Sandbox framework.</P>
        </Section>

        <Section title="2. Eligibility">
          <P>Access to the platform is restricted. You may only use the platform if you:</P>
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '0.75rem' }}>
            <Li>Are 18 years of age or older</Li>
            <Li>Have completed identity verification (KYC/AML) and been approved by AssetsGrator</Li>
            <Li>Have been classified as a "high net worth individual", "sophisticated investor", or "professional investor" under UK financial regulation</Li>
            <Li>Are not resident in a jurisdiction where access is prohibited by law</Li>
            <Li>Are not subject to sanctions administered by OFAC, HM Treasury, the UN, or the EU</Li>
          </ul>
          <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)', marginBottom: '0.75rem', fontWeight: 600 }}>The platform does not accept retail investors. Access is restricted to qualified investors as defined under the Financial Services and Markets Act 2000 (Financial Promotions) Order 2005.</p>
        </Section>

        <Section title="3. Nature of Tokens">
          <P>Tokens issued through this platform ("Asset Tokens") are security tokens governed by the ERC-3643 T-REX protocol. They represent a fractional on-chain share of an interest in an underlying real-world asset. They are not utility tokens, currency, or investment products in the traditional sense.</P>
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '0.75rem' }}>
            <Li>Token transfers are restricted to KYC-verified wallets enforced at the smart contract level</Li>
            <Li>Lock-up periods and jurisdiction restrictions are applied programmatically via compliance modules</Li>
            <Li>Holding a token does not constitute legal ownership of the underlying asset without accompanying off-chain legal documentation</Li>
          </ul>
        </Section>

        <Section title="4. Risk">
          <P>Investing in tokenised assets involves risk. The value of tokens may fall as well as rise. Revenue distributions are not guaranteed. You may receive back less than you invest. Past performance is not a reliable indicator of future results. See our <Link href="/legal/risk-disclosure" style={{ color: 'var(--brand)' }}>Risk Disclosure</Link> for full details.</P>
        </Section>

        <Section title="5. Privacy and Data">
          <P>Your identity data is processed in accordance with our <Link href="/legal/privacy" style={{ color: 'var(--brand)' }}>Privacy Policy</Link>. KYC attributes relevant to compliance checks are stored on-chain as FHE-encrypted ciphertexts via the FHEKYCRegistry contract — they are never exposed in plaintext on the public blockchain. Auditor access to encrypted data is granted via time-bounded FHE.allow() scoping as required by applicable law.</P>
        </Section>

        <Section title="6. Platform Fees">
          <P>Platform fees are capped at 3% of transaction value and managed by the FHEFeeManager smart contract. Fee rates are encrypted on-chain and updated only via authorised governance actions. The specific fee breakdown (platform revenue, maintenance reserve, exit fee, marketplace commission) is set out in the relevant asset documentation provided to approved investors.</P>
        </Section>

        <Section title="7. Governing Law">
          <P>These Terms are governed by the laws of England and Wales. Any dispute shall be subject to the exclusive jurisdiction of the courts of England and Wales.</P>
        </Section>

        <Section title="8. Changes">
          <P>We may update these Terms at any time. Continued use of the platform after changes constitutes acceptance of the updated Terms. Material changes will be communicated to approved investors by email.</P>
        </Section>

        <div style={{ marginTop: '3rem', padding: '1.25rem 1.5rem', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, color: 'var(--text-secondary)' }}>
          AssetsGrator Ltd · Incorporated in England and Wales ·{' '}
          <a href="mailto:help@assetsgrator.com" style={{ color: 'var(--brand)' }}>help@assetsgrator.com</a>
        </div>
      </div>
    </div>
  );
}
