'use client';

import Link from 'next/link';
import { MapPin, Coins } from 'lucide-react';
import { useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { ASSET_TOKEN_ABI } from '@/lib/contracts/abis';
import { DEFAULT_CHAIN_ID } from '@/lib/web3-config';



const ASSET_CATEGORY_LABELS = ['Real Estate', 'Energy', 'Carbon', 'REC', 'Other'];

// Status: 0=Pending, 1=Active, 2=Paused, 3=Closed
const STATUS_LABELS = ['Coming Soon', 'Active', 'Paused', 'Closed'];
const STATUS_BADGE  = ['badge-yellow', 'badge-green', 'badge-yellow', 'badge-red'];

// Curated house images — keyed by ipfsCID prefix (first 22 chars, unique per UK property).
const PROPERTY_IMAGES: Record<string, string> = {
  QmMayfairLuxuryApartmen:  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
  QmCanaryWharfOfficeTower: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80',
  QmKensingtonTownhouseVic: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80',
  QmManchesterCityCentreFl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
  QmEdinburghOldTownTeneme: 'https://images.unsplash.com/photo-1600596542815-ffad4c153b09?w=800&q=80',
  QmBirminghamRetailParkBu: 'https://images.unsplash.com/photo-1554435493-93422e8220c8?w=800&q=80',
  QmBristolHarboursidePent: 'https://images.unsplash.com/photo-1600607687939-ce8a6d79a41a?w=800&q=80',
  QmLeedsIndustrialWarehou: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&q=80',
  QmOxfordStudentQuarterCo: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
  QmSurreyCountryEstateGui: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80',
};

function getPropertyImage(cid: string, tokenAddress: string): string {
  const key = Object.keys(PROPERTY_IMAGES).find(k => cid.startsWith(k));
  if (key) return PROPERTY_IMAGES[key];
  return `https://picsum.photos/seed/${tokenAddress.slice(2, 8)}/400/220`;
}

function fmtSupply(n: bigint): string {
  const v = Number(n);
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}K`;
  return v.toString();
}

function fmtUSD(rawUsdc: bigint, decimals = 6): string {
  const usd = Number(formatUnits(rawUsdc, decimals));
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(1)}M`;
  if (usd >= 1_000)     return `$${(usd / 1_000).toFixed(0)}K`;
  return `$${usd.toFixed(2)}`;
}

export default function OnChainPropertyCard({ tokenAddress }: { tokenAddress: `0x${string}` }) {
  const { data: meta, isLoading } = useReadContract({
    address: tokenAddress,
    abi: ASSET_TOKEN_ABI,
    functionName: 'assetMetadata',
    chainId: DEFAULT_CHAIN_ID,
  });

  const { data: statusRaw } = useReadContract({
    address: tokenAddress,
    abi: ASSET_TOKEN_ABI,
    functionName: 'paused',
    chainId: DEFAULT_CHAIN_ID,
  });

  const { data: totalSupply } = useReadContract({
    address: tokenAddress,
    abi: ASSET_TOKEN_ABI,
    functionName: 'totalSupply',
    chainId: DEFAULT_CHAIN_ID,
  });

  if (isLoading || !meta) {
    return (
      <div className="card" style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
        Loading…
      </div>
    );
  }

  const status    = statusRaw === true ? 1 : 0;
  const typeLbl   = ASSET_CATEGORY_LABELS[(meta as any)?.category ?? 0] ?? 'Asset';
  const supply    = (totalSupply as bigint | undefined) ?? 0n;

  // Sold-out / coming-soon — based on status only (secondary-market funded% TBD)
  const isSoldOut    = false;
  const isComingSoon = status === 0;
  const badgeCls  = isComingSoon ? 'badge-yellow' : 'badge-green';
  const statusLbl = isComingSoon ? 'Coming Soon' : 'Active';

  // IPFS image — use curated map for seed CIDs, fall back to IPFS gateway, then picsum
  const imageUrl = getPropertyImage(meta.ipfsCID ?? '', tokenAddress);

  return (
    <Link href={`/assets/${tokenAddress}`} style={{ textDecoration: 'none' }}>
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
            From {fmtUSD(meta.pricePerUnit)}
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
              <p style={{ fontSize: 14, fontWeight: 700 }}>{fmtUSD(meta.valuationUSD)}</p>
            </div>
            <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>Token Price</p>
              <p style={{ fontSize: 14, fontWeight: 700 }}>{fmtUSD(meta.pricePerUnit)}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>Total Supply</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: supply > 0n ? 'var(--green)' : undefined }}>
                {supply > 0n ? fmtSupply(supply) : '—'}
              </p>
            </div>
          </div>

          {/* Token address chip */}
          <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Coins size={11} />
              {isComingSoon ? 'Opening soon' : supply > 0n ? `${fmtSupply(supply)} tokens live` : 'Pending mint'}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
              {tokenAddress.slice(0, 6)}…{tokenAddress.slice(-4)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

