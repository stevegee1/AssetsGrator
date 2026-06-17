'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef } from 'react';
import { useAccount } from 'wagmi';
import WalletButton from '@/components/layout/WalletButton';
import TransakFundButton from '@/components/transak/TransakFundButton';
import { Building2, Menu, X, ChevronDown, Info, Users, Lightbulb, Mail, BookOpen } from 'lucide-react';
import { useIsAdmin } from '@/lib/hooks/useIsAdmin';

// ─── Nav definition ───────────────────────────────────────────────────────────
type NavChild = { href: string; label: string; icon: React.ReactNode; description: string; external?: boolean };
type NavItem  =
  | { href: string; label: string; external?: boolean; children?: never }
  | { href: '#';    label: string; children: NavChild[] };

const BASE_NAV: NavItem[] = [
  { href: '/assets',    label: 'Assets' },
  { href: '/hydro',     label: 'Hydrogen Marketplace' },
  { href: '/dashboard', label: 'My Portfolio' },
  { href: '/governance',label: 'Governance' },
  {
    href: '#',
    label: 'About',
    children: [
      {
        href: '/about',
        label: 'About AssetsGrator',
        icon: <Info size={15} />,
        description: 'Our mission, vision, and platform overview',
      },
      {
        href: '/about#team',
        label: 'Our Team',
        icon: <Users size={15} />,
        description: 'The people building the future of RWA',
      },
      {
        href: '/about#how-it-works',
        label: 'How It Works',
        icon: <Lightbulb size={15} />,
        description: 'From asset onboarding to token purchase',
      },
      {
        href: 'https://silk-parcel-39c.notion.site/AssetsGrator-2f1cb29cfeae80578d25eb78550a4f4b',
        label: 'Whitepaper',
        icon: <BookOpen size={15} />,
        description: 'Technical deep-dive for institutional investors',
        external: true,
      },
      {
        href: 'mailto:help@assetsgrator.com',
        label: 'Contact Us',
        icon: <Mail size={15} />,
        description: 'Get in touch with our team',
      },
    ],
  },
];

// ─── Dropdown component ───────────────────────────────────────────────────────
function DropdownMenu({ items }: { items: NavChild[] }) {
  return (
    <div style={{
      position: 'absolute',
      top: 'calc(100% + 4px)',
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#fff',
      border: '1px solid var(--border)',
      borderRadius: 12,
      boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
      minWidth: 260,
      padding: '8px',
      zIndex: 200,
      animation: 'dropFade 0.15s ease',
    }}>
      {items.map(c => (
        <Link
          key={c.href}
          href={c.href}
          {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            padding: '0.6rem 0.75rem',
            borderRadius: 8,
            color: 'var(--text-primary)',
            transition: 'background 0.12s',
            textDecoration: 'none',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}
        >
          <span style={{ color: 'var(--brand)', marginTop: 2, flexShrink: 0 }}>{c.icon}</span>
          <div>
            <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 1 }}>{c.label}</p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{c.description}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
export default function Header() {
  const path = usePathname();
  const { isAdmin } = useIsAdmin();
  const { address } = useAccount();
  const [menuOpen, setMenuOpen]     = useState(false);
  const [dropOpen, setDropOpen]     = useState<string | null>(null);
  const [mobileAbout, setMobileAbout] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const nav: NavItem[] = isAdmin
    ? [...BASE_NAV, { href: '/admin', label: 'Admin' }]
    : BASE_NAV;

  const isActive = (href: string) =>
    href !== '#' && href !== '/' && path.startsWith(href);

  // Delay-close dropdown so mouse can move into it
  const openDrop  = (label: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setDropOpen(label);
  };
  const closeDrop = () => {
    closeTimer.current = setTimeout(() => setDropOpen(null), 120);
  };

  return (
    <>
      <style>{`
        @keyframes dropFade {
          from { opacity: 0; transform: translateX(-50%) translateY(-6px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .nav-link {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 0.35rem 0.8rem; border-radius: 6px;
          font-size: 14px; font-weight: 500;
          color: var(--text-primary); text-decoration: none;
          transition: color 0.15s, background 0.15s;
          white-space: nowrap;
        }
        .nav-link:hover, .nav-link.active {
          color: var(--brand);
          background: var(--brand-light);
        }
        .nav-drop-trigger {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 0.35rem 0.8rem; border-radius: 6px;
          font-size: 14px; font-weight: 500;
          color: var(--text-primary);
          background: none; border: none; cursor: pointer;
          transition: color 0.15s, background 0.15s;
          white-space: nowrap; height: 100%;
        }
        .nav-drop-trigger:hover, .nav-drop-trigger.active {
          color: var(--brand);
          background: var(--brand-light);
        }
        .nav-drop-trigger .chevron {
          transition: transform 0.2s;
        }
        .nav-drop-trigger.open .chevron {
          transform: rotate(180deg);
        }
      `}</style>

      <header style={{ background: '#fff', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 1000 }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>

          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{ background: 'var(--brand)', borderRadius: 6, padding: '4px 6px', display: 'flex', alignItems: 'center' }}>
              <Building2 size={18} color="#fff" />
            </div>
            <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--brand)' }}>AssetsGrator</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="desktop-only" style={{ alignItems: 'center', gap: 2, height: '100%' }}>
            {nav.map(n => {
              if (n.children) {
                const isOpen = dropOpen === n.label;
                return (
                  <div
                    key={n.label}
                    style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}
                    onMouseEnter={() => openDrop(n.label)}
                    onMouseLeave={closeDrop}
                  >
                    <button className={`nav-drop-trigger ${isOpen ? 'open active' : ''}`}>
                      {n.label}
                      <ChevronDown size={13} className="chevron" />
                    </button>
                    {isOpen && <DropdownMenu items={n.children} />}
                  </div>
                );
              }

              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`nav-link ${!n.external && isActive(n.href) ? 'active' : ''}`}
                  {...(n.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop: Wallet + Fund */}
          <div className="desktop-only" style={{ alignItems: 'center', gap: 8 }}>
            {address && (
              <TransakFundButton
                fiatCurrency="GBP"
                defaultFiatAmount={50}
                className="btn btn-outline"
                style={{ fontSize: 13, padding: '6px 14px' }}
              >
                Fund Wallet
              </TransakFundButton>
            )}
            <WalletButton />
          </div>

          {/* Mobile: Wallet + Hamburger */}
          <div className="mobile-only" style={{ alignItems: 'center', gap: 10 }}>
            <WalletButton />
            <button
              onClick={() => setMenuOpen(o => !o)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', color: 'var(--text-primary)' }}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* ── Mobile dropdown ── */}
        {menuOpen && (
          <div style={{ background: '#fff', borderTop: '1px solid var(--border)', padding: '0.5rem 0', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
            {nav.map(n => {
              if (n.children) {
                return (
                  <div key={n.label}>
                    <button
                      onClick={() => setMobileAbout(o => !o)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        width: '100%', padding: '0.75rem 1.25rem',
                        fontSize: 15, fontWeight: 500,
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-primary)', borderLeft: '3px solid transparent',
                      }}
                    >
                      {n.label}
                      <ChevronDown size={15} style={{ transform: mobileAbout ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', opacity: 0.5 }} />
                    </button>
                    {mobileAbout && n.children.map(c => (
                      <Link
                        key={c.href}
                        href={c.href}
                        onClick={() => setMenuOpen(false)}
                        {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '0.6rem 1.25rem 0.6rem 2rem',
                          fontSize: 14, fontWeight: 500,
                          color: 'var(--text-secondary)',
                          borderLeft: '3px solid transparent',
                        }}
                      >
                        <span style={{ color: 'var(--brand)' }}>{c.icon}</span>
                        {c.label}
                      </Link>
                    ))}
                  </div>
                );
              }

              return (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setMenuOpen(false)}
                  {...(n.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  style={{
                    display: 'block', padding: '0.75rem 1.25rem',
                    fontSize: 15, fontWeight: !n.external && isActive(n.href) ? 700 : 500,
                    color: !n.external && isActive(n.href) ? 'var(--brand)' : 'var(--text-primary)',
                    borderLeft: !n.external && isActive(n.href) ? '3px solid var(--brand)' : '3px solid transparent',
                  }}
                >
                  {n.label}
                </Link>
              );
            })}

            {address && (
              <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border)', marginTop: 4 }}>
                <TransakFundButton fiatCurrency="GBP" defaultFiatAmount={50} className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
                  Fund Wallet
                </TransakFundButton>
              </div>
            )}
          </div>
        )}
      </header>
    </>
  );
}
