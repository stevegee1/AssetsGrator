import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | AssetsGrator',
  description: 'How AssetsGrator collects, stores, and protects your personal data in accordance with UK GDPR.',
};

export default function PrivacyPage() {
  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: '5rem' }}>
      <div style={{ background: '#fef3c7', borderBottom: '2px solid #f59e0b', padding: '0.75rem 1.25rem', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: '#92400e', fontWeight: 600, margin: 0 }}>
          ⚠️ Draft Document — Pending legal team review. Not yet in force.
        </p>
      </div>

      <div className="container" style={{ maxWidth: 820, paddingTop: '3rem', paddingBottom: '3rem' }}>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--brand)', marginBottom: 8 }}>Legal</p>
        <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 900, color: '#111827', marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: '3rem' }}>
          Effective date: 1 May 2026 &nbsp;·&nbsp; AssetsGrator Ltd, England &amp; Wales &nbsp;·&nbsp; UK GDPR compliant
        </p>

        {/* Privacy highlight box */}
        <div style={{ background: 'linear-gradient(135deg, #eef2ff, #e0f2fe)', border: '1px solid #c7d2fe', borderRadius: 14, padding: '1.5rem', marginBottom: '2.5rem', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <span style={{ fontSize: '2rem' }}>🔐</span>
          <div>
            <p style={{ fontWeight: 700, color: '#1e1b4b', marginBottom: 4 }}>On-chain Compliance & Security</p>
            <p style={{ fontSize: 14, color: '#4338ca', lineHeight: 1.7 }}>
              Your personal identity files are stored securely off-chain. The blockchain only records a standard ERC-3643 verification status flag, ensuring your identity is protected.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

          <Section title="1. Who We Are">
            <p>AssetsGrator Ltd (&ldquo;we&rdquo;, &ldquo;us&rdquo;) is the data controller for personal data processed through our platform. We are registered in England &amp; Wales and currently operate within the FCA Regulatory Sandbox.</p>
            <p>Contact: <a href="mailto:privacy@assetsgrator.com" style={{ color: 'var(--brand)' }}>privacy@assetsgrator.com</a></p>
          </Section>

          <Section title="2. Data We Collect">
            <p><strong>Identity &amp; KYC Data:</strong> Full name, date of birth, nationality, government-issued ID, proof of address, and selfie photographs — collected for legal KYC/AML compliance and processed by our KYC partner, Sumsub.</p>
            <p><strong>Investor Classification Data:</strong> Income, net worth, investment experience, and professional status — collected to verify eligibility as a Sophisticated or High Net Worth Investor under UK regulation.</p>
            <p><strong>Wallet &amp; Blockchain Data:</strong> Your Ethereum wallet address is publicly recorded on the Arbitrum blockchain as part of the ERC-3643 token whitelist. Your token balances are recorded on the public ledger associated with your wallet address.</p>
            <p><strong>Platform Usage Data:</strong> Log data, IP addresses, browser type, and page interaction data — collected via standard server logs and used for security and performance monitoring.</p>
            <p><strong>Communications:</strong> Emails or messages you send us, including support requests.</p>
          </Section>

          <Section title="3. Legal Basis for Processing">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: 'var(--bg)', textAlign: 'left' }}>
                  <th style={{ padding: '0.6rem 0.8rem', borderBottom: '2px solid var(--border)' }}>Purpose</th>
                  <th style={{ padding: '0.6rem 0.8rem', borderBottom: '2px solid var(--border)' }}>Legal Basis</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['KYC / AML verification', 'Legal obligation (The Money Laundering Regulations 2017)'],
                  ['Investor eligibility assessment', 'Legal obligation (FCA COBS rules)'],
                  ['Platform access and token issuance', 'Contract performance'],
                  ['Revenue distribution', 'Contract performance'],
                  ['Platform security and fraud prevention', 'Legitimate interests'],
                  ['Marketing communications', 'Consent (opt-in only)'],
                ].map(([purpose, basis], i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'var(--bg)' }}>
                    <td style={{ padding: '0.6rem 0.8rem' }}>{purpose}</td>
                    <td style={{ padding: '0.6rem 0.8rem', color: 'var(--text-secondary)' }}>{basis}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section title="4. Third-Party Data Processors">
            <p>We share your data with the following processors under GDPR-compliant Data Processing Agreements:</p>
            <ul>
              <li><strong>Sumsub</strong> — KYC/AML identity verification and ongoing monitoring.</li>
              <li><strong>Arbitrum / Ethereum network</strong> — Wallet addresses are recorded on a public blockchain. We do not control or own this infrastructure.</li>
              <li><strong>Cloud infrastructure providers</strong> — Hosting and backend services, with data stored within the UK/EEA.</li>
            </ul>
            <p>We do not sell your personal data to any third party.</p>
          </Section>

          <Section title="5. On-Chain Data and Privacy">
            <p>Certain data is stored on the Arbitrum public blockchain as part of smart contract operations. This includes your wallet address as a whitelisted identity in the ERC-3643 compliance module.</p>
            <p>No sensitive personal identity documents (such as passports or bank statements) are ever written to the blockchain. All transaction details and token holdings are recorded publicly associated with your wallet address, in accordance with the public nature of distributed ledger technology.</p>
          </Section>

          <Section title="6. Your Rights Under UK GDPR">
            <p>You have the following rights regarding your personal data:</p>
            <ul>
              <li><strong>Right of access (Art. 15)</strong> — Request a copy of the data we hold about you.</li>
              <li><strong>Right to rectification (Art. 16)</strong> — Request correction of inaccurate data.</li>
              <li><strong>Right to erasure (Art. 17)</strong> — Request deletion of your data, subject to our legal retention obligations.</li>
              <li><strong>Right to restrict processing (Art. 18)</strong> — Request that we limit how we use your data.</li>
              <li><strong>Right to data portability (Art. 20)</strong> — Receive your data in a machine-readable format.</li>
              <li><strong>Right to object (Art. 21)</strong> — Object to processing based on legitimate interests.</li>
              <li><strong>Right to withdraw consent</strong> — Withdraw marketing consent at any time.</li>
            </ul>
            <p>Please note: we cannot erase data recorded on the public Arbitrum blockchain (wallet address on whitelist, token transfers, or balances).</p>
            <p>To exercise your rights, contact: <a href="mailto:privacy@assetsgrator.com" style={{ color: 'var(--brand)' }}>privacy@assetsgrator.com</a></p>
          </Section>

          <Section title="7. Data Retention">
            <p>We retain data for the following periods:</p>
            <ul>
              <li><strong>KYC records:</strong> 5 years from the end of the business relationship (AML regulatory requirement).</li>
              <li><strong>Transaction records:</strong> 6 years (HMRC and UK company law requirement).</li>
              <li><strong>Communication logs:</strong> 2 years.</li>
              <li><strong>Marketing data:</strong> Until consent is withdrawn.</li>
            </ul>
          </Section>

          <Section title="8. Cookies">
            <p>We use essential cookies only — required for authentication and security. We do not use advertising or tracking cookies. A cookie preference centre will be provided on the platform.</p>
          </Section>

          <Section title="9. Changes to This Policy">
            <p>We will notify you of material changes by email with at least 14 days&rsquo; notice. The current version is always available at assetsgrator.com/legal/privacy.</p>
          </Section>

          <Section title="10. Complaints">
            <p>If you are unhappy with how we handle your data, you may lodge a complaint with the Information Commissioner&rsquo;s Office (ICO) at <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand)' }}>ico.org.uk</a>.</p>
          </Section>

        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '2px solid var(--border)' }}>
        {title}
      </h2>
      <div style={{ fontSize: 15, color: '#374151', lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {children}
      </div>
    </section>
  );
}
