'use client';

import { useState, useEffect, use } from 'react';
import { useReadContract, useChainId, useAccount, useSwitchChain } from 'wagmi';
import { formatUnits } from 'viem';
import { MapPin, ExternalLink, Loader, AlertCircle, ChevronLeft, ChevronRight, FileText, Play, Image as ImageIcon, Download } from 'lucide-react';
import { arbitrumSepolia } from 'wagmi/chains';
import { ASSET_TOKEN_ABI } from '@/lib/contracts/abis';
import { usePurchaseListing } from '@/lib/hooks/useMarketplace';
import { useKYCStatus } from '@/lib/hooks/useFHEKYC';
import { fetchIpfsMeta, ipfsToUrl, DOC_TYPE_LABELS, DOC_TYPE_ICONS, type AssetMetadataJson, type AssetMedia } from '@/lib/ipfs';

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORY_LABELS = ['Real Estate', 'Land', 'Renewable Energy', 'Infrastructure', 'Commodities', 'Other'];
const STATUS_LABELS   = ['Pending', 'Active', 'Paused', 'Closed'];
const STATUS_BADGE    = ['badge-yellow', 'badge-green', 'badge-yellow', 'badge-red'];

// Curated cover images (fallback for wave-1 tokens without IPFS media array)
const CURATED_IMAGES: Record<string, string> = {
  QmMayfairLuxuryApartmen:  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=85',
  QmCanaryWharfOfficeTower: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=85',
  QmKensingtonTownhouseVic: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200&q=85',
  QmManchesterCityCentreFl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=85',
  QmEdinburghOldTownTeneme: 'https://images.unsplash.com/photo-1600596542815-ffad4c153b09?w=1200&q=85',
  QmBirminghamRetailParkBu: 'https://images.unsplash.com/photo-1554435493-93422e8220c8?w=1200&q=85',
  QmBristolHarboursidePent: 'https://images.unsplash.com/photo-1600607687939-ce8a6d79a41a?w=1200&q=85',
  QmLeedsIndustrialWarehou: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=1200&q=85',
  QmOxfordStudentQuarterCo: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=85',
  QmSurreyCountryEstateGui: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=85',
};
function curatedImage(cid: string, addr: string) {
  const key = Object.keys(CURATED_IMAGES).find(k => cid?.startsWith(k));
  return key ? CURATED_IMAGES[key] : `https://picsum.photos/seed/${addr.slice(2,8)}/1200/500`;
}

function fmtUSD(raw: bigint, decimals = 18) {
  const n = Number(formatUnits(raw, decimals));
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

// ─── Image / Video carousel ───────────────────────────────────────────────────
function MediaCarousel({ items, fallbackUrl }: { items: AssetMedia[]; fallbackUrl: string }) {
  const [idx, setIdx] = useState(0);
  const images  = items.filter(m => m.type === 'image');
  const videos  = items.filter(m => m.type === 'video');
  const all     = [...images, ...videos];
  const current = all[idx];

  // If no IPFS media, show the curated/fallback image
  if (all.length === 0) {
    return (
      <div style={{ width: '100%', height: 320, borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
        <img src={fallbackUrl} alt="Asset" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 11, padding: '4px 10px', borderRadius: 100 }}>
          Cover photo
        </div>
      </div>
    );
  }

  const prev = () => setIdx(i => (i - 1 + all.length) % all.length);
  const next = () => setIdx(i => (i + 1) % all.length);

  return (
    <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: '#000' }}>
      {/* Media item */}
      <div style={{ height: 320, position: 'relative' }}>
        {current?.type === 'video' ? (
          <video
            src={ipfsToUrl(current.cid)}
            controls poster={current.thumbnail ? ipfsToUrl(current.thumbnail) : undefined}
            style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
          />
        ) : (
          <img
            src={ipfsToUrl(current?.cid ?? '')}
            alt={current?.title ?? 'Asset media'}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { (e.target as HTMLImageElement).src = fallbackUrl; }}
          />
        )}

        {/* Nav arrows */}
        {all.length > 1 && (
          <>
            <button onClick={prev} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
              <ChevronLeft size={20} />
            </button>
            <button onClick={next} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Caption + counter */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', padding: '2rem 1rem 0.75rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>
            {current?.type === 'video' && <Play size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />}
            {current?.title}
          </span>
          {all.length > 1 && <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{idx + 1} / {all.length}</span>}
        </div>
      </div>

      {/* Thumbnail strip */}
      {all.length > 1 && (
        <div style={{ display: 'flex', gap: 6, padding: '8px', background: 'rgba(0,0,0,0.8)', overflowX: 'auto' }}>
          {all.map((m, i) => (
            <button key={i} onClick={() => setIdx(i)} style={{ flexShrink: 0, width: 60, height: 42, borderRadius: 6, overflow: 'hidden', border: i === idx ? '2px solid var(--brand)' : '2px solid transparent', cursor: 'pointer', background: '#000', padding: 0 }}>
              {m.type === 'video'
                ? <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a1a' }}><Play size={16} color="#fff" /></div>
                : <img src={ipfsToUrl(m.cid)} alt={m.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).src = fallbackUrl; }} />
              }
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Documents tab ────────────────────────────────────────────────────────────
function DocumentsTab({ ipfsMeta, onChainCID, ppaCID }: { ipfsMeta: AssetMetadataJson | null; onChainCID: string; ppaCID: string }) {
  // Merge IPFS document manifest + on-chain CIDs as fallback
  const docs = ipfsMeta?.documents ?? [];

  return (
    <div>
      {/* IPFS document manifest */}
      {docs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {docs.map((doc, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.9rem 1rem', background: 'var(--bg)', borderRadius: 10, gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '1.4rem' }}>{DOC_TYPE_ICONS[doc.docType]}</span>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{doc.title}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {DOC_TYPE_LABELS[doc.docType]}
                    {doc.issuedBy   && ` · ${doc.issuedBy}`}
                    {doc.issuedDate && ` · ${doc.issuedDate}`}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <a href={ipfsToUrl(doc.cid)} target="_blank" rel="noopener noreferrer">
                  <button className="btn btn-outline btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    View <ExternalLink size={12} />
                  </button>
                </a>
                <a href={ipfsToUrl(doc.cid)} download>
                  <button className="btn btn-sm" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Download size={12} />
                  </button>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* On-chain CID links (always shown) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {onChainCID && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'var(--bg)', borderRadius: 8, flexWrap: 'wrap', gap: 8 }}>
            <div>
              <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>📦 IPFS Metadata (on-chain)</p>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{onChainCID}</p>
            </div>
            <a href={ipfsToUrl(onChainCID)} target="_blank" rel="noopener noreferrer">
              <button className="btn btn-outline btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>View <ExternalLink size={11} /></button>
            </a>
          </div>
        )}
        {ppaCID && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'var(--bg)', borderRadius: 8, flexWrap: 'wrap', gap: 8 }}>
            <div>
              <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>⚡ PPA Contract (on-chain)</p>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{ppaCID}</p>
            </div>
            <a href={ipfsToUrl(ppaCID)} target="_blank" rel="noopener noreferrer">
              <button className="btn btn-outline btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>View <ExternalLink size={11} /></button>
            </a>
          </div>
        )}
        {!onChainCID && !ppaCID && docs.length === 0 && (
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>No documents attached yet. Legal documents will appear here after upload.</p>
        )}
      </div>
    </div>
  );
}

// ─── Detail page ──────────────────────────────────────────────────────────────
export default function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: tokenAddress } = use(params);
  const addr = tokenAddress as `0x${string}`;

  const chainId          = useChainId();
  const { switchChain }  = useSwitchChain();
  const { address: wallet } = useAccount();
  const isWrongChain     = chainId !== arbitrumSepolia.id;

  const [units, setUnits]         = useState('');
  const [tab, setTab]             = useState<'overview' | 'gallery' | 'documents'>('overview');
  const [ipfsMeta, setIpfsMeta]   = useState<AssetMetadataJson | null>(null);
  const [ipfsLoading, setIpfsLoading] = useState(false);

  // ── On-chain reads ────────────────────────────────────────────────────────
  const { data: meta, isLoading } = useReadContract({ address: addr, abi: ASSET_TOKEN_ABI, functionName: 'assetMetadata', chainId: arbitrumSepolia.id });
  const { data: statusRaw }       = useReadContract({ address: addr, abi: ASSET_TOKEN_ABI, functionName: 'assetStatus',   chainId: arbitrumSepolia.id });
  const { data: supply }          = useReadContract({ address: addr, abi: ASSET_TOKEN_ABI, functionName: 'totalSupply',   chainId: arbitrumSepolia.id });
  const { data: available }       = useReadContract({ address: addr, abi: ASSET_TOKEN_ABI, functionName: 'availableUnits', chainId: arbitrumSepolia.id });
  const { data: balance }         = useReadContract({ address: addr, abi: ASSET_TOKEN_ABI, functionName: 'balanceOf', args: wallet ? [wallet] : undefined, chainId: arbitrumSepolia.id, query: { enabled: !!wallet } });

  const { status: kycStatus }             = useKYCStatus();
  const isVerified                        = kycStatus === 'approved';
  const { isPending, isConfirming, isSuccess } = usePurchaseListing();

  // ── Fetch IPFS metadata (gallery + documents) ─────────────────────────────
  useEffect(() => {
    if (!meta?.ipfsCID) return;
    setIpfsLoading(true);
    fetchIpfsMeta(meta.ipfsCID)
      .then(json => setIpfsMeta(json))
      .finally(() => setIpfsLoading(false));
  }, [meta?.ipfsCID]);

  if (isLoading || !meta) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 10, color: 'var(--text-secondary)' }}>
        <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
        <span>Loading asset…</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const status       = typeof statusRaw === 'number' ? statusRaw : 0;
  const badgeCls     = STATUS_BADGE[status] ?? 'badge-yellow';
  const statusLbl    = STATUS_LABELS[status] ?? 'Unknown';
  const categoryLbl  = CATEGORY_LABELS[meta.category] ?? 'Asset';
  const isActive     = status === 1;
  const totalSupply  = (supply as bigint) ?? 0n;
  const avail        = (available as bigint) ?? 0n;
  const sold         = totalSupply > 0n ? totalSupply - avail : 0n;
  const pct          = totalSupply > 0n ? Math.min(100, Math.round(Number((sold * 10000n) / totalSupply) / 100)) : 0;
  const unitsN       = parseFloat(units) || 0;
  const priceN       = Number(formatUnits(meta.pricePerUnit, 18));
  const totalCost    = unitsN * priceN;
  const supplyN      = Number(formatUnits(totalSupply, 18));
  const ownershipPct = supplyN > 0 ? ((unitsN / supplyN) * 100).toFixed(4) : '0';

  const coverImage  = curatedImage(meta.ipfsCID ?? '', addr);
  // Gallery media: from IPFS manifest if present, else empty (carousel shows fallback)
  const galleryMedia = ipfsMeta?.media ?? [];

  const handleBuy = () => {
    if (!wallet || unitsN < 1) return;
    console.log('Buy requested:', addr, unitsN);
  };

  return (
    <div>
      {/* ── Hero image banner ── */}
      <div style={{ height: 280, overflow: 'hidden', position: 'relative' }}>
        <img src={coverImage} alt={meta.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${addr.slice(2,8)}/1200/400`; }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.1))' }} />
        <div className="container" style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <span className={`badge ${badgeCls}`}>{statusLbl}</span>
            <span className="badge badge-blue">{categoryLbl}</span>
            {meta.assetSubType && <span className="badge badge-blue">{meta.assetSubType}</span>}
          </div>
          <h1 style={{ fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', color: '#fff', fontWeight: 800 }}>{meta.name}</h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, fontSize: 14 }}>
            <MapPin size={14} /> {meta.location}
          </p>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="container layout-sidebar" style={{ padding: '1.5rem 1.25rem' }}>

        {/* Left column */}
        <div>
          {/* Wrong chain */}
          {isWrongChain && (
            <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#92400e' }}>⚠️ Switch to Arbitrum Sepolia to interact.</span>
              <button className="btn btn-sm" style={{ background: '#f59e0b', color: '#fff', border: 'none' }} onClick={() => switchChain({ chainId: arbitrumSepolia.id })}>Switch</button>
            </div>
          )}

          {/* Stats grid */}
          <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '1rem' }}>
            {[
              { label: 'Asset Value',   value: fmtUSD(meta.valuationUSD) },
              { label: 'Price / Token', value: `$${priceN.toFixed(2)}` },
              { label: 'Your Balance',  value: balance ? formatUnits(balance as bigint, 18) : '—' },
            ].map((s, i) => (
              <div key={i} className="stat-box" style={{ borderRight: i < 2 ? '1px solid var(--border)' : undefined }}>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ fontSize: '1.2rem' }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Funding progress */}
          <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{pct}% Sold</span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {formatUnits(avail, 18)} tokens remaining
              </span>
            </div>
            <div className="progress-bar" style={{ height: 10 }}>
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>

          {/* Tabs: Overview | Gallery | Documents */}
          <div className="card">
            <div className="tab-bar" style={{ display: 'flex', borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
              {([
                { key: 'overview',   label: 'Overview' },
                { key: 'gallery',    label: `Gallery${galleryMedia.length > 0 ? ` (${galleryMedia.length})` : ''}` },
                { key: 'documents',  label: 'Documents' },
              ] as const).map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  style={{ padding: '0.75rem 1.2rem', fontSize: 14, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, color: tab === t.key ? 'var(--brand)' : 'var(--text-secondary)', borderBottom: tab === t.key ? '2px solid var(--brand)' : '2px solid transparent', marginBottom: -1 }}>
                  {t.label}
                </button>
              ))}
            </div>

            <div style={{ padding: '1.25rem' }}>

              {/* Overview tab */}
              {tab === 'overview' && (
                <div className="table-scroll">
                  <table>
                    <tbody>
                      {[
                        ['Token Name',     meta.name],
                        ['Symbol',         meta.symbol],
                        ['Category',       categoryLbl],
                        ['Sub-Type',       meta.assetSubType || '—'],
                        ['Total Supply',   formatUnits(totalSupply, 18) + ' tokens'],
                        ['Available',      formatUnits(avail, 18) + ' tokens'],
                        ['Token Standard', 'ERC-3643 (T-REX)'],
                        ['Blockchain',     'Arbitrum Sepolia'],
                        ...(Number(meta.capacityKW) > 0     ? [['Capacity',     `${meta.capacityKW} kW`]] : []),
                        ...(Number(meta.annualYieldMWh) > 0  ? [['Annual Yield', `${meta.annualYieldMWh} MWh`]] : []),
                        ...(Number(meta.ppaTermYears) > 0    ? [['PPA Term',     `${meta.ppaTermYears} years`]] : []),
                      ].map(([k, v]) => (
                        <tr key={k}><td style={{ color: 'var(--text-secondary)', width: '40%', fontSize: 13 }}>{k}</td><td style={{ fontWeight: 600, fontSize: 13 }}>{v}</td></tr>
                      ))}
                      <tr>
                        <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Token Contract</td>
                        <td>
                          <a href={`https://sepolia.arbiscan.io/address/${addr}`} target="_blank" rel="noopener noreferrer"
                            style={{ color: 'var(--brand)', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                            {addr.slice(0,10)}…{addr.slice(-6)} <ExternalLink size={12} />
                          </a>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Gallery tab */}
              {tab === 'gallery' && (
                <div>
                  {ipfsLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: 10, color: 'var(--text-secondary)' }}>
                      <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
                      <span style={{ fontSize: 14 }}>Loading media from IPFS…</span>
                    </div>
                  ) : (
                    <>
                      <MediaCarousel items={galleryMedia} fallbackUrl={coverImage} />
                      {galleryMedia.length === 0 && (
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 12, textAlign: 'center' }}>
                          High-resolution media will appear here once the asset owner uploads images and videos via the Admin panel.
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Documents tab */}
              {tab === 'documents' && (
                <DocumentsTab
                  ipfsMeta={ipfsMeta}
                  onChainCID={meta.ipfsCID ?? ''}
                  ppaCID={meta.ppaContractCID ?? ''}
                />
              )}
            </div>
          </div>
        </div>

        {/* Right: Buy Panel */}
        <div style={{ position: 'sticky', top: 72 }}>
          <div className="card" style={{ borderRadius: 12 }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: 17, marginBottom: 4 }}>Buy Tokens</h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>ERC-3643 · KYC required · USDC</p>
            </div>
            <div style={{ padding: '1.25rem' }}>
              <label>Number of Tokens</label>
              <input type="number" placeholder="e.g. 100" value={units}
                onChange={e => setUnits(e.target.value)} min="1" style={{ marginBottom: 12 }} />

              {unitsN > 0 && (
                <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '0.75rem', marginBottom: 12, fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Cost (USDC)</span>
                    <span style={{ fontWeight: 700 }}>${totalCost.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Ownership</span>
                    <span style={{ fontWeight: 700 }}>{ownershipPct}%</span>
                  </div>
                </div>
              )}

              {isSuccess && (
                <div style={{ background: 'var(--green-bg)', color: 'var(--green)', borderRadius: 8, padding: '0.75rem', marginBottom: 10, fontSize: 13 }}>
                  ✓ Purchase confirmed! Tokens are in your wallet.
                </div>
              )}

              {isWrongChain ? (
                <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => switchChain({ chainId: arbitrumSepolia.id })}>
                  ⚠️ Switch to Arbitrum Sepolia
                </button>
              ) : isActive ? (
                <>
                  <button className="btn btn-primary" style={{ width: '100%', marginBottom: 8 }}
                    disabled={!wallet || !isVerified || unitsN < 1 || isPending || isConfirming}
                    onClick={handleBuy}>
                    {!wallet      ? 'Connect Wallet' :
                     !isVerified  ? 'KYC Not Verified' :
                     isPending    ? 'Confirm in wallet…' :
                     isConfirming ? 'Confirming…' :
                     `Buy ${unitsN || '—'} tokens`}
                  </button>
                  {wallet && !isVerified && (
                    <div style={{ display: 'flex', gap: 6, fontSize: 12, color: 'var(--text-secondary)', alignItems: 'flex-start' }}>
                      <AlertCircle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                      <span>Complete KYC verification to purchase tokens.</span>
                    </div>
                  )}
                </>
              ) : (
                <button className="btn btn-outline" style={{ width: '100%' }} disabled>
                  {statusLbl === 'Pending' ? '⏳ Pending Activation' : statusLbl === 'Paused' ? '⏸ Purchases Paused' : '🔒 Closed'}
                </button>
              )}
            </div>
          </div>
        </div>

      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
