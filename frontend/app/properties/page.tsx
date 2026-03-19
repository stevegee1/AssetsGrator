'use client';

import { useState } from 'react';
import { useReadContract } from 'wagmi';
import { Search, SlidersHorizontal, Loader } from 'lucide-react';
import { PROPERTY_FACTORY_ABI } from '@/lib/contracts/abis';
import { ADDRESSES } from '@/lib/contracts/addresses';
import OnChainPropertyCard from '@/components/property/OnChainPropertyCard';

const PROP_TYPES = ['All', 'Residential', 'Commercial', 'Industrial', 'Land', 'Energies'] as const;
const AMOY_ADDRESSES = ADDRESSES.mumbai;

export default function PropertiesPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'val-desc' | 'val-asc'>('newest');

  const { data: allProperties, isLoading } = useReadContract({
    address: AMOY_ADDRESSES.PROPERTY_FACTORY,
    abi: PROPERTY_FACTORY_ABI,
    functionName: 'getAllProperties',
    chainId: 80002,
    query: { refetchInterval: 15_000 },
  });

  const properties = (allProperties ?? []) as `0x${string}`[];


  return (
    <div>
      {/* Page header */}
      <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--border)', padding: '1.75rem 0' }}>
        <div className="container">
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 4 }}>Browse Assets</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            {isLoading ? 'Loading…' : `${properties.length} asset${properties.length === 1 ? '' : 's'} available`}
            {' · '}Live data · Polygon Amoy
          </p>
        </div>
      </div>

      {/* ── Listings ──────────────────────────────────────────────────────── */}
      <div id="listings-section" className="container" style={{ padding: '2rem 1.25rem' }}>

        {/* Search + filter bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: 8 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
            {isLoading ? 'Loading…' : `${properties.length} Asset${properties.length === 1 ? '' : 's'} Available`}
            <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-secondary)', marginLeft: 8 }}>· Live · Polygon Amoy</span>
          </h2>
          {/* Sort */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as typeof sortBy)}
            style={{ fontSize: 13, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--white)', color: 'var(--text-primary)', cursor: 'pointer' }}
          >
            <option value="newest">Newest First</option>
            <option value="val-desc">Value: High → Low</option>
            <option value="val-asc">Value: Low → High</option>
          </select>
        </div>

        <div className="card" style={{ padding: '0.85rem 1rem', marginBottom: '1.5rem', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              placeholder="Search by address or location…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 32 }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <SlidersHorizontal size={14} color="var(--text-secondary)" />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Type:</span>
            {PROP_TYPES.map((t, i) => (
              <button
                key={t}
                onClick={() => setTypeFilter(i === 0 ? null : i - 1)}
                className="btn btn-sm"
                style={{
                  background: (i === 0 ? typeFilter === null : typeFilter === i - 1) ? 'var(--brand)' : 'var(--bg)',
                  color: (i === 0 ? typeFilter === null : typeFilter === i - 1) ? '#fff' : 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: 10, color: 'var(--text-secondary)' }}>
            <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
            <span>Fetching on-chain properties…</span>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && properties.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: 16, fontWeight: 600 }}>No properties deployed yet</p>
            <p style={{ fontSize: 14, marginTop: 4 }}>
              Deploy the first property from the <a href="/admin" style={{ color: 'var(--brand)' }}>Admin Panel</a>
            </p>
          </div>
        )}

        {/* Grid */}
        {!isLoading && properties.length > 0 && (
          <div className="grid-responsive">
            {properties
              .filter(addr => !search || addr.toLowerCase().includes(search.toLowerCase()))
              .map(addr => (
                <OnChainPropertyCard key={addr} tokenAddress={addr} />
              ))}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
