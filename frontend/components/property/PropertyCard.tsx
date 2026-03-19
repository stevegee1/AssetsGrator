import Link from 'next/link';
import Image from 'next/image';
import { MapPin, TrendingUp, Users } from 'lucide-react';
import { Property, fmtUsd, fundingPct } from '@/lib/mock-data';

export default function PropertyCard({ p }: { p: Property }) {
  const pct = fundingPct(p);

  const statusBadge = {
    active:       { cls: 'badge-green', label: 'Open' },
    sold_out:     { cls: 'badge-red',   label: 'Sold Out' },
    coming_soon:  { cls: 'badge-yellow',label: 'Coming Soon' },
  }[p.status];

  const typeLbl = { apartment: 'Apartment', office: 'Office', villa: 'Villa', commercial: 'Commercial', land: 'Raw Land' }[p.type];

  return (
    <Link href={`/properties/${p.id}`}>
      <div className="card" style={{ cursor: 'pointer', transition: 'box-shadow 0.15s', borderRadius: 10 }}
           onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)')}
           onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
        {/* Image */}
        <div style={{ position: 'relative', height: 190, overflow: 'hidden' }}>
          <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6 }}>
            <span className={`badge ${statusBadge.cls}`}>{statusBadge.label}</span>
            <span className="badge badge-blue">{typeLbl}</span>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '1rem' }}>
          <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, lineHeight: '1.3' }}>{p.name}</p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
            <MapPin size={13} /> {p.city}, {p.country}
          </p>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>Value</p>
              <p style={{ fontSize: 14, fontWeight: 700 }}>{fmtUsd(p.totalValue)}</p>
            </div>
            <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>Token</p>
              <p style={{ fontSize: 14, fontWeight: 700 }}>${p.tokenPrice}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>Yield</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--green)' }}>{p.annualYield}%</p>
            </div>
          </div>

          {/* Funding bar */}
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Users size={12} /> {pct}% funded
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {fmtUsd(p.tokensSold * p.tokenPrice)} raised
              </span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
