'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAccount } from 'wagmi';
import WalletButton from '@/components/layout/WalletButton';
import TransakFundButton from '@/components/transak/TransakFundButton';
import { Building2, Menu, X } from 'lucide-react';
import { useIsAdmin } from '@/lib/hooks/useIsAdmin';

const BASE_NAV = [
  { href: '/properties', label: 'Properties' },
  { href: '/dashboard',  label: 'My Portfolio' },
  { href: '/governance', label: 'Governance' },
  { href: '/whitepaper', label: 'Whitepaper' },
];

export default function Header() {
  const path = usePathname();
  const { isAdmin } = useIsAdmin();
  const { address } = useAccount();
  const [menuOpen, setMenuOpen] = useState(false);

  const nav = isAdmin
    ? [...BASE_NAV, { href: '/admin', label: 'Admin' }]
    : BASE_NAV;

  return (
    <header style={{ background: '#fff', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 50 }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>

        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ background: 'var(--brand)', borderRadius: 6, padding: '4px 6px', display: 'flex', alignItems: 'center' }}>
            <Building2 size={18} color="#fff" />
          </div>
          <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--brand)' }}>AssetsGrator</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="desktop-only" style={{ alignItems: 'center', gap: 4 }}>
          {nav.map(n => (
            <Link key={n.href} href={n.href} className={`nav-link ${path.startsWith(n.href) ? 'active' : ''}`}>
              {n.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Wallet + Fund */}
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

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <div style={{
          background: '#fff',
          borderTop: '1px solid var(--border)',
          padding: '0.5rem 0',
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        }}>
          {nav.map(n => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setMenuOpen(false)}
              style={{
                display: 'block',
                padding: '0.75rem 1.25rem',
                fontSize: 15,
                fontWeight: path.startsWith(n.href) ? 700 : 500,
                color: path.startsWith(n.href) ? 'var(--brand)' : 'var(--text-primary)',
                borderLeft: path.startsWith(n.href) ? '3px solid var(--brand)' : '3px solid transparent',
                transition: 'background 0.1s',
              }}
            >
              {n.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
