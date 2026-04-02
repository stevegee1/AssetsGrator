import Link from 'next/link';

export const metadata = { title: 'Privacy Policy | AssetsGrator', description: 'How AssetsGrator collects, stores, and protects your personal data under UK GDPR.' };

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

export default function PrivacyPage() {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '3rem 0 5rem' }}>
      <div className="container" style={{ maxWidth: 780 }}>

        <div style={{ marginBottom: '2.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--brand)', marginBottom: 8 }}>Legal</p>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>Privacy Policy</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Last updated: April 2026 · AssetsGrator Ltd, England & Wales</p>
        </div>

        <Section title="1. Who We Are">
          <P>AssetsGrator Ltd is the data controller for personal data collected through this platform. We are incorporated in England and Wales. Contact: <a href="mailto:help@assetsgrator.com" style={{ color: 'var(--brand)' }}>help@assetsgrator.com</a></P>
        </Section>

        <Section title="2. What Data We Collect">
          <P><strong>Identity data (KYC/AML):</strong></P>
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '0.75rem' }}>
            <Li>Full legal name, date of birth, nationality</Li>
            <Li>Government-issued ID documents (passport, driving licence)</Li>
            <Li>Proof of address</Li>
            <Li>Source of funds / wealth declaration</Li>
            <Li>Investor classification documents</Li>
          </ul>
          <P><strong>Blockchain data:</strong></P>
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '0.75rem' }}>
            <Li>Your Ethereum-compatible wallet address</Li>
            <Li>On-chain transaction history relating to your use of the platform</Li>
          </ul>
          <P><strong>Technical data:</strong></P>
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '0.75rem' }}>
            <Li>IP address, browser type, device identifiers</Li>
            <Li>Platform usage logs</Li>
          </ul>
        </Section>

        <Section title="3. How We Store KYC Data — FHE Architecture">
          <P>KYC attributes used for on-chain compliance checks (e.g. accreditation status, AML clearance) are stored on-chain as <strong>Fully Homomorphic Encryption (FHE) ciphertexts</strong> via the FHEKYCRegistry contract on Arbitrum Sepolia. This means:</P>
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '0.75rem' }}>
            <Li>Your KYC status is <strong>never exposed in plaintext</strong> on the public blockchain</Li>
            <Li>Compliance checks are computed in encrypted form — only the result (eligible / not eligible) is revealed, not the underlying attributes</Li>
            <Li>Regulatory access is granted via time-bounded, scoped FHE.allow() grants — we cannot selectively modify or withhold what a regulator is entitled to see</Li>
          </ul>
          <P>Raw KYC documents (ID scans, proof of address) are stored off-chain with our KYC provider under their own privacy policy. We do not store plaintext copies of identity documents on our own servers.</P>
        </Section>

        <Section title="4. Legal Basis for Processing">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--brand-light)' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700 }}>Purpose</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700 }}>Legal Basis</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['KYC / AML compliance', 'Legal obligation (Money Laundering Regulations 2017)'],
                  ['Investor classification', 'Legal obligation (FSMA 2000)'],
                  ['Platform access and account management', 'Contractual necessity'],
                  ['Fraud prevention', 'Legitimate interest'],
                  ['Regulatory reporting', 'Legal obligation'],
                ].map(([purpose, basis]) => (
                  <tr key={purpose} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{purpose}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{basis}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="5. Data Retention">
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '0.75rem' }}>
            <Li>KYC documents: retained for <strong>5 years</strong> after the end of the business relationship (AML Regulations requirement)</Li>
            <Li>On-chain encrypted KYC attributes: persist on the blockchain indefinitely (immutable by nature); access is controlled via FHE permissions</Li>
            <Li>Platform usage logs: 12 months</Li>
          </ul>
        </Section>

        <Section title="6. Your Rights (UK GDPR)">
          <P>You have the right to: access your personal data, correct inaccurate data, request erasure (subject to legal retention obligations), restrict or object to processing, data portability, and lodge a complaint with the <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand)' }}>Information Commissioner's Office (ICO)</a>.</P>
          <P>Note: On-chain data (including encrypted ciphertexts) cannot be deleted due to the immutable nature of blockchain. However, without an FHE.allow() grant, no party can decrypt your on-chain attributes.</P>
        </Section>

        <Section title="7. Third Parties">
          <P>We share data with: our KYC provider (identity verification processing), legal counsel (compliance advisory), and regulators (FCA, HMRC, where legally required). We do not sell your data to third parties.</P>
        </Section>

        <div style={{ marginTop: '3rem', padding: '1.25rem 1.5rem', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, color: 'var(--text-secondary)' }}>
          AssetsGrator Ltd · Incorporated in England and Wales ·{' '}
          <a href="mailto:help@assetsgrator.com" style={{ color: 'var(--brand)' }}>help@assetsgrator.com</a>
        </div>
      </div>
    </div>
  );
}
