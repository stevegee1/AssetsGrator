'use client';

import Link from 'next/link';
import {
  ArrowRight, Coins, ShieldCheck, Building2, FileText,
  CalendarDays, Users, Landmark, ArrowRightCircle,
} from 'lucide-react';

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
        {/* Background image */}
        <img
          src="/hero-properties.png"
          alt="London Georgian townhouses"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%' }}
        />
        {/* Dark overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.65) 60%, rgba(0,0,0,0.85) 100%)' }} />

        {/* Content */}
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
            lineHeight: 1.6, marginBottom: '1.25rem', maxWidth: 600, margin: '0 auto 1.25rem',
          }}>
            Fractional ownership of assets — blockchain-verified on-chain and backed by
            off-chain legal title deeds. Buy from £5, receive income, and vote on asset decisions.
          </p>

          {/* Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: '2rem' }}>
            {['✓ Own from £5', '✓ Earn income', '✓ Legally backed', '✓ Vote on how your assets are used and managed'].map(chip => (
              <span key={chip} style={{
                background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(6px)',
                border: '1px solid rgba(255,255,255,0.2)', borderRadius: 100,
                padding: '6px 14px', fontSize: 13, color: '#fff', fontWeight: 500, whiteSpace: 'nowrap',
              }}>{chip}</span>
            ))}
          </div>

          {/* Stats */}
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
            <Link href="/whitepaper">
              <button style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.3)', borderRadius: 100,
                padding: '10px 24px', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}>
                Read Whitepaper
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS (4 steps) ──────────────────────────────────────────── */}
      <section style={{ padding: '4rem 0', background: 'var(--bg)' }}>
        <div className="container">
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--brand)', marginBottom: 8 }}>Simple Process</p>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>Start in Four Steps</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: '2.5rem' }}>From sign-up to earning income in minutes.</p>
          <div className="grid-4">
            {[
              { n: '01', title: 'Verify Identity', desc: 'Complete KYC once. Takes under 5 minutes — no paperwork, no branch visits.' },
              { n: '02', title: 'Browse Assets', desc: 'Explore properties, land, and energy assets. Review financials and legal documents.' },
              { n: '03', title: 'Buy Tokens', desc: 'Purchase ownership tokens from £5. Each token is your share of the asset.' },
              { n: '04', title: 'Earn & Vote', desc: 'Receive income automatically. Vote on major asset decisions as a co-owner.' },
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

      {/* ── REVENUE FLOW DIAGRAM ─────────────────────────────────────────────── */}
      <section style={{ padding: '4rem 0', background: 'var(--white)', borderTop: '1px solid var(--border)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--brand)', marginBottom: 8 }}>How Income Works</p>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>Asset Revenue, Paid to You</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: '3rem' }}>
            Rental and asset revenue flows automatically — no chasing, no paperwork.
          </p>

          {/* Flow row */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexWrap: 'wrap', gap: 0,
          }}>
            {[
              { emoji: '🏠', label: 'Asset', sub: 'Property / Energy' },
              null,
              { emoji: '💷', label: 'Revenue', sub: 'Rent / Returns' },
              null,
              { emoji: '🤝', label: 'Management', sub: 'Asset Manager' },
              null,
              { emoji: '💵', label: 'USDC', sub: 'Stable Payment' },
              null,
              { emoji: '🪙', label: 'Your Token', sub: 'Auto-distributed' },
              null,
              { emoji: '🏦', label: 'Your Wallet', sub: 'Withdraw anytime' },
            ].map((item, i) => {
              if (item === null) {
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '0 4px' }}>
                    <ArrowRightCircle size={22} color="var(--brand)" />
                  </div>
                );
              }
              return (
                <div key={i} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  borderRadius: 14, padding: '1.25rem 1rem', minWidth: 100,
                  transition: 'box-shadow 0.2s',
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

      {/* ── 4 FEATURE CARDS ─────────────────────────────────────────────────── */}
      <section style={{ padding: '4rem 0', background: 'var(--bg)' }}>
        <div className="container">
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--brand)', marginBottom: 8 }}>Our Advantage</p>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>Built for Real Investors</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: '2.5rem' }}>Everything you need to invest in real assets with confidence.</p>

          <div className="grid-2" style={{ gap: '1.25rem' }}>
            {[
              {
                icon: Coins,
                title: 'Unique Tokens — True Fractional Ownership',
                desc: 'Ownership of each asset is distributed across a finite number of representative tokens. Based on your token share, you collect revenue and vote on key asset decisions.',
              },
              {
                icon: Users,
                title: 'Professionally Managed',
                desc: 'Each asset has a dedicated management company handling tenants, rent collection, and maintenance on behalf of all token holders — so you never have to.',
              },
              {
                icon: FileText,
                title: 'Legal Deeds, Verified Off-Chain',
                desc: 'We hold legal title deeds for every asset on the platform. Ownership is blockchain-verified and backed by real-world legal documentation you can request anytime.',
              },
              {
                icon: CalendarDays,
                title: 'Flexible Income Payments',
                desc: 'Depending on the asset type, income can be distributed weekly, monthly, or yearly. Choose from a diverse range of assets that match your preferred cadence.',
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

      {/* ── TRUST STRIP ─────────────────────────────────────────────────────── */}
      <section style={{ padding: '3rem 0', background: 'var(--white)', borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <div className="grid-3" style={{ gap: '1rem' }}>
            {[
              { icon: ShieldCheck, title: 'KYC / AML Compliant', desc: 'All investors verified. Only compliant wallets can hold and trade asset tokens.' },
              { icon: Landmark, title: 'Legal Title Deeds', desc: 'Every listed asset is backed by off-chain legal ownership documentation.' },
              { icon: Building2, title: 'ERC-3643 Standard', desc: 'Industry-standard compliant security token built on the Polygon blockchain.' },
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

      {/* ── CTA BANNER ──────────────────────────────────────────────────────── */}
      <section style={{
        padding: '4rem 0', textAlign: 'center',
        background: 'linear-gradient(135deg, #0f1f3d, #1e4080)',
      }}>
        <div className="container" style={{ maxWidth: 600 }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', marginBottom: '0.75rem' }}>
            Ready to Start Earning?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, marginBottom: '2rem' }}>
            Join investors from across the world building income-generating asset portfolios from £5.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/properties">
              <button className="btn btn-primary btn-lg" style={{ background: '#2563eb', border: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                Browse All Assets <ArrowRight size={17} />
              </button>
            </Link>
            <Link href="/kyc">
              <button className="btn btn-outline btn-lg" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.08)' }}>
                Verify Identity
              </button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
