'use client';

import { useState } from 'react';
import { Coins, TrendingUp, Building2, AlertCircle, Loader2, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useDashboard } from '@/lib/hooks/useDashboard';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { PROPERTY_TREASURY_ABI } from '@/lib/contracts/abis';

// ── Format helpers ────────────────────────────────────────────────────────────
// All on-chain USDC values are 6-decimal (e.g. 1_000_000n = $1.00)
function fmtUsdc(raw: bigint): string {
  const n = Number(raw) / 1_000_000;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}
// pricePerUnit is 18-decimal USD (e.g. 500_000n * 1e18 = $500,000 per unit)
function fmtPrice(raw: bigint): string {
  const n = Number(raw) / 1e18;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}
function fmtUnits(units: bigint): string {
  return Number(units).toLocaleString();
}

export default function DashboardPage() {
  const { holdings, totalValueUsdc, totalClaimable, isKYCVerified, isLoading, walletConnected } = useDashboard();
  const [redeemingToken, setRedeemingToken] = useState<`0x${string}` | null>(null);

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: confirming, isSuccess: redeemSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const redeemingHolding = holdings.find(h => h.tokenAddress === redeemingToken);

  const handleRedeem = () => {
    if (!redeemingHolding?.treasuryAddress || redeemingHolding.units === 0n) return;
    writeContract({
      address: redeemingHolding.treasuryAddress,
      abi: PROPERTY_TREASURY_ABI,
      functionName: 'redeem',
      args: [redeemingHolding.units],
    });
  };

  return (
    <div>
      {/* Page header */}
      <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--border)', padding: '2rem 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', marginBottom: 4 }}>My Portfolio</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Track your investments and claim rental income</p>
          </div>
          <Link href="/properties"><button className="btn btn-primary">Browse Properties</button></Link>
        </div>
      </div>

      <div className="container" style={{ padding: '1.5rem 1.25rem' }}>

        {/* Wallet not connected */}
        {!walletConnected && (
          <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
            <Wallet size={40} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
            <p style={{ fontWeight: 700, marginBottom: 8 }}>Connect your wallet to view your portfolio</p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Your holdings, rental income, and investment history will appear here.</p>
          </div>
        )}

        {walletConnected && (
          <>
            {/* KYC warning */}
            {!isKYCVerified && (
              <div style={{ background: 'var(--yellow-bg)', border: '1px solid #fde047', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1.5rem', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <AlertCircle size={18} color="var(--yellow)" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--yellow)' }}>KYC Verification Required</p>
                  <p style={{ fontSize: 13, color: 'var(--yellow)' }}>Complete identity verification to buy tokens and claim rent.</p>
                </div>
                <Link href="/kyc">
                  <button className="btn btn-sm" style={{ marginLeft: 'auto', background: 'var(--yellow)', color: '#fff', flexShrink: 0 }}>Verify Identity</button>
                </Link>
              </div>
            )}

            {/* Loading */}
            {isLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '2rem', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Loading your on-chain portfolio…</span>
              </div>
            )}

            {!isLoading && (
              <>
                {/* Summary stats */}
                <div className="card grid-4" style={{ marginBottom: '1.5rem' }}>
                  {[
                    { label: 'Properties Held', value: String(holdings.length), icon: Building2 },
                    { label: 'Total Units', value: holdings.reduce((s, h) => s + h.units, 0n).toLocaleString(), icon: Coins },
                    { label: 'Portfolio Value', value: fmtUsdc(totalValueUsdc), icon: TrendingUp, highlight: true },
                    { label: 'Claimable (est.)', value: fmtUsdc(totalClaimable), icon: Coins, green: true },
                  ].map((s, i) => (
                    <div key={i} className="stat-box" style={{ borderRight: i < 3 ? '1px solid var(--border)' : undefined }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <s.icon size={15} color={s.highlight ? 'var(--brand)' : s.green ? 'var(--green)' : 'var(--text-secondary)'} />
                        <span className="stat-label" style={{ margin: 0 }}>{s.label}</span>
                      </div>
                      <div className="stat-value" style={{ fontSize: '1.25rem', color: s.green ? 'var(--green)' : s.highlight ? 'var(--brand)' : undefined }}>
                        {s.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Holdings */}
                <h2 style={{ fontSize: 16, marginBottom: '0.75rem' }}>Your Holdings</h2>
                {holdings.length === 0 ? (
                  <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <Building2 size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                    <p>No holdings yet. <Link href="/properties" style={{ color: 'var(--brand)' }}>Browse properties →</Link></p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
                    {holdings.map(h => (
                      <div key={h.tokenAddress} className="card">
                        <div style={{ display: 'flex', gap: 16, padding: '1rem', flexWrap: 'wrap' }}>
                          <div style={{ flex: 1, minWidth: 200 }}>
                            <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 2, color: 'var(--brand)' }}>{h.name}</p>
                            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>{h.location}</p>
                            <div style={{ display: 'flex', gap: '1.5rem', fontSize: 13, flexWrap: 'wrap' }}>
                              <div><span style={{ color: 'var(--text-secondary)' }}>Units: </span><strong>{fmtUnits(h.units)}</strong></div>
                              <div><span style={{ color: 'var(--text-secondary)' }}>Price/unit: </span><strong>{fmtPrice(h.pricePerUnit)}</strong></div>
                              <div><span style={{ color: 'var(--text-secondary)' }}>Value: </span><strong style={{ color: 'var(--green)' }}>{fmtUsdc(h.currentValueUsdc)}</strong></div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>Est. Redeemable</p>
                            <p style={{ fontWeight: 800, fontSize: 17, color: 'var(--brand)' }}>{fmtUsdc(h.claimableUsdc)}</p>
                            <button
                              className="btn btn-primary btn-sm"
                              style={{ marginTop: 6 }}
                              onClick={() => setRedeemingToken(h.tokenAddress)}
                              disabled={h.claimableUsdc === 0n || !isKYCVerified}
                            >
                              Redeem Tokens
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Note about rent distribution */}
                <div style={{ background: 'var(--brand-light)', border: '1px solid rgba(26,111,168,0.15)', borderRadius: 8, padding: '0.75rem 1rem', fontSize: 13, color: 'var(--brand)' }}>
                  💡 <strong>Rental income</strong> is deposited by the property manager into each property's treasury. The "Est. Redeemable" value reflects your proportional share of current USDC held.
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Redeem modal */}
      {redeemingHolding && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}>
          <div className="card" style={{ width: 'min(440px, 100%)', borderRadius: 16, padding: '1.5rem' }}>
            <h3 style={{ marginBottom: 8 }}>Redeem Tokens</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
              Redeeming <strong>{fmtUnits(redeemingHolding.units)}</strong> units of <strong>{redeemingHolding.name}</strong>.
              Tokens return to the treasury and you receive USDC.
            </p>
            <div style={{ background: 'var(--brand-light)', borderRadius: 8, padding: '1rem', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Gross value</span>
                <strong>{fmtUsdc(redeemingHolding.claimableUsdc)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-secondary)' }}>You receive (net)</span>
                <strong style={{ color: 'var(--brand)' }}>{fmtUsdc(redeemingHolding.claimableUsdc)}</strong>
              </div>
            </div>
            {redeemSuccess && (
              <p style={{ color: 'var(--green)', fontSize: 13, marginBottom: 12, fontWeight: 700 }}>✓ Redemption submitted successfully!</p>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setRedeemingToken(null)}>Cancel</button>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={handleRedeem}
                disabled={isPending || confirming}
              >
                {isPending || confirming ? 'Confirming…' : 'Confirm Redeem'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
