'use client';

import { useState, use } from 'react';
import { useReadContract, useChainId, useAccount, useSwitchChain } from 'wagmi';
import { formatUnits } from 'viem';
import { MapPin, ExternalLink, Loader, AlertCircle } from 'lucide-react';
import { arbitrumSepolia } from 'wagmi/chains';
import { ASSET_TOKEN_ABI } from '@/lib/contracts/abis';
import { usePurchaseListing } from '@/lib/hooks/useMarketplace';
import { useKYCStatus } from '@/lib/hooks/useFHEKYC';

const CATEGORY_LABELS = ['Real Estate', 'Land', 'Renewable Energy', 'Infrastructure', 'Commodities', 'Other'];
const STATUS_LABELS    = ['Pending', 'Active', 'Paused', 'Closed'];
const STATUS_BADGE     = ['badge-yellow', 'badge-green', 'badge-yellow', 'badge-red'];

function fmtUSD(raw: bigint, decimals = 18) {
  const n = Number(formatUnits(raw, decimals));
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

export default function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: tokenAddress } = use(params);
  const addr = tokenAddress as `0x${string}`;

  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { address: wallet } = useAccount();
  const isWrongChain = chainId !== arbitrumSepolia.id;

  const [units, setUnits] = useState('');
  const [tab, setTab]     = useState<'overview' | 'docs'>('overview');

  // ── On-chain reads ────────────────────────────────────────────────────────
  const { data: meta, isLoading } = useReadContract({
    address: addr,
    abi: ASSET_TOKEN_ABI,
    functionName: 'assetMetadata',
    chainId: arbitrumSepolia.id,
  });

  const { data: statusRaw } = useReadContract({
    address: addr,
    abi: ASSET_TOKEN_ABI,
    functionName: 'assetStatus',
    chainId: arbitrumSepolia.id,
  });

  const { data: supply } = useReadContract({
    address: addr,
    abi: ASSET_TOKEN_ABI,
    functionName: 'totalSupply',
    chainId: arbitrumSepolia.id,
  });

  const { data: available } = useReadContract({
    address: addr,
    abi: ASSET_TOKEN_ABI,
    functionName: 'availableUnits',
    chainId: arbitrumSepolia.id,
  });

  const { data: balance } = useReadContract({
    address: addr,
    abi: ASSET_TOKEN_ABI,
    functionName: 'balanceOf',
    args: wallet ? [wallet] : undefined,
    chainId: arbitrumSepolia.id,
    query: { enabled: !!wallet },
  });

  const { status: kycStatus } = useKYCStatus();
  const isVerified = kycStatus === 'approved';
  const { isPending, isConfirming, isSuccess } = usePurchaseListing();

  if (isLoading || !meta) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 10, color: 'var(--text-secondary)' }}>
        <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
        <span>Loading asset…</span>
      </div>
    );
  }

  const status    = typeof statusRaw === 'number' ? statusRaw : 0;
  const badgeCls  = STATUS_BADGE[status]       ?? 'badge-yellow';
  const statusLbl = STATUS_LABELS[status]      ?? 'Unknown';
  const categoryLbl = CATEGORY_LABELS[meta.category] ?? 'Asset';
  const isActive  = status === 1;
  const totalSupply = supply as bigint ?? 0n;
  const avail      = available as bigint ?? 0n;

  const sold = totalSupply > 0n ? totalSupply - avail : 0n;
  const pct  = totalSupply > 0n
    ? Math.min(100, Math.round(Number((sold * 10000n) / totalSupply) / 100))
    : 0;

  const unitsN        = parseFloat(units) || 0;
  const priceN        = Number(formatUnits(meta.pricePerUnit, 18));
  const totalCost     = unitsN * priceN;
  const supplyN       = Number(formatUnits(totalSupply, 18));
  const ownershipPct  = supplyN > 0 ? ((unitsN / supplyN) * 100).toFixed(4) : '0';

  const imageUrl = meta.ipfsCID
    ? `https://gateway.pinata.cloud/ipfs/${meta.ipfsCID}`
    : `https://picsum.photos/seed/${addr.slice(2, 8)}/800/300`;

  const handleBuy = () => {
    if (!wallet || unitsN < 1) return;
    // For marketplace purchase — requires listing ID. Using primary issuance hook.
    console.log('Buy requested:', addr, unitsN);
    // TODO: wire to actual listing ID from marketplace in M2
  };

  return (
    <div>
      {/* Hero */}
      <div style={{ height: 260, overflow: 'hidden', position: 'relative' }}>
        <img src={imageUrl} alt={meta.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${addr.slice(2,8)}/800/300`; }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }} />
        <div className="container" style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <span className={`badge ${badgeCls}`}>{statusLbl}</span>
            <span className="badge badge-blue">{categoryLbl}</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', color: '#fff' }}>{meta.name}</h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <MapPin size={14} /> {meta.location}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container layout-sidebar" style={{ padding: '1.5rem 1.25rem' }}>
        {/* Left */}
        <div>
          {/* Wrong chain banner */}
          {isWrongChain && (
            <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#92400e' }}>⚠️ Switch to Arbitrum Sepolia to interact.</span>
              <button className="btn btn-sm" style={{ background: '#f59e0b', color: '#fff', border: 'none' }} onClick={() => switchChain({ chainId: arbitrumSepolia.id })}>Switch</button>
            </div>
          )}

          {/* Stats */}
          <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '1rem' }}>
            {[
              { label: 'Asset Value',   value: fmtUSD(meta.valuationUSD) },
              { label: 'Price / Token', value: `$${priceN.toFixed(2)}` },
              { label: 'Your Balance',  value: balance ? formatUnits(balance as bigint, 18) : '—' },
            ].map((s, i) => (
              <div key={i} className="stat-box" style={{ borderRight: i < 2 ? '1px solid var(--border)' : undefined }}>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ fontSize: '1.25rem' }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Funding progress */}
          <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 700 }}>{pct}% Sold</span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {formatUnits(avail, 18)} tokens remaining
              </span>
            </div>
            <div className="progress-bar" style={{ height: 10 }}>
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>

          {/* Tabs */}
          <div className="card">
            <div className="tab-bar" style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
              {(['overview', 'docs'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  style={{ padding: '0.75rem 1.25rem', fontSize: 14, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', textTransform: 'capitalize',
                    color: tab === t ? 'var(--brand)' : 'var(--text-secondary)',
                    borderBottom: tab === t ? '2px solid var(--brand)' : '2px solid transparent', marginBottom: -1 }}>
                  {t === 'docs' ? 'Documents & IPFS' : 'Overview'}
                </button>
              ))}
            </div>

            <div style={{ padding: '1.25rem' }}>
              {tab === 'overview' && (
                <table>
                  <tbody>
                    {[
                      ['Token Name',    meta.name],
                      ['Symbol',        meta.symbol],
                      ['Category',      categoryLbl],
                      ['Sub-Type',      meta.assetSubType || '—'],
                      ['Total Supply',  formatUnits(totalSupply, 18) + ' tokens'],
                      ['Available',     formatUnits(avail, 18) + ' tokens'],
                      ['Token Standard','ERC-3643 (T-REX)'],
                      ['Blockchain',   'Arbitrum Sepolia'],
                    ].map(([k, v]) => (
                      <tr key={k}><td style={{ color: 'var(--text-secondary)', width: '40%' }}>{k}</td><td style={{ fontWeight: 600 }}>{v}</td></tr>
                    ))}
                    <tr>
                      <td style={{ color: 'var(--text-secondary)' }}>Token Contract</td>
                      <td>
                        <a href={`https://sepolia.arbiscan.io/address/${addr}`} target="_blank" rel="noopener noreferrer"
                          style={{ color: 'var(--brand)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                          {addr.slice(0, 10)}…{addr.slice(-6)} <ExternalLink size={12} />
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}

              {tab === 'docs' && (
                <div>
                  {meta.ipfsCID ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'var(--bg)', borderRadius: 8 }}>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: 14 }}>IPFS Metadata</p>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{meta.ipfsCID}</p>
                      </div>
                      <a href={`https://gateway.pinata.cloud/ipfs/${meta.ipfsCID}`} target="_blank" rel="noopener noreferrer">
                        <button className="btn btn-outline btn-sm">View <ExternalLink size={12} /></button>
                      </a>
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>No IPFS metadata attached to this token.</p>
                  )}
                  {meta.ppaContractCID && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'var(--bg)', borderRadius: 8, marginTop: 8 }}>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: 14 }}>PPA Contract</p>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{meta.ppaContractCID}</p>
                      </div>
                      <a href={`https://gateway.pinata.cloud/ipfs/${meta.ppaContractCID}`} target="_blank" rel="noopener noreferrer">
                        <button className="btn btn-outline btn-sm">View <ExternalLink size={12} /></button>
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Buy Panel */}
        <div style={{ position: 'sticky', top: 72 }}>
          <div className="card" style={{ borderRadius: 10 }}>
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
                <button className="btn btn-outline-red" style={{ width: '100%' }} onClick={() => switchChain({ chainId: arbitrumSepolia.id })}>
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
                     `Buy ${unitsN || '—'} tokens (USDC)`}
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
                  {statusLbl === 'Pending' ? '⏳ Pending Activation' :
                   statusLbl === 'Paused'  ? '⏸ Purchases Paused' :
                   '🔒 Closed'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
