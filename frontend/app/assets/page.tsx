'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { Search, SlidersHorizontal, ArrowRight, Lock, ShieldCheck, MapPin, Loader } from 'lucide-react';

// ─── Types (mirror of /api/assets shape) ─────────────────────────────────────
interface AssetItem {
  address: string;
  name: string;
  location: string;
  category: number;
  mainCategory: 'real-estate' | 'renewable-energy' | 'other';
  subType: string;
  valuationUSD: string;
  pricePerUnit: string;
  totalSupply: string;
  ipfsCID: string;
  status: number;
  imageUrl: string;
  createdAt: number;
}

// ─── Taxonomy ─────────────────────────────────────────────────────────────────
const MAIN_CATS = [
  { key: 'real-estate'      as const, icon: '🏢', label: 'Real Estate' },
  { key: 'renewable-energy' as const, icon: '⚡', label: 'Renewable Energy' },
] as const;

const SUB_CATS = {
  'real-estate':      ['Residential', 'Commercial', 'Industrial', 'Land', 'Mixed-Use'],
  'renewable-energy': ['Solar', 'Wind', 'Green Hydrogen', 'Hydroelectricity', 'Biomethane', 'Geothermal', 'CAES', 'REC', 'Carbon Credits'],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtUSD(raw: string): string {
  const n = Number(BigInt(raw || '0')) / 1e18;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

const STATUS_LABEL = ['Coming Soon', 'Active', 'Paused', 'Closed'] as const;
const STATUS_CLS   = ['badge-yellow', 'badge-green', 'badge-yellow', 'badge-red'] as const;

// ─── Compliance gate (not connected) ─────────────────────────────────────────
function ComplianceGate() {
  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 1.25rem' }}>
      <div style={{ textAlign: 'center', maxWidth: 500 }}>
        <div style={{ width: 80, height: 80, borderRadius: 20, background: 'linear-gradient(135deg,#1e1b4b,#1e4080)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.75rem', boxShadow: '0 8px 32px rgba(37,99,235,0.25)' }}>
          <Lock size={36} color="#fff" />
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 100, padding: '4px 14px', fontSize: 11, fontWeight: 700, color: 'var(--brand)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '1.25rem' }}>
          <ShieldCheck size={11} /> Approved Investors Only
        </span>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem' }}>Restricted Access</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.7, marginBottom: '2rem' }}>
          This platform operates under the UK Financial Services and Markets Act 2000.
          Investment opportunities are only accessible to verified, approved investors.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/kyc"><button className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>Apply for Access <ArrowRight size={16} /></button></Link>
          <a href="https://silk-parcel-39c.notion.site/AssetsGrator-2f1cb29cfeae80578d25eb78550a4f4b" target="_blank" rel="noopener noreferrer">
            <button className="btn btn-outline">Read Whitepaper</button>
          </a>
        </div>
        <p style={{ marginTop: '2rem', fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          AssetsGrator Ltd · UK-incorporated · Assets constitute securities under FSMA 2000
        </p>
      </div>
    </div>
  );
}

// ─── Asset card (no per-card RPC — uses pre-fetched API data) ─────────────────
function AssetCard({ a }: { a: AssetItem }) {
  return (
    <Link href={`/assets/${a.address}`} style={{ textDecoration: 'none' }}>
      <div
        className="card"
        style={{ borderRadius: 12, overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow 0.15s, transform 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
      >
        {/* Image */}
        <div style={{ position: 'relative', height: 175, overflow: 'hidden', background: 'var(--bg)' }}>
          <img src={a.imageUrl} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${a.address.slice(2,8)}/400/220`; }} />
          <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6 }}>
            <span className={`badge ${STATUS_CLS[a.status] ?? 'badge-yellow'}`}>{STATUS_LABEL[a.status] ?? 'Unknown'}</span>
            <span className="badge badge-blue">{a.subType}</span>
          </div>
          <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', borderRadius: 100, padding: '4px 10px', fontSize: 12, fontWeight: 700, color: '#fff' }}>
            From {fmtUSD(a.pricePerUnit)}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '1rem' }}>
          <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, lineHeight: 1.3 }}>{a.name}</p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
            <MapPin size={12} /> {a.location}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
            {[
              { l: 'Valuation',   v: fmtUSD(a.valuationUSD) },
              { l: 'Token Price', v: fmtUSD(a.pricePerUnit) },
              { l: 'Status',      v: STATUS_LABEL[a.status] ?? '—' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center', borderLeft: i > 0 ? '1px solid var(--border)' : undefined }}>
                <p style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>{s.l}</p>
                <p style={{ fontSize: 13, fontWeight: 700 }}>{s.v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  const pulse = { background: 'linear-gradient(90deg, var(--border) 25%, var(--bg) 50%, var(--border) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: 6 };
  return (
    <div className="card" style={{ borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ height: 175, ...pulse }} />
      <div style={{ padding: '1rem' }}>
        <div style={{ height: 16, width: '70%', marginBottom: 8, ...pulse }} />
        <div style={{ height: 12, width: '50%', marginBottom: 16, ...pulse }} />
        <div style={{ height: 32, ...pulse }} />
      </div>
    </div>
  );
}

// ─── Main listings view ───────────────────────────────────────────────────────
function ListingsView() {
  const [assets, setAssets]     = useState<AssetItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [mainCat, setMainCat]   = useState<'real-estate' | 'renewable-energy'>('real-estate');
  const [subCat, setSubCat]     = useState<string | null>(null);
  const [search, setSearch]     = useState('');
  const [sort, setSort]         = useState<'newest' | 'val-desc' | 'val-asc' | 'price-asc'>('newest');

  // Fetch once — API is server-cached (30s ISR), so this is fast
  useEffect(() => {
    fetch('/api/assets')
      .then(r => r.json())
      .then(data => { setAssets(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setError('Failed to load assets. Please refresh.'); setLoading(false); });
  }, []);

  // Reset subCat when main category changes
  const handleMainCat = (cat: typeof mainCat) => {
    setMainCat(cat);
    setSubCat(null);
  };

  // Derived counts
  const counts = useMemo(() => ({
    'real-estate':      assets.filter(a => a.mainCategory === 'real-estate').length,
    'renewable-energy': assets.filter(a => a.mainCategory === 'renewable-energy').length,
  }), [assets]);

  // Filtered + sorted list
  const filtered = useMemo(() => {
    let list = assets.filter(a => a.mainCategory === mainCat);
    if (subCat)  list = list.filter(a => a.subType === subCat);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q) ||
        a.subType.toLowerCase().includes(q)
      );
    }
    if (sort === 'newest')    list = [...list].sort((a, b) => b.createdAt - a.createdAt);
    if (sort === 'val-desc')  list = [...list].sort((a, b) => Number(BigInt(b.valuationUSD) - BigInt(a.valuationUSD)));
    if (sort === 'val-asc')   list = [...list].sort((a, b) => Number(BigInt(a.valuationUSD) - BigInt(b.valuationUSD)));
    if (sort === 'price-asc') list = [...list].sort((a, b) => Number(BigInt(a.pricePerUnit) - BigInt(b.pricePerUnit)));
    return list;
  }, [assets, mainCat, subCat, search, sort]);

  const subcats = SUB_CATS[mainCat];

  return (
    <div>
      {/* ── Page header ── */}
      <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--border)', padding: '1.5rem 0' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <ShieldCheck size={14} color="var(--brand)" />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Approved Investor Access</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 4 }}>Browse Assets</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                {loading ? 'Loading…' : `${filtered.length} of ${assets.length} assets · Live · Arbitrum Sepolia`}
              </p>
            </div>
            {/* Search + Sort */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  placeholder="Search name, location…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ paddingLeft: 32, width: 220, height: 38 }}
                />
              </div>
              <select value={sort} onChange={e => setSort(e.target.value as typeof sort)}
                style={{ height: 38, fontSize: 13, padding: '0 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--white)', cursor: 'pointer', color: 'var(--text-primary)' }}>
                <option value="newest">Newest First</option>
                <option value="val-desc">Value: High → Low</option>
                <option value="val-asc">Value: Low → High</option>
                <option value="price-asc">Price: Low → High</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '1.5rem 1.25rem' }}>

        {/* ── Main category tabs ── */}
        <div style={{ display: 'flex', gap: 10, marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          {MAIN_CATS.map(mc => {
            const active = mainCat === mc.key;
            return (
              <button key={mc.key} onClick={() => handleMainCat(mc.key)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '0.75rem 1.5rem', borderRadius: 12, border: active ? '2px solid var(--brand)' : '2px solid var(--border)', background: active ? 'var(--brand-light)' : 'var(--white)', color: active ? 'var(--brand)' : 'var(--text-secondary)', fontWeight: 700, fontSize: 15, cursor: 'pointer', transition: 'all 0.15s' }}>
                <span style={{ fontSize: '1.4rem' }}>{mc.icon}</span>
                <span>{mc.label}</span>
                <span style={{ background: active ? 'var(--brand)' : 'var(--border)', color: active ? '#fff' : 'var(--text-secondary)', borderRadius: 100, padding: '1px 8px', fontSize: 12, fontWeight: 700, minWidth: 24, textAlign: 'center' }}>
                  {counts[mc.key]}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Subcategory chips ── */}
        <div className="tab-bar" style={{ display: 'flex', gap: 8, marginBottom: '1.5rem', paddingBottom: 4 }}>
          <button onClick={() => setSubCat(null)}
            className={`btn btn-sm ${subCat === null ? 'btn-primary' : 'btn-outline'}`}
            style={{ flexShrink: 0 }}>
            All
          </button>
          {subcats.map(s => (
            <button key={s} onClick={() => setSubCat(s === subCat ? null : s)}
              className="btn btn-sm"
              style={{ flexShrink: 0, background: subCat === s ? 'var(--brand)' : 'var(--bg)', color: subCat === s ? '#fff' : 'var(--text-secondary)', border: '1px solid var(--border)' }}>
              {s}
            </button>
          ))}
        </div>

        {/* ── Error ── */}
        {error && (
          <div style={{ background: 'var(--red-bg)', color: 'var(--red)', borderRadius: 8, padding: '1rem', marginBottom: '1rem', fontSize: 14 }}>
            {error}
          </div>
        )}

        {/* ── Loading skeletons ── */}
        {loading && (
          <div className="grid-responsive">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && !error && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '5rem 1rem', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>
              {mainCat === 'real-estate' ? '🏢' : '⚡'}
            </div>
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
              {subCat
                ? `No ${subCat} assets yet`
                : `No ${mainCat === 'real-estate' ? 'Real Estate' : 'Renewable Energy'} assets yet`}
            </p>
            <p style={{ fontSize: 14 }}>
              {search ? 'Try adjusting your search.' : 'Check back soon — new assets are onboarded regularly.'}
            </p>
            {subCat && <button className="btn btn-outline btn-sm" style={{ marginTop: 16 }} onClick={() => setSubCat(null)}>Show All</button>}
          </div>
        )}

        {/* ── Asset grid ── */}
        {!loading && filtered.length > 0 && (
          <div className="grid-responsive">
            {filtered.map(a => <AssetCard key={a.address} a={a} />)}
          </div>
        )}
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

// ─── Page entry point ─────────────────────────────────────────────────────────
export default function AssetsPage() {
  const { isConnected } = useAccount();
  if (!isConnected) return <ComplianceGate />;
  return <ListingsView />;
}
