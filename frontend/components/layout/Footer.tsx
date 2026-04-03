'use client';

import Link from 'next/link';
import { Building2, Linkedin, Twitter, Youtube, MessageCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{ background: '#0f1f3d', color: 'rgba(255,255,255,0.75)' }}>

      {/* Main footer body */}
      <div className="container" style={{ padding: '3rem 1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2.5rem' }}>

        {/* Brand + address */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ background: '#2563eb', borderRadius: 6, padding: '4px 6px', display: 'flex', alignItems: 'center' }}>
              <Building2 size={16} color="#fff" />
            </div>
            <span style={{ fontWeight: 800, fontSize: 17, color: '#fff' }}>AssetsGrator</span>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.7, marginBottom: '1rem', maxWidth: 240 }}>
            A regulated platform for tokenised real-world assets — KYC-gated, ERC-3643 compliant, and FHE-encrypted.
          </p>
          <address style={{ fontStyle: 'normal', fontSize: 13, lineHeight: 1.8 }}>
            20 Wenlock Road<br />
            London, N1 7GU<br />
            United Kingdom
          </address>
          <a href="mailto:help@assetsgrator.com" style={{ display: 'block', marginTop: 8, fontSize: 13, color: '#60a5fa' }}>
            help@assetsgrator.com
          </a>
        </div>

        {/* Platform links */}
        <div>
          <p style={{ fontWeight: 700, fontSize: 13, color: '#fff', marginBottom: 12 }}>Platform</p>
          {[
            ['Browse Assets', '/assets'],
            ['My Portfolio', '/dashboard'],
            ['Governance', '/governance'],
            ['Whitepaper', 'https://silk-parcel-39c.notion.site/AssetsGrator-2f1cb29cfeae80578d25eb78550a4f4b'],
            ['Verify Identity', '/kyc'],
          ].map(([label, href]) => (
            <div key={href} style={{ marginBottom: 8 }}>
              <Link
                href={href}
                style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
                {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >{label}</Link>
            </div>
          ))}
        </div>

        {/* Legal */}
        <div>
          <p style={{ fontWeight: 700, fontSize: 13, color: '#fff', marginBottom: 12 }}>Legal</p>
          {[
            ['Terms of Service', '/legal/terms'],
            ['Privacy Policy',   '/legal/privacy'],
            ['KYC Policy',       '/legal/kyc'],
            ['Risk Disclosure',  '/legal/risk-disclosure'],
          ].map(([label, href]) => (
            <div key={label} style={{ marginBottom: 8 }}>
              <Link href={href} style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>{label}</Link>
            </div>
          ))}
        </div>

        {/* Social */}
        <div>
          <p style={{ fontWeight: 700, fontSize: 13, color: '#fff', marginBottom: 12 }}>Follow Us</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { icon: Linkedin, label: 'LinkedIn', href: 'https://linkedin.com/company/assetsgrator' },
              { icon: Twitter, label: 'X (Twitter)', href: 'https://twitter.com/assetsgrator' },
              { icon: MessageCircle, label: 'Discord', href: 'https://discord.gg/assetsgrator' },
              { icon: Youtube, label: 'YouTube', href: 'https://youtube.com/@assetsgrator' },
            ].map(s => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'rgba(255,255,255,0.65)', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
              >
                <s.icon size={16} />
                {s.label}
              </a>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '1rem 1.25rem' }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
          © 2026 AssetsGrator Ltd. All transactions recorded on Polygon blockchain. Investments involve risk — capital at risk.
        </p>
      </div>
    </footer>
  );
}
