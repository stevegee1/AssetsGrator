import Link from 'next/link';

export const metadata = { title: 'Risk Disclosure | AssetsGrator', description: 'Risk disclosure for tokenised real-world assets on the AssetsGrator platform.' };

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

export default function RiskPage() {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '3rem 0 5rem' }}>
      <div className="container" style={{ maxWidth: 780 }}>

        <div style={{ marginBottom: '2.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--brand)', marginBottom: 8 }}>Legal</p>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>Risk Disclosure</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Last updated: April 2026</p>
        </div>

        {/* Capital at risk banner */}
        <div style={{
          background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
          border: '1px solid #f59e0b', borderRadius: 10,
          padding: '1.25rem 1.5rem', marginBottom: '2.5rem',
          display: 'flex', gap: 12, alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: '1.5rem' }}>⚠️</span>
          <div>
            <p style={{ fontWeight: 800, fontSize: 14, color: '#92400e', marginBottom: 4 }}>Capital at Risk</p>
            <p style={{ fontSize: 13, color: '#92400e', lineHeight: 1.7 }}>
              This platform is for approved, qualified investors only. Tokenised assets are investments — the value of
              your tokens may go up or down and you may receive back less than you invest. Revenue distributions are
              not guaranteed. Do not invest money you cannot afford to lose. This disclosure does not constitute
              financial advice.
            </p>
          </div>
        </div>

        <Section title="1. Nature of Investment Risk">
          <P>Tokenised real-world assets are investments. The value of your tokens may go up or down. Revenue distributions from underlying assets are not guaranteed. You may receive back less than the value of tokens you hold.</P>
        </Section>

        <Section title="2. Asset-Class Specific Risks">
          <P><strong>Real Estate:</strong></P>
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
            <Li>Property values may decline due to market conditions, regulatory changes, or economic factors</Li>
            <Li>Rental income may be interrupted by vacancy, tenant default, or property damage</Li>
            <Li>Real estate is illiquid — token liquidity depends entirely on secondary market activity and ERC-3643 transfer restrictions</Li>
            <Li>Planning or regulatory changes may affect asset value</Li>
          </ul>
          <P><strong>Renewable Energy (Solar, Wind, Battery Storage):</strong></P>
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
            <Li>Energy production depends on weather conditions and is inherently variable</Li>
            <Li>Revenue is linked to energy prices, feed-in tariffs, and Power Purchase Agreement (PPA) terms — all subject to change</Li>
            <Li>Grid connection and generation licence risks may affect operations</Li>
            <Li>Technology obsolescence and ongoing maintenance costs may reduce returns</Li>
          </ul>
          <P><strong>Carbon Credits:</strong></P>
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
            <Li>Carbon credit values are volatile and highly sensitive to policy changes in emissions trading schemes</Li>
            <Li>Credit validity depends on continued verification under the relevant standard (VCS, Gold Standard)</Li>
            <Li>Regulatory changes may affect the marketability or retirement value of credits</Li>
          </ul>
          <P><strong>Renewable Energy Certificates (RECs):</strong></P>
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
            <Li>REC prices are driven by renewable energy policy, which may change significantly</Li>
            <Li>Country-specific demand and compliance requirements vary and may shift</Li>
            <Li>Certification bodies may update or revoke standards</Li>
          </ul>
        </Section>

        <Section title="3. Blockchain and Smart Contract Risk">
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '0.75rem' }}>
            <Li><strong>Smart contract risk:</strong> The platform's contracts are deployed on Arbitrum Sepolia testnet and are pending independent security audit. Bugs or vulnerabilities could result in loss of funds.</Li>
            <Li><strong>Testnet status:</strong> The platform is currently operating on a test network. Mainnet deployment is subject to successful audit and regulatory engagement.</Li>
            <Li><strong>Network risk:</strong> Arbitrum network outages, forks, or protocol changes may affect platform availability.</Li>
            <Li><strong>Wallet risk:</strong> Loss of access to your wallet (lost private key, compromised seed phrase) may result in permanent, unrecoverable loss of tokens. AssetsGrator cannot recover wallet access.</Li>
            <Li><strong>FHE co-processor risk:</strong> The Fhenix CoFHE co-processor is a novel technology. Operational issues with the co-processor may affect encrypted computation and platform functionality.</Li>
          </ul>
        </Section>

        <Section title="4. Regulatory and Legal Risk">
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '0.75rem' }}>
            <Li>The regulatory framework for digital securities in the UK is evolving. Changes to FSMA, FCA rules, or government policy may affect the platform's ability to operate.</Li>
            <Li>The platform is not currently FCA-authorised. It is operating under applicable exemptions during the testnet and sandbox phase. Regulatory status may change.</Li>
            <Li>Tax treatment of tokenised assets and revenue distributions varies by jurisdiction and is subject to change. Investors are solely responsible for their own tax obligations.</Li>
          </ul>
        </Section>

        <Section title="5. Liquidity Risk">
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '0.75rem' }}>
            <Li>Asset Tokens are not freely tradeable. Transfers are restricted to KYC-verified, whitelisted wallets via ERC-3643 compliance modules.</Li>
            <Li>Secondary market availability is not guaranteed. There may be no buyer for your tokens at the time you wish to sell.</Li>
            <Li>Lock-up periods enforced by the TimeLocksModule prevent transfers during statutory holding periods.</Li>
          </ul>
        </Section>

        <Section title="6. Concentration Risk">
          <P>Investing in a single asset or a single asset class concentrates your exposure. Diversification across multiple assets and asset classes reduces but does not eliminate risk.</P>
        </Section>

        <Section title="7. Platform and Counterparty Risk">
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '0.75rem' }}>
            <Li>AssetsGrator Ltd is a technology platform. We are not an investment manager, financial adviser, or regulated custodian.</Li>
            <Li>The platform depends on third-party infrastructure (Arbitrum network, Fhenix CoFHE co-processor, IPFS, KYC providers). Failure of third-party services may affect platform availability.</Li>
            <Li>AssetsGrator is an early-stage company. There is a risk that the company may cease operations.</Li>
          </ul>
        </Section>

        <Section title="8. No Financial Advice">
          <P>Nothing on this platform constitutes financial, investment, legal, or tax advice. You should seek independent professional advice before making any investment decision. See our <Link href="/legal/terms" style={{ color: 'var(--brand)' }}>Terms of Service</Link> for full disclaimer.</P>
        </Section>

        <div style={{ marginTop: '3rem', padding: '1.25rem 1.5rem', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, color: 'var(--text-secondary)' }}>
          AssetsGrator Ltd · Incorporated in England and Wales ·{' '}
          <a href="mailto:help@assetsgrator.com" style={{ color: 'var(--brand)' }}>help@assetsgrator.com</a>
        </div>
      </div>
    </div>
  );
}
