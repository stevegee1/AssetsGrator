'use client';

import Link from 'next/link';
import {
  ArrowRight, Coins, ShieldCheck, Building2, FileText,
  Users, Landmark, ArrowRightCircle, Lock,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div>

      {/* ── HERO — Securitize-style: full-height, content pinned to bottom ── */}
      <section className="hero-section">
        <img
          src="/hero-properties.png"
          alt="London real estate"
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center 30%',
          }}
        />
        {/* Darker overlay — image is a bright daytime shot */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(5,10,25,0.62) 0%, rgba(5,10,25,0.75) 50%, rgba(5,10,25,0.96) 100%)',
        }} />

        {/* Content — absolutely pinned to bottom, immune to Tailwind resets */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 2,
          paddingBottom: '3.5rem',
        }}>
          <div className="container">
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: '2rem',
              flexWrap: 'wrap',
            }}>

              {/* Left: stacked stats */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flexShrink: 0 }}>
                {[
                  { num: '10+',      sub: 'Assets\nTokenised' },
                  { num: 'ERC-3643', sub: 'Compliant\nToken' },
                  { num: 'FCA',      sub: 'Sandbox\nReady' }
                ].map((s, i) => (
                  <div key={s.num} style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                    <span style={{ fontSize: 'clamp(1.9rem, 3.5vw, 3.2rem)', fontWeight: 900, color: '#ffffff', lineHeight: 1, letterSpacing: '-0.02em' }}>
                      {s.num}
                    </span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.62)', lineHeight: 1.45, whiteSpace: 'pre-line', maxWidth: 96 }}>
                      {s.sub}
                    </span>
                  </div>
                ))}
              </div>

              {/* Right: large headline + CTA */}
              <div style={{ flex: 1, minWidth: 260, textAlign: 'right' }}>
                <h1 style={{
                  fontSize: 'clamp(2.4rem, 6.5vw, 5.5rem)',
                  fontWeight: 900, color: '#ffffff',
                  lineHeight: 1.04, letterSpacing: '-0.03em',
                  margin: '0 0 1.5rem 0',
                }}>
                  Invest in Real<br />Assets, Today.
                </h1>
                <Link href="/assets" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  color: '#ffffff', fontSize: 15, fontWeight: 600,
                  paddingBottom: 2, borderBottom: '1px solid rgba(255,255,255,0.45)',
                  textDecoration: 'none', transition: 'gap 0.15s, border-color 0.15s',
                }}>
                  Explore Assets <ArrowRight size={16} />
                </Link>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ── SECURE & COMPLIANT STACK ─────────────────────────────────────── */}
      <section className="section-pad-lg" style={{ background: 'linear-gradient(180deg, #0f0a2e 0%, #111827 100%)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 className="section-heading" style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 900, color: '#fff', marginBottom: 12 }}>
              Built for Institutional-Grade Security & Compliance
            </h2>
            <p className="section-subhead" style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15, maxWidth: 520, margin: '0 auto' }}>
              Our platform uses the ERC-3643 standard to guarantee on-chain identity compliance, investor white-listing, and secure asset transfer.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {[
              {
                icon: ShieldCheck,
                color: '#6366f1',
                standard: 'ERC-3643',
                title: 'On-Chain Identity Registry',
                desc: 'Every investor wallet is verified through T-REX Identity Registries. Compliant transfers are validated at the smart contract level.'
              },
              {
                icon: Coins,
                color: '#059669',
                standard: 'FeeManager',
                title: 'Transparent Capped Fees',
                desc: 'Platform fees are publicly capped and managed by standard smart contracts. Clean, open basis-points logic ensures complete transparency.'
              },
              {
                icon: Users,
                color: '#7c3aed',
                standard: 'AssetToken',
                title: 'Fractionalized Real Assets',
                desc: 'Direct tokenized ownership of real estate and renewable energy, providing fractional exposure to high-yield legal instruments.'
              }
            ].map(f => (
              <div
                key={f.title}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  borderRadius: 14, padding: '1.5rem',
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
                  background: `${f.color}22`, marginBottom: 12,
                }}>
                  <f.icon size={22} color={f.color} />
                </div>
                <div style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                  color: f.color, marginBottom: 6, fontFamily: 'monospace',
                }}>
                  {f.standard}
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section className="section-pad" style={{ background: 'var(--bg)' }}>
        <div className="container">
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--brand)', marginBottom: 8 }}>How Access Works</p>
          <h2 className="section-heading" style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>Four Steps to Approved Access</h2>
          <p className="section-subhead" style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: '2.5rem' }}>Platform access is gated — verified investors only.</p>
          <div className="grid-4">
            {[
              { n: '01', title: 'Verify Identity', desc: 'Complete KYC once — your status is verified on-chain via the ERC-3643 standard, keeping your identity protected. Review takes under 48 hours.' },
              { n: '02', title: 'Get Approved', desc: 'Applications are reviewed against UK investor classification and AML requirements. Approved wallets are whitelisted on-chain.' },
              { n: '03', title: 'Access Deals', desc: 'Once approved, browse ERC-3643 tokenised assets. Each token represents a verified on-chain share of the underlying asset.' },
              { n: '04', title: 'Govern & Receive', desc: 'Participate in governance votes as a co-owner. Revenue distributions flow on-chain proportional to verified token holdings.' },
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

      {/* ── REVENUE FLOW ──────────────────────────────────────────────────── */}
      <section className="section-pad" style={{ background: 'var(--white)', borderTop: '1px solid var(--border)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--brand)', marginBottom: 8 }}>How Revenue Works</p>
          <h2 className="section-heading" style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>Asset Revenue Distribution</h2>
          <p className="section-subhead" style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: '2.5rem' }}>
            Revenue from underlying assets flows on-chain to verified token holders — platform fees capped at 3%, managed transparently by the FeeManager.
          </p>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', margin: '0 -1.25rem', padding: '0.5rem 1.25rem 1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, minWidth: 640 }}>
              {[
                { emoji: '🏠', label: 'Asset',         sub: 'Property / Land' },
                null,
                { emoji: '💷', label: 'Revenue',       sub: 'Rent / Returns' },
                null,
                { emoji: '⚙️', label: 'Platform Fees',  sub: 'Transparent BPS' },
                null,
                { emoji: '💷', label: 'GBPT',          sub: 'Sterling Ledger' },
                null,
                { emoji: '🪙', label: 'Your Token',    sub: 'Auto-distributed' },
                null,
                { emoji: '🏦', label: 'Your Wallet',   sub: 'On-chain' },
              ].map((item, i) => {
                if (item === null) return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '0 4px', flexShrink: 0 }}>
                    <ArrowRightCircle size={20} color="var(--brand)" />
                  </div>
                );
                return (
                  <div key={i} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0,
                    background: 'var(--bg)', border: '1px solid var(--border)',
                    borderRadius: 12, padding: '1rem 0.85rem', minWidth: 90,
                  }}>
                    <span style={{ fontSize: '1.6rem', marginBottom: 5 }}>{item.emoji}</span>
                    <span style={{ fontWeight: 700, fontSize: 12 }}>{item.label}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>{item.sub}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURE CARDS ─────────────────────────────────────────────────── */}
      <section className="section-pad" style={{ background: 'var(--bg)' }}>
        <div className="container">
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--brand)', marginBottom: 8 }}>Our Advantage</p>
          <h2 className="section-heading" style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>Built for Real Investors</h2>
          <p className="section-subhead" style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: '2.5rem' }}>Privacy-first infrastructure meets real-world asset ownership.</p>
          <div className="grid-2" style={{ gap: '1.25rem' }}>
            {[
              {
                icon: Coins,
                title: 'Fractional Ownership — ERC-3643',
                desc: 'Each asset is tokenised into ERC-3643 compliant security tokens. Approved investors hold a verified on-chain share of the underlying asset.',
              },
              {
                icon: Lock,
                title: 'On-Chain Identity Registry',
                desc: 'T-REX compliance modules guard asset ownership, ensuring token transfers only execute between whitelisted and fully KYC-verified wallets.',
              },
              {
                icon: FileText,
                title: 'Legally Documented, Off-Chain',
                desc: 'Every asset is backed by verified off-chain legal instruments — title deeds for real estate, generation licences for energy projects, and VCS/RECS certification for carbon and renewable credits.',
              },
              {
                icon: Users,
                title: 'Governance & Distributions',
                desc: 'Approved token holders vote on asset decisions as co-owners. Revenue distributions flow automatically, proportional to verified on-chain holdings.',
              },
            ].map(f => (
              <div key={f.title} className="card feature-card" style={{ padding: '1.5rem', borderRadius: 12, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{
                  flexShrink: 0, width: 44, height: 44, borderRadius: 10,
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

      {/* ── TRUST STRIP ───────────────────────────────────────────────────── */}
      <section className="section-pad-sm" style={{ background: 'var(--white)', borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <div className="grid-3" style={{ gap: '1rem' }}>
            {[
              { icon: Lock,      title: 'Decentralized Compliance', desc: 'Token transfers, fee management, and asset listings are governed entirely on-chain for complete trust.' },
              { icon: Landmark,  title: 'Legally Documented Assets',  desc: 'Each listed asset is backed by verified off-chain legal instruments — title deeds, generation licences, or VCS/RECS certification.' },
              { icon: Building2, title: 'ERC-3643 Security Tokens',   desc: 'Industry-standard compliant security tokens with built-in KYC/AML compliance modules via T-REX.' },
            ].map(s => (
              <div key={s.title} className="card feature-card" style={{ padding: '1.5rem', borderRadius: 12, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
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

      {/* ── PARTNERS MARQUEE ───────────────────────────────────────────────── */}
      <section style={{ background: '#f8f9fb', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb', padding: '4rem 0', overflow: 'hidden' }}>
        <style>{`
          @keyframes ag-marquee {
            0%   { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .ag-marquee-track {
            display: flex;
            align-items: center;
            gap: 20px;
            width: max-content;
            flex-wrap: nowrap;
            animation: ag-marquee 32s linear infinite;
            padding: 0.5rem 0;
          }
          .ag-marquee-track:hover { animation-play-state: paused; }
          .ag-partner-chip {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 1rem 1.5rem;
            border-radius: 14px;
            border: 1px solid #e5e7eb;
            background: #ffffff;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
            white-space: nowrap;
            flex-shrink: 0;
            transition: transform 0.18s ease, box-shadow 0.18s ease;
            cursor: default;
          }
          .ag-partner-chip:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 28px rgba(0,0,0,0.09);
            border-color: #c7d2fe;
          }
        `}</style>

        {/* Section header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--brand)', marginBottom: 10 }}>
            Built With &amp; Regulated By
          </p>
          <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, color: '#111827', marginBottom: 10 }}>
            Our Technology Partners &amp; Standards
          </h2>
          <p style={{ fontSize: 14, color: '#6b7280', maxWidth: 500, margin: '0 auto' }}>
            AssetsGrator is built on industry-leading protocols for privacy, compliance, and security.
          </p>
        </div>

        <div style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 120, zIndex: 2, background: 'linear-gradient(to right, #f8f9fb, transparent)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 120, zIndex: 2, background: 'linear-gradient(to left, #f8f9fb, transparent)', pointerEvents: 'none' }} />

          <div className="ag-marquee-track">
            {([
              { name: 'Tokeny',       tag: 'ERC-3643 / T-REX',       logo: '/partners/tokeny.png'       },
              { name: 'Sumsub',       tag: 'KYC / AML',              logo: '/partners/sumsub.png'       },
              { name: 'Arbitrum',     tag: 'L2 Network',             logo: '/partners/arbitrum.png'     },
              { name: 'OpenZeppelin', tag: 'Smart Contract Security', logo: '/partners/openzeppelin.png' },
              { name: 'FCA Sandbox',  tag: 'Regulatory Sandbox',     logo: '/partners/fca.png'          },
              { name: 'Tokeny',       tag: 'ERC-3643 / T-REX',       logo: '/partners/tokeny.png'       },
              { name: 'Sumsub',       tag: 'KYC / AML',              logo: '/partners/sumsub.png'       },
              { name: 'Arbitrum',     tag: 'L2 Network',             logo: '/partners/arbitrum.png'     },
              { name: 'OpenZeppelin', tag: 'Smart Contract Security', logo: '/partners/openzeppelin.png' },
              { name: 'FCA Sandbox',  tag: 'Regulatory Sandbox',     logo: '/partners/fca.png'          },
            ] as const).map((p, i) => (
              <div key={i} className="ag-partner-chip">
                <img
                  src={p.logo}
                  alt={p.name}
                  style={{ height: 36, width: 'auto', maxWidth: 110, objectFit: 'contain', display: 'block' }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', lineHeight: 1.3 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{p.tag}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      <section className="section-pad" style={{
        textAlign: 'center',
        background: 'linear-gradient(135deg, #0f0a2e, #1e1b4b, #1e4080)',
      }}>
        <div className="container" style={{ maxWidth: 600 }}>
          <h2 className="cta-banner-title" style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', marginBottom: '0.75rem' }}>
            Apply as an Approved Investor
          </h2>
          <p className="cta-banner-sub" style={{ color: 'rgba(255,255,255,0.65)', fontSize: 16, marginBottom: '0.75rem' }}>
            AssetsGrator is a regulated platform for verified investors. Complete identity verification
            to request access — deals, allocations, and asset data are only visible to approved participants.
          </p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: '2rem' }}>
            Access is subject to KYC / AML review and investor classification under UK financial regulation.
          </p>
          <div className="hero-ctas">
            <Link href="/kyc" style={{ display: 'contents' }}>
              <button className="btn btn-primary btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                Apply for Access <ArrowRight size={17} />
              </button>
            </Link>
            <a
              href="https://silk-parcel-39c.notion.site/AssetsGrator-2f1cb29cfeae80578d25eb78550a4f4b"
              target="_blank" rel="noopener noreferrer"
              style={{ display: 'contents' }}
            >
              <button className="btn btn-outline btn-lg" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.07)' }}>
                Read Whitepaper
              </button>
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
