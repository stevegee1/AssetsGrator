'use client';

import Link from 'next/link';
import {
  ArrowRight, Coins, ShieldCheck, Building2, FileText,
  CalendarDays, Users, Landmark, ArrowRightCircle, Lock,
  Eye, Zap, Key, Brain,
} from 'lucide-react';

const FHE_FEATURES = [
  {
    icon: ShieldCheck,
    color: '#6366f1',
    contract: 'FHEKYCRegistry',
    title: 'Encrypted KYC / AML',
    desc: 'Investor identity and compliance status stored as FHE ciphertexts. Verifiers decrypt only with permission — your KYC data is never exposed on-chain.',
  },
  {
    icon: Eye,
    color: '#0891b2',
    contract: 'FHEAssetValuation',
    title: 'Private Asset Valuations',
    desc: 'Confidential appraisals locked in encrypted form. Only authorised parties decrypt — preventing front-running and protecting sensitive deal intel.',
  },
  {
    icon: Coins,
    color: '#059669',
    contract: 'FHEFeeManager',
    title: 'Shielded Fee Rates',
    desc: 'Platform fee schedules stored as ciphertexts. Rates update without exposing exact margins — settlement uses a Synchronous Revelation Bridge for correctness.',
  },
  {
    icon: Brain,
    color: '#7c3aed',
    contract: 'FHEPortfolioRegistry',
    title: 'Confidential Portfolio',
    desc: "Every holder's encrypted balance and yield history stay private via FHE shadow-sync across ERC-3643 transfers, mints, and burns.",
  },
  {
    icon: Zap,
    color: '#d97706',
    contract: 'ConfidentialLoan',
    title: 'Privacy-Preserving Loans',
    desc: 'Loan terms, collateral ratios, and repayments are negotiated entirely in encrypted form — lenders and borrowers interact without revealing financials.',
  },
];

export default function LandingPage() {
  return (
    <div>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section style={{
        position: 'relative',
        height: 'min(600px, 78vh)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <img
          src="/hero-properties.png"
          alt="London Georgian townhouses"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.65) 60%, rgba(0,0,0,0.85) 100%)' }} />

        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 1.25rem', maxWidth: 760 }}>
          <span style={{
            display: 'inline-block', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.25)', borderRadius: 100, padding: '6px 18px',
            fontSize: 12, fontWeight: 600, color: '#fff', letterSpacing: '0.06em',
            textTransform: 'uppercase', marginBottom: '1.5rem',
          }}>
            Real Asset · On-Chain + Legal Title Deed
          </span>

          <h1 style={{
            fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontWeight: 900, color: '#fff',
            lineHeight: 1.1, marginBottom: '1.25rem', letterSpacing: '-0.02em',
          }}>
            Grow a Global, Digital<br />
            <span style={{
              background: 'linear-gradient(90deg, #60c8ff, #a78bfa)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Real Asset Portfolio</span>
          </h1>

          <p style={{
            color: 'rgba(255,255,255,0.82)', fontSize: 'clamp(0.95rem, 2vw, 1.15rem)',
            lineHeight: 1.6, maxWidth: 600, margin: '0 auto 1.25rem',
          }}>
            Fractional ownership of assets — blockchain-verified on-chain and backed by
            off-chain legal title deeds. Buy from £5, receive income, and vote on asset decisions.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: '2rem' }}>
            {['✓ Own from £5', '✓ Earn income', '✓ Legally backed', '✓ Vote on how your assets are used and managed'].map(chip => (
              <span key={chip} style={{
                background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(6px)',
                border: '1px solid rgba(255,255,255,0.2)', borderRadius: 100,
                padding: '6px 14px', fontSize: 13, color: '#fff', fontWeight: 500, whiteSpace: 'nowrap',
              }}>{chip}</span>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '2.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
            {[
              { value: '£5', label: 'Min. Investment' },
              { value: '100%', label: 'Legally Backed' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/properties">
              <button className="btn btn-primary btn-lg" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                Browse All Assets <ArrowRight size={17} />
              </button>
            </Link>
            <a href="https://silk-parcel-39c.notion.site/AssetsGrator-2f1cb29cfeae80578d25eb78550a4f4b" target="_blank" rel="noopener noreferrer">
              <button style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.3)', borderRadius: 100,
                padding: '10px 24px', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}>
                Read Whitepaper
              </button>
            </a>
          </div>
        </div>
      </section>

      {/* ── FHE PRIVACY STACK ────────────────────────────────────────────────── */}
      <section style={{ padding: '5rem 0', background: 'linear-gradient(180deg, #0f0a2e 0%, #111827 100%)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.35)',
              borderRadius: 100, padding: '5px 16px',
              fontSize: 11, fontWeight: 700, color: '#a78bfa', letterSpacing: '0.07em', textTransform: 'uppercase',
              marginBottom: 14,
            }}>
              <Lock size={10} /> Powered by CoFHE · Arbitrum Sepolia
            </span>
            <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 900, color: '#fff', marginBottom: 12 }}>
              FHE Privacy Stack
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15, maxWidth: 560, margin: '0 auto' }}>
              Five Fully Homomorphic Encryption contracts guard every sensitive operation —
              compute on encrypted data without ever decrypting it.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {FHE_FEATURES.map(f => (
              <div
                key={f.contract}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  borderRadius: 14, padding: '1.6rem',
                  borderTop: `3px solid ${f.color}`,
                  transition: 'transform 0.15s, box-shadow 0.15s',
                  cursor: 'default',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.4)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                }}
              >
                <div style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 44, height: 44, borderRadius: 10,
                  background: `${f.color}22`, marginBottom: 14,
                }}>
                  <f.icon size={22} color={f.color} />
                </div>
                <div style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                  color: f.color, marginBottom: 6, fontFamily: 'monospace',
                }}>
                  {f.contract}.sol
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>

          {/* FHE flow strip */}
          <div style={{
            marginTop: '3rem',
            background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 14, padding: '1.75rem 2rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 0, flexWrap: 'wrap',
          }}>

          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────────── */}
      <section style={{ padding: '4rem 0', background: 'var(--bg)' }}>
        <div className="container">
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--brand)', marginBottom: 8 }}>Simple Process</p>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>Start in Four Steps</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: '2.5rem' }}>From sign-up to earning income in minutes.</p>
          <div className="grid-4">
            {[
              { n: '01', title: 'Verify Identity', desc: 'Complete KYC once — encrypted via FHE so your identity data is never stored in plaintext on-chain. Takes under 5 minutes.' },
              { n: '02', title: 'Browse UK Assets', desc: 'Explore UK properties, offices, and land. Review financials and legal documents backed by real title deeds.' },
              { n: '03', title: 'Buy Tokens', desc: 'Purchase ERC-3643 ownership tokens from £5. Each token is your on-chain share of the asset.' },
              { n: '04', title: 'Earn & Vote', desc: 'Receive income automatically. Vote on major asset decisions as a co-owner. Your portfolio stays private.' },
            ].map(s => (
              <div key={s.n} className="card" style={{ padding: '1.5rem', borderRadius: 12, borderTop: '3px solid var(--brand)' }}>
                <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--border)', display: 'block', marginBottom: 10 }}>{s.n}</span>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REVENUE FLOW ─────────────────────────────────────────────────────── */}
      <section style={{ padding: '4rem 0', background: 'var(--white)', borderTop: '1px solid var(--border)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--brand)', marginBottom: 8 }}>How Income Works</p>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>Asset Revenue, Paid to You</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: '3rem' }}>
            Rental and asset revenue flows automatically — fee rates managed by the FHEFeeManager.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 0 }}>
            {[
              { emoji: '🏠', label: 'UK Asset', sub: 'Property / Land' },
              null,
              { emoji: '💷', label: 'Revenue', sub: 'Rent / Returns' },
              null,
              { emoji: '🔐', label: 'FHE Fees', sub: 'Encrypted rate' },
              null,
              { emoji: '💵', label: 'USDC', sub: 'Stable Payment' },
              null,
              { emoji: '🪙', label: 'Your Token', sub: 'Auto-distributed' },
              null,
              { emoji: '🏦', label: 'Your Wallet', sub: 'Withdraw anytime' },
            ].map((item, i) => {
              if (item === null) return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '0 4px' }}>
                  <ArrowRightCircle size={22} color="var(--brand)" />
                </div>
              );
              return (
                <div key={i} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  borderRadius: 14, padding: '1.25rem 1rem', minWidth: 100,
                }}>
                  <span style={{ fontSize: '2rem', marginBottom: 6 }}>{item.emoji}</span>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{item.label}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{item.sub}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FEATURE CARDS ────────────────────────────────────────────────────── */}
      <section style={{ padding: '4rem 0', background: 'var(--bg)' }}>
        <div className="container">
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--brand)', marginBottom: 8 }}>Our Advantage</p>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>Built for Real Investors</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: '2.5rem' }}>Privacy-first infrastructure meets real-world asset ownership.</p>
          <div className="grid-2" style={{ gap: '1.25rem' }}>
            {[
              {
                icon: Coins,
                title: 'Fractional Ownership — From £5',
                desc: 'Each asset is tokenised into ERC-3643 compliant security tokens. Buy as little as one token and start earning proportional rental income immediately.',
              },
              {
                icon: Lock,
                title: 'FHE-Encrypted Privacy Layer',
                desc: '5 Fully Homomorphic Encryption contracts guard KYC status, valuations, fee rates, portfolios, and loan terms — computed without ever decrypting sensitive data.',
              },
              {
                icon: FileText,
                title: 'Legal Deeds, Verified Off-Chain',
                desc: 'Every asset is backed by real-world UK legal title deeds. Blockchain-verified ownership, with off-chain documentation available on request.',
              },
              {
                icon: Users,
                title: 'Governance & Income',
                desc: 'Vote on asset decisions as a co-owner. Income distributions are automatic — receive rent and returns directly to your wallet based on your token share.',
              },
            ].map(f => (
              <div key={f.title} className="card" style={{ padding: '1.75rem', borderRadius: 12, display: 'flex', gap: 16 }}>
                <div style={{
                  flexShrink: 0, width: 46, height: 46, borderRadius: 10,
                  background: 'var(--brand-light)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <f.icon size={22} color="var(--brand)" />
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST STRIP ──────────────────────────────────────────────────────── */}
      <section style={{ padding: '3rem 0', background: 'var(--white)', borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <div className="grid-3" style={{ gap: '1rem' }}>
            {[
              { icon: Lock,       title: 'FHE Privacy — 5 Contracts', desc: 'KYC, valuations, fees, portfolios, and loans protected by Fully Homomorphic Encryption on Arbitrum Sepolia.' },
              { icon: Landmark,   title: 'UK Legal Title Deeds',       desc: 'Every listed UK asset is backed by off-chain legal ownership documentation and solicitor verification.' },
              { icon: Building2,  title: 'ERC-3643 Security Tokens',   desc: 'Industry-standard compliant security tokens with built-in KYC/AML compliance modules via T-REX.' },
            ].map(s => (
              <div key={s.title} className="card" style={{ padding: '1.5rem', borderRadius: 12, display: 'flex', gap: 14 }}>
                <div style={{ flexShrink: 0 }}><s.icon size={26} color="var(--brand)" /></div>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{s.title}</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────────────────────── */}
      <section style={{
        padding: '4.5rem 0', textAlign: 'center',
        background: 'linear-gradient(135deg, #0f0a2e, #1e1b4b, #1e4080)',
      }}>
        <div className="container" style={{ maxWidth: 640 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)',
            borderRadius: 100, padding: '5px 14px',
            fontSize: 11, fontWeight: 700, color: '#a78bfa', letterSpacing: '0.06em',
            textTransform: 'uppercase', marginBottom: 16,
          }}>
            <Lock size={10} /> FHE Buildathon Wave 1 · Live on Arbitrum Sepolia
          </span>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', marginBottom: '0.75rem' }}>
            Start Investing with Full Privacy
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 16, marginBottom: '2rem' }}>
            The world's first FHE-powered real asset platform — KYC, valuations, and portfolios
            stay encrypted. Your data never leaves the cipher.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/properties">
              <button className="btn btn-primary btn-lg" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                Browse UK Assets <ArrowRight size={17} />
              </button>
            </Link>
            <Link href="/kyc">
              <button className="btn btn-outline btn-lg" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.07)' }}>
                Verify Identity
              </button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
