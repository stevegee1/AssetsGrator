import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | AssetsGrator',
  description: 'Terms and conditions governing use of the AssetsGrator tokenised real-world asset platform.',
};

export default function TermsPage() {
  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh', paddingTop: '2rem', paddingBottom: '5rem' }}>
      {/* Draft notice */}
      <div style={{ background: '#fef3c7', borderBottom: '2px solid #f59e0b', padding: '0.75rem 1.25rem', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: '#92400e', fontWeight: 600, margin: 0 }}>
          ⚠️ Draft Document — Pending legal team review. Not yet in force.
        </p>
      </div>

      <div className="container" style={{ maxWidth: 820, paddingTop: '3rem' }}>
        {/* Header */}
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--brand)', marginBottom: 8 }}>Legal</p>
        <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 900, color: '#111827', marginBottom: 8 }}>Terms of Service</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: '3rem' }}>
          Effective date: 1 May 2026 &nbsp;·&nbsp; AssetsGrator Ltd, England &amp; Wales
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

          <Section title="1. About AssetsGrator">
            <p>AssetsGrator Ltd (&ldquo;Company&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) operates an online platform that enables verified investors to acquire, hold, and transfer fractional interests in tokenised real-world assets (&ldquo;RWAs&rdquo;) including UK real estate, energy infrastructure, and carbon credits.</p>
            <p>The platform issues ERC-3643-compliant security tokens (&ldquo;Asset Tokens&rdquo;) on the Arbitrum blockchain network. AssetsGrator is currently operating within the Financial Conduct Authority (&ldquo;FCA&rdquo;) Regulatory Sandbox.</p>
          </Section>

          <Section title="2. Eligibility and Platform Access">
            <p>Access to the AssetsGrator platform is restricted to:</p>
            <ul>
              <li>Persons who are 18 years of age or older;</li>
              <li>Persons classified as <strong>Sophisticated Investors</strong>, <strong>High Net Worth Individuals</strong>, or <strong>Professional Investors</strong> under applicable UK financial regulation;</li>
              <li>Persons who have successfully completed our KYC (Know Your Customer) and AML (Anti-Money Laundering) verification process, conducted via our partner Sumsub; and</li>
              <li>Persons whose wallets have been whitelisted on-chain via our ERC-3643 compliance module.</li>
            </ul>
            <p>We reserve the right to refuse, suspend, or revoke access at any time for any reason, including regulatory requirements or suspected breach of these Terms.</p>
          </Section>

          <Section title="3. Nature of Asset Tokens">
            <p>Asset Tokens are ERC-3643 compliant digital security tokens representing fractional ownership interests in underlying real-world assets. They are not:</p>
            <ul>
              <li>Guaranteed to increase in value;</li>
              <li>Deposits or savings products covered by the Financial Services Compensation Scheme (FSCS);</li>
              <li>Freely transferable — transfers are restricted to whitelisted, verified wallet addresses via the T-REX compliance module.</li>
            </ul>
            <p>Token holders participate in governance votes and receive on-chain revenue distributions proportional to their verified holdings.</p>
          </Section>

          <Section title="4. Fees">
            <p>Platform fees are charged on asset revenue distributions and loan disbursements. The fee framework operates as follows:</p>
            <ul>
              <li><strong>Public hard caps:</strong> Platform fees will always remain between 1% and 3% of gross transaction value for all assets. These caps are embedded as immutable constants in our FeeManager smart contract.</li>
              <li><strong>Asset-specific rates:</strong> The exact fee rate for each individual asset is set by the FeeManager smart contract.</li>
            </ul>
            <p>Fee structures may be updated by governance vote of token holders. Any changes will be published with at least 30 days&rsquo; notice.</p>
          </Section>

          <Section title="5. Prohibited Uses">
            <p>You agree not to use the platform to:</p>
            <ul>
              <li>Circumvent or attempt to circumvent KYC/AML compliance controls;</li>
              <li>Transfer Asset Tokens to non-whitelisted wallets;</li>
              <li>Engage in market manipulation, wash trading, or other fraudulent activities;</li>
              <li>Violate any applicable law, including UK sanctions regulations;</li>
              <li>Reverse-engineer, decompile, or exploit our smart contracts or platform systems;</li>
              <li>Use the platform if you are a Restricted Person (resident of a jurisdiction where access is prohibited by applicable law).</li>
            </ul>
          </Section>

          <Section title="6. Smart Contracts and Technology Risk">
            <p>Asset Tokens are governed by smart contracts deployed on the Arbitrum blockchain. While we take all reasonable steps to audit and test our contracts, you acknowledge that:</p>
            <ul>
              <li>Smart contracts may contain bugs or vulnerabilities despite audit processes;</li>
              <li>Blockchain transactions are irreversible; and</li>
              <li>We are not liable for losses arising from blockchain network failures, gas price spikes, or third-party protocol failures.</li>
            </ul>
          </Section>

          <Section title="7. Intellectual Property">
            <p>All content on the AssetsGrator platform, including software, smart contracts, design, and documentation, is the intellectual property of AssetsGrator Ltd or its licensors. You may not copy, distribute, or create derivative works without our express written consent.</p>
          </Section>

          <Section title="8. Limitation of Liability">
            <p>To the maximum extent permitted by applicable law, AssetsGrator Ltd and its officers, directors, and employees shall not be liable for:</p>
            <ul>
              <li>Loss of investment value;</li>
              <li>Loss of profits, revenue, or business;</li>
              <li>Indirect, consequential, or incidental damages; or</li>
              <li>Losses arising from third-party services including Sumsub (KYC) or Arbitrum network outages.</li>
            </ul>
            <p>Our total aggregate liability to you shall not exceed the platform fees paid by you in the 12 months preceding the claim.</p>
          </Section>

          <Section title="9. Amendments">
            <p>We may amend these Terms from time to time. Material changes will be communicated by email and in-platform notification with at least 14 days&rsquo; notice. Continued use of the platform after the effective date constitutes acceptance.</p>
          </Section>

          <Section title="10. Governing Law and Jurisdiction">
            <p>These Terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.</p>
            <p>We are currently operating within the FCA Regulatory Sandbox. These Terms will be updated upon receipt of full FCA authorisation.</p>
          </Section>

          <Section title="11. Contact">
            <p>For any questions regarding these Terms, please contact:</p>
            <p><strong>AssetsGrator Ltd</strong><br />
            Email: <a href="mailto:legal@assetsgrator.com" style={{ color: 'var(--brand)' }}>legal@assetsgrator.com</a><br />
            Registered in England &amp; Wales</p>
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
