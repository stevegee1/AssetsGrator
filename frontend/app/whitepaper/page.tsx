import Link from 'next/link';
import { FileText, ArrowRight } from 'lucide-react';

export default function WhitepaperPage() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 1.25rem' }}>
      <div style={{ textAlign: 'center', maxWidth: 520 }}>
        <div style={{
          width: 72, height: 72, borderRadius: 16, background: 'var(--brand-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem',
        }}>
          <FileText size={36} color="var(--brand)" />
        </div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.75rem' }}>Whitepaper</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 16, lineHeight: 1.7, marginBottom: '2rem' }}>
          Our full whitepaper — covering the AssetsGrator model, legal structure, token mechanics,
          governance framework, and roadmap — is coming soon.
        </p>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: '2rem' }}>
          In the meantime, reach us at{' '}
          <a href="mailto:help@assetsgrator.com" style={{ color: 'var(--brand)' }}>help@assetsgrator.com</a>
          {' '}for an early-access copy.
        </p>
        <Link href="/assets">
          <button className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Browse Assets <ArrowRight size={16} />
          </button>
        </Link>
      </div>
    </div>
  );
}
