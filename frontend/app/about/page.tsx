import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About AssetsGrator | Privacy-First Tokenised Real-World Assets',
  description: 'AssetsGrator is a premier RWA tokenization platform, built on ERC-3643 and Arbitrum.',
};

const PILLARS = [
  {
    icon: '🏠',
    title: 'Real Assets, Real Ownership',
    desc: 'Every asset listed on AssetsGrator is backed by verified off-chain legal instruments — title deeds for real estate, generation licences for energy projects, VCS and RECS certifications for carbon and renewable credits. Token holders are co-owners, not just certificate holders.',
  },
  {
    icon: '🔐',
    title: 'On-Chain Compliance & Security',
    desc: 'Every investor wallet is verified through T-REX Identity Registries. Compliant transfers are validated at the smart contract level using the ERC-3643 standard.',
  },
  {
    icon: '⚖️',
    title: 'Regulatory-First Design',
    desc: 'We built with compliance at the core, not as an afterthought. ERC-3643 (T-REX) ensures only verified investors can hold or transfer Asset Tokens. KYC is conducted via Sumsub. We operate within the FCA Regulatory Sandbox to ensure our model meets UK securities law.',
  },
  {
    icon: '🤝',
    title: 'Co-Ownership and Governance',
    desc: 'Token holders are co-owners with a voice. Governance votes are conducted on-chain, proportional to verified holdings. Revenue from underlying assets — rent, energy tariffs, carbon credit proceeds — is distributed automatically, without a fund manager in the middle.',
  },
];

const STACK = [
  { name: 'ERC-3643 / T-REX', role: 'Compliance module for security token transfers', color: '#0ea5e9' },
  { name: 'Sumsub', role: 'KYC / AML identity verification', color: '#10b981' },
  { name: 'Arbitrum', role: 'Layer 2 blockchain network — low gas, EVM-compatible', color: '#2d6be4' },
  { name: 'OpenZeppelin', role: 'Smart contract security primitives and auditing', color: '#7c3aed' },
  { name: 'FCA Sandbox', role: 'UK Financial Conduct Authority regulatory testing', color: '#be185d' },
];

export default function AboutPage() {
  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #0f0a2e 0%, #1e1b4b 50%, #1a3a6b 100%)', padding: 'clamp(4rem, 10vw, 8rem) 1.25rem' }}>
        <div className="container" style={{ maxWidth: 800, textAlign: 'center' }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#a5b4fc', marginBottom: 16 }}>
            About AssetsGrator
          </p>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 900, color: '#fff', lineHeight: 1.2, marginBottom: 20 }}>
            Institutional-Grade Tokenisation &<br />Compliance,<br />
            <span style={{ background: 'linear-gradient(90deg, #818cf8, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              by Design
            </span>
          </h1>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, marginBottom: 32 }}>
            AssetsGrator tokenises institutional-quality real-world assets — UK real estate, energy infrastructure, and carbon credits — and makes them accessible to verified investors through secure blockchain technology.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/kyc">
              <button className="btn btn-primary btn-lg">Apply for Access</button>
            </Link>
            <Link href="/about/how-it-works">
              <button className="btn btn-outline btn-lg" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.07)' }}>
                How It Works
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="section-pad" style={{ background: 'var(--white)' }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--brand)', marginBottom: 8 }}>Our Mission</p>
            <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 800, color: '#111827', marginBottom: '1.25rem' }}>
              Institutional-grade assets. Compliant security.
            </h2>
            <div style={{ fontSize: 16, color: '#374151', lineHeight: 1.85, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p>Real-world asset investment has historically been the preserve of institutions and ultra-high-net-worth individuals — due to high minimum tickets and complex regulatory compliance requirements.</p>
              <p>We solved both problems. AssetsGrator&rsquo;s ERC-3643 compliance infrastructure lowers the minimum ticket to fractional ownership while ensuring on-chain identity verification and automated compliance checks.</p>
            <p>The result: a regulated, privacy-first marketplace for tokenised real-world assets that serious investors can trust.</p>
          </div>
        </div>
      </section>

      {/* 4 pillars */}
      <section className="section-pad" style={{ background: 'var(--bg)' }}>
        <div className="container">
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--brand)', marginBottom: 8 }}>What We Stand For</p>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, color: '#111827', marginBottom: '2rem' }}>Four Core Principles</h2>
          <div className="grid-2" style={{ gap: '1.25rem' }}>
            {PILLARS.map((p) => (
              <div key={p.title} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.75rem' }}>
                <span style={{ fontSize: '1.75rem', display: 'block', marginBottom: 12 }}>{p.icon}</span>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 10 }}>{p.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.75 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="section-pad" style={{ background: 'var(--white)' }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--brand)', marginBottom: 8 }}>Technology</p>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, color: '#111827', marginBottom: '0.5rem' }}>Built on Best-in-Class Protocols</h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: '2rem' }}>Every component was chosen for regulatory robustness, cryptographic rigour, and long-term maintainability.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {STACK.map((s) => (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '1rem 1.25rem', background: 'var(--bg)', border: '1px solid var(--border)', borderLeft: `4px solid ${s.color}`, borderRadius: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                <div>
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{s.name}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)', marginLeft: 8 }}>— {s.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Asset classes */}
      <section className="section-pad" style={{ background: 'linear-gradient(135deg, #0f0a2e, #1e1b4b)' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: 700 }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#a5b4fc', marginBottom: 8 }}>Asset Classes</p>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, color: '#fff', marginBottom: '0.75rem' }}>What You Can Invest In</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: '2.5rem' }}>All assets are legally documented and independently valued before listing.</p>
          <div className="grid-3" style={{ gap: '1rem' }}>
            {[
              { icon: '🏘️', title: 'UK Real Estate', sub: 'Residential &amp; commercial property with verified title deeds' },
              { icon: '⚡', title: 'Energy Infrastructure', sub: 'Solar, wind, and grid assets with generation licences' },
              { icon: '🌿', title: 'Carbon &amp; ESG Credits', sub: 'VCS-certified carbon credits and RECS renewable energy certificates' },
            ].map((a) => (
              <div key={a.title} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '1.5rem' }}>
                <span style={{ fontSize: '2rem', display: 'block', marginBottom: 10 }}>{a.icon}</span>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{a.title}</h3>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65 }} dangerouslySetInnerHTML={{ __html: a.sub }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-pad" style={{ background: 'var(--white)', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: 540 }}>
          <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', fontWeight: 800, color: '#111827', marginBottom: 12 }}>Ready to explore?</h2>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Platform access is gated — complete KYC verification to get started.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/kyc"><button className="btn btn-primary btn-lg">Apply for Access</button></Link>
            <Link href="/about/team"><button className="btn btn-outline btn-lg">Meet the Team</button></Link>
          </div>
        </div>
      </section>
    </main>
  );
}
