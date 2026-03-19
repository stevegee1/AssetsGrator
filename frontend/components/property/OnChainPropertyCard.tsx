'use client';

import Link from 'next/link';
import { MapPin, Coins } from 'lucide-react';
import { useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { PROPERTY_TOKEN_ABI } from '@/lib/contracts/abis';

// ── Fixed GBP/USD rate — update when we integrate live FX ─────────────────────
const GBP_RATE = 0.79; // 1 USD = 0.79 GBP (approx)

const PROP_TYPE_LABELS = ['Residential', 'Commercial', 'Industrial', 'Land', 'Energies'];

// Status: 0=Pending, 1=Active, 2=Paused, 3=Closed
const STATUS_LABELS = ['Coming Soon', 'Active', 'Paused', 'Closed'];
const STATUS_BADGE  = ['badge-yellow', 'badge-green', 'badge-yellow', 'badge-red'];

function fmtGBP(rawUsd: bigint, decimals = 18): string {
  const usd = Number(formatUnits(rawUsd, decimals));
  const gbp = usd * GBP_RATE;
  if (gbp >= 1_000_000) return `£${(gbp / 1_000_000).toFixed(1)}M`;
  if (gbp >= 1_000)     return `£${(gbp / 1_000).toFixed(0)}K`;
  return `£${gbp.toFixed(2)}`;
}

export default function OnChainPropertyCard({ tokenAddress }: { tokenAddress: `0x${string}` }) {
  const { data: meta, isLoading } = useReadContract({
    address: tokenAddress,
    abi: PROPERTY_TOKEN_ABI,
    functionName: 'propertyMetadata',
    chainId: 80002,
  });

  const { data: statusRaw } = useReadContract({
    address: tokenAddress,
    abi: PROPERTY_TOKEN_ABI,
    functionName: 'propertyStatus',
    chainId: 80002,
  });

  const { data: totalSupply } = useReadContract({
    address: tokenAddress,
    abi: PROPERTY_TOKEN_ABI,
    functionName: 'totalSupply',
    chainId: 80002,
  });

  const { data: availableUnits } = useReadContract({
    address: tokenAddress,
    abi: PROPERTY_TOKEN_ABI,
    functionName: 'availableUnits',
    chainId: 80002,
  });

  if (isLoading || !meta) {
    return (
      <div className="card" style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
        Loading…
      </div>
    );
  }

  const status    = typeof statusRaw === 'number' ? statusRaw : 0;
  const typeLbl   = PROP_TYPE_LABELS[meta.propType] ?? 'Asset';

  // Funding progress
  const sold = totalSupply && availableUnits ? totalSupply - availableUnits : 0n;
  const pct  = totalSupply && totalSupply > 0n
    ? Math.min(100, Math.round(Number((sold * 10000n) / totalSupply) / 100))
    : 0;

  // Choose badge: Sold Out overrides status if 100% tokens taken
  const isSoldOut    = pct >= 100;
  const isComingSoon = status === 0;
  const badgeCls  = isSoldOut ? 'badge-red' : STATUS_BADGE[status] ?? 'badge-yellow';
  const statusLbl = isSoldOut ? 'Sold Out' : STATUS_LABELS[status] ?? 'Unknown';

  // IPFS image
  const imageUrl = meta.ipfsCID
    ? `https://gateway.pinata.cloud/ipfs/${meta.ipfsCID}`
    : `https://picsum.photos/seed/${tokenAddress.slice(2, 8)}/400/220`;

  return (
    <Link href={`/properties/${tokenAddress}`} style={{ textDecoration: 'none' }}>
      <div
        className="card"
        style={{
          cursor: 'pointer',
          borderRadius: 10,
          overflow: 'hidden',
          transition: 'box-shadow 0.15s, transform 0.15s',
          opacity: isSoldOut ? 0.75 : 1,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        {/* Image */}
        <div style={{ position: 'relative', height: 180, overflow: 'hidden', background: 'var(--bg-secondary)' }}>
          <img
            src={imageUrl}
            alt={meta.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${tokenAddress.slice(2, 8)}/400/220`; }}
          />
          {/* Overlay on sold out */}
          {isSoldOut && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: 18, letterSpacing: '0.05em' }}>SOLD OUT</span>
            </div>
          )}
          <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6 }}>
            <span className={`badge ${badgeCls}`}>{statusLbl}</span>
            <span className="badge badge-blue">{typeLbl}</span>
          </div>
          {/* Min buy chip top-right */}
          <div style={{
            position: 'absolute', top: 10, right: 10,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            borderRadius: 100, padding: '4px 10px',
            fontSize: 12, fontWeight: 700, color: '#fff',
          }}>
            From {fmtGBP(meta.pricePerUnit)}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '1rem' }}>
          <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, lineHeight: '1.3' }}>{meta.name}</p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
            <MapPin size={13} /> {meta.location}
          </p>

          {/* Stats: Valuation | Min. Buy | Funded */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>Valuation</p>
              <p style={{ fontSize: 14, fontWeight: 700 }}>{fmtGBP(meta.valuationUSD)}</p>
            </div>
            <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>Min. Buy</p>
              <p style={{ fontSize: 14, fontWeight: 700 }}>{fmtGBP(meta.pricePerUnit)}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>Funded</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: pct >= 80 ? 'var(--green)' : undefined }}>{pct}%</p>
            </div>
          </div>

          {/* Funding bar */}
          <div style={{ marginTop: 10 }}>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${pct}%`,
                  background: isSoldOut ? 'var(--text-secondary)' : undefined,
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Coins size={11} />
                {isSoldOut ? 'Fully funded' : isComingSoon ? 'Opening soon' : `${pct}% sold`}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                {tokenAddress.slice(0, 6)}…{tokenAddress.slice(-4)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
