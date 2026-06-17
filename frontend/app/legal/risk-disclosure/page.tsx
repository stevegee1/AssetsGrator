import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Risk Disclosure | AssetsGrator',
  description: 'Material risks associated with investing in tokenised real-world assets on the AssetsGrator platform.',
};

const RISKS = [
  {
    icon: '🏚️',
    title: 'Property and Asset Valuation Risk',
    color: '#dc2626',
    bg: '#fee2e2',
    content: 'The value of underlying real estate and other real-world assets can fall as well as rise. Valuations are conducted by authorised third-party valuators and published transparently on-chain via our AssetValuation contract. However, valuations are point-in-time estimates. Market conditions, interest rates, planning decisions, and macroeconomic factors may cause the actual realisable value to differ materially from the published valuation. You may receive back less than you invested.',
  },
  {
    icon: '🔒',
    title: 'Illiquidity Risk',
    color: '#d97706',
    bg: '#fef3c7',
    content: 'Asset Tokens are not listed on any public exchange. They can only be transferred to other whitelisted, KYC-verified investors. There is no guarantee that a buyer will be available when you wish to sell. You should be prepared to hold your investment for the full term of the asset (which may be 3–10 years). Do not invest funds you may need in the short term.',
  },
  {
    icon: '⛓️',
    title: 'Smart Contract and Technology Risk',
    color: '#7c3aed',
    bg: '#ede9fe',
    content: 'AssetsGrator\'s platform relies on smart contracts deployed on the Arbitrum blockchain. While our contracts are audited and tested, they may contain unforeseen bugs or vulnerabilities. Blockchain transactions are irreversible. We cannot undo a transaction once confirmed on-chain.',
  },
  {
    icon: '⚖️',
    title: 'Regulatory and Legal Risk',
    color: '#0ea5e9',
    bg: '#e0f2fe',
    content: 'AssetsGrator currently operates within the FCA Regulatory Sandbox. This is a controlled testing environment — full FCA authorisation has not yet been granted. Regulatory changes, including changes to the treatment of digital security tokens or cryptoassets, could materially affect the platform\'s operations. In extreme cases, regulatory intervention could require suspension of the platform or forced unwinding of positions.',
  },
  {
    icon: '📉',
    title: 'Concentration and Sector Risk',
    color: '#16a34a',
    bg: '#dcfce7',
    content: 'If your investment is concentrated in a single asset or a single asset class (e.g. UK residential real estate), you bear the risk of that sector underperforming. We recommend investors diversify across multiple assets and asset classes. AssetsGrator tokens do not represent a diversified fund — each token corresponds to a specific underlying asset.',
  },
  {
    icon: '💵',
    title: 'Platform Ledger Risk',
    color: '#2563eb',
    bg: '#dbeafe',
    content: 'Loan disbursements and income distributions are made in GBPT, a Sterling-pegged platform ledger token representing physical bank wire deposits. While GBPT settles 1:1 against Sterling bank wire reserves, it is not a bank deposit and is not covered by the FSCS. Any disruption in platform banking channels or sterling reserve accounts could affect redemption liquidity.',
  },
  {
    icon: '🏢',
    title: 'Platform and Counterparty Risk',
    color: '#6b7280',
    bg: '#f3f4f6',
    content: 'If AssetsGrator Ltd ceases operations, you may need to seek legal remedies to enforce your ownership rights in the underlying asset. We maintain off-chain legal documentation (title deeds, generation licences, VCS/RECS certifications) that evidence your ownership claim. However, the enforcement process could be costly and time-consuming. We recommend all investors retain independent legal advice.',
  },

];

export default function RiskDisclosurePage() {
  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: '5rem' }}>
      <div style={{ background: '#fef3c7', borderBottom: '2px solid #f59e0b', padding: '0.75rem 1.25rem', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: '#92400e', fontWeight: 600, margin: 0 }}>
          ⚠️ Draft Document — Pending legal team review. Not yet in force.
        </p>
      </div>

      <div className="container" style={{ maxWidth: 860, paddingTop: '3rem', paddingBottom: '3rem' }}>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--brand)', marginBottom: 8 }}>Legal</p>
        <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 900, color: '#111827', marginBottom: 8 }}>Risk Disclosure</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Effective date: 1 May 2026 &nbsp;·&nbsp; AssetsGrator Ltd
        </p>

        {/* Capital at risk banner */}
        <div style={{ background: '#dc2626', borderRadius: 14, padding: '1.25rem 1.5rem', marginBottom: '3rem' }}>
          <p style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0 }}>
            ⚠️ Capital at Risk — Your investment can fall as well as rise. You may get back less than you invest. Investments in tokenised real-world assets are illiquid, long-term, and suitable only for investors who can bear the loss of their entire investment.
          </p>
        </div>

        <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.8, marginBottom: '2.5rem' }}>
          Before investing on the AssetsGrator platform, please read the following material risk factors carefully. This disclosure does not constitute financial advice. If you are unsure whether this type of investment is appropriate for you, please consult an independent financial adviser.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {RISKS.map((risk) => (
            <div key={risk.title} style={{
              background: 'var(--white)',
              border: '1px solid var(--border)',
              borderLeft: `4px solid ${risk.color}`,
              borderRadius: 12,
              padding: '1.5rem',
              display: 'flex',
              gap: 16,
              alignItems: 'flex-start',
            }}>
              <div style={{
                flexShrink: 0, width: 48, height: 48, borderRadius: 12,
                background: risk.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.4rem',
              }}>
                {risk.icon}
              </div>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 800, color: '#111827', marginBottom: 8 }}>{risk.title}</h2>
                <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.75, margin: 0 }}>{risk.content}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '3rem', padding: '1.5rem', background: '#f8f9fb', borderRadius: 12, border: '1px solid var(--border)' }}>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
            This Risk Disclosure was prepared as of April 2026. AssetsGrator Ltd reserves the right to update this document to reflect material changes in the platform, regulatory environment, or risk profile of listed assets. The latest version is always available at assetsgrator.com/legal/risk-disclosure.
          </p>
        </div>
      </div>
    </main>
  );
}
