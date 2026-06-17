'use client';

import { useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { useContractAddresses } from '@/lib/contracts/addresses';
import { USDC_ABI } from '@/lib/contracts/abis';
import { 
  useAllBatches, 
  useMyAllocations, 
  useIsMyProducer, 
  usePurchaseAllocation, 
  useRedeemAllocation, 
  useRequestRefund, 
  useCommitProduction, 
  useCompleteProduction, 
  useCancelUnsoldAllocation, 
  useCancelBatch, 
  useApproveGBPT,
  ProductionBatch
} from '@/lib/hooks/useHydroAsset';
import { 
  Layers, Plus, CheckCircle, Clock, Trash2, ArrowRight, ShieldCheck, 
  AlertTriangle, DollarSign, Sparkles, RefreshCw, ClipboardList, Info
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtGBPT(raw: bigint): string {
  return `£${(Number(raw) / 1e6).toFixed(2)}`;
}

function fmtDate(raw: bigint): string {
  if (raw === 0n) return 'N/A';
  return new Date(Number(raw) * 1000).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function calculateStorageFee(batch: ProductionBatch, quantity: bigint): bigint {
  if (!batch.isCompleted || batch.completionTime === 0n) return 0n;
  const now = BigInt(Math.floor(Date.now() / 1000));
  const overstayDeadline = batch.completionTime + batch.redemptionWindow;
  if (now <= overstayDeadline) return 0n;
  
  const overdueSeconds = now - overstayDeadline;
  const oneDay = 86400n;
  return (quantity * batch.storageFeePerKgPerDay * overdueSeconds) / oneDay;
}

export default function HydroMarketplacePage() {
  const { address: walletAddress, isConnected } = useAccount();
  const { HYDRO_ASSET, USDC } = useContractAddresses();
  const [activeTab, setActiveTab] = useState<'market' | 'portfolio' | 'producer'>('market');

  // ── Smart Contract Data ──
  const { batches, isLoading: loadingBatches, refetch: refetchBatches } = useAllBatches();
  const { allocations, isLoading: loadingAllocations, refetch: refetchAllocations } = useMyAllocations(batches);
  const { isProducer: isWhitelistedProducer, isLoading: loadingProducerStatus } = useIsMyProducer();

  // Read Buyer's GBPT Balance
  const { data: gbptBalance, refetch: refetchBalance } = useReadContract({
    address: USDC,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: walletAddress ? [walletAddress] : undefined,
    query: { enabled: !!walletAddress }
  });

  // ── Mutators ──
  const { approve, isPending: pendingApprove, isConfirming: confirmingApprove } = useApproveGBPT();
  const { purchase, isPending: pendingPurchase, isConfirming: confirmingPurchase } = usePurchaseAllocation();
  const { redeem, isPending: pendingRedeem, isConfirming: confirmingRedeem } = useRedeemAllocation();
  const { refund, isPending: pendingRefund, isConfirming: confirmingRefund } = useRequestRefund();
  const { commit, isPending: pendingCommit, isConfirming: confirmingCommit } = useCommitProduction();
  const { complete, isPending: pendingComplete, isConfirming: confirmingComplete } = useCompleteProduction();
  const { cancelUnsold, isPending: pendingCancelUnsold, isConfirming: confirmingCancelUnsold } = useCancelUnsoldAllocation();
  const { cancel: cancelBatch, isPending: pendingCancel, isConfirming: confirmingCancel } = useCancelBatch();

  // ── Form States ──
  const [purchaseQty, setPurchaseQty] = useState<Record<number, string>>({});
  const [newBatch, setNewBatch] = useState({
    capacity: '1000',
    priceProducer: '5',
    priceSale: '6',
    deadlineDays: '7',
    estimateDays: '30',
    redemptionDays: '30',
    storageFee: '0.10'
  });

  const handleRefresh = async () => {
    await refetchBatches();
    await refetchAllocations();
    await refetchBalance();
  };

  const handleApprove = (priceSale: bigint, qty: bigint) => {
    approve(priceSale * qty);
  };

  const handlePurchase = (batchId: number, salePricePerKg: bigint) => {
    const qtyStr = purchaseQty[batchId];
    if (!qtyStr || isNaN(Number(qtyStr))) return;
    const qty = BigInt(qtyStr);
    purchase(batchId, qty);
  };

  const handleCommitBatch = (e: React.FormEvent) => {
    e.preventDefault();
    const totalKg = BigInt(newBatch.capacity);
    const pricePerKg = BigInt(parseFloat(newBatch.priceProducer) * 1e6);
    const salePricePerKg = BigInt(parseFloat(newBatch.priceSale) * 1e6);
    
    const nowSecs = BigInt(Math.floor(Date.now() / 1000));
    const purchaseDeadline = nowSecs + BigInt(parseInt(newBatch.deadlineDays) * 86400);
    const deliveryEstimate = nowSecs + BigInt(parseInt(newBatch.estimateDays) * 86400);
    const redemptionWindow = BigInt(parseInt(newBatch.redemptionDays) * 86400);
    const storageFeePerKgPerDay = BigInt(parseFloat(newBatch.storageFee) * 1e6);

    commit(
      totalKg,
      pricePerKg,
      salePricePerKg,
      purchaseDeadline,
      deliveryEstimate,
      redemptionWindow,
      storageFeePerKgPerDay
    );
  };

  // State checks for UI
  const isPendingTx = pendingApprove || confirmingApprove || pendingPurchase || confirmingPurchase || 
                      pendingRedeem || confirmingRedeem || pendingRefund || confirmingRefund ||
                      pendingCommit || confirmingCommit || pendingComplete || confirmingComplete ||
                      pendingCancelUnsold || confirmingCancelUnsold || pendingCancel || confirmingCancel;

  return (
    <div style={{ minHeight: '90vh', background: 'var(--bg)', paddingBottom: '4rem' }}>
      {/* Premium Glassmorphic Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.9) 0%, rgba(17, 24, 39, 0.95) 100%)', 
        borderBottom: '1px solid rgba(16, 185, 129, 0.2)', 
        padding: '3rem 0',
        color: '#fff',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span className="badge badge-green" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '4px 10px', fontSize: 11, fontWeight: 700 }}>
                <Sparkles size={11} style={{ marginRight: 4 }} /> Pre-Purchase Allocation
              </span>
              {HYDRO_ASSET !== '0x0000000000000000000000000000000000000000' && (
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Contract: {HYDRO_ASSET.slice(0, 6)}...{HYDRO_ASSET.slice(-4)}</span>
              )}
            </div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>Hydrogen Allocation Marketplace</h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, marginTop: 6, maxWidth: 650 }}>
              Secure future green hydrogen supply at guaranteed fixed rates. 
              The platform acts as the trusted commercial layer between clean producers and industrial buyers.
            </p>
          </div>
          
          <div style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '1.25rem 1.5rem', minWidth: 240 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>YOUR LEDGER BALANCE</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981', marginTop: 4 }}>
              {gbptBalance !== undefined ? fmtGBPT(gbptBalance as bigint) : '£0.00'}
            </div>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Asset Ledger Token (GBPT)</span>
          </div>
        </div>
      </div>

      {/* Tabs and Controls */}
      <div className="container" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              className={`btn btn-sm ${activeTab === 'market' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('market')}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Layers size={14} /> Production Batches
            </button>
            <button 
              className={`btn btn-sm ${activeTab === 'portfolio' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('portfolio')}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <ClipboardList size={14} /> My Allocations
            </button>
            {(isWhitelistedProducer || walletAddress === undefined) && (
              <button 
                className={`btn btn-sm ${activeTab === 'producer' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setActiveTab('producer')}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Plus size={14} /> Producer Portal
              </button>
            )}
          </div>

          <button 
            className="btn btn-outline btn-sm" 
            onClick={handleRefresh}
            disabled={isPendingTx}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={12} className={isPendingTx ? 'spin-anim' : ''} /> Refresh Ledger
          </button>
        </div>

        {/* Info Banner */}
        <div style={{ background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '2rem', display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 13 }}>
          <Info size={18} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ color: '#0f766e' }}>
            <strong>How the Pre-Purchase Model works:</strong> Whitelisted producers commit future hydrogen capacity. 
            Buyers buy allocations (represented by ERC1155 tokens) at a fixed sale price. 
            Upon production completion, buyers redeem allocations to receive hydrogen. 
            If redemption occurs after the 30-day window, overstay storage fees apply in GBPT.
          </div>
        </div>

        {/* ── Tab 1: Marketplace (Production Batches) ── */}
        {activeTab === 'market' && (
          <div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              Active Pre-Purchase Offerings
            </h2>
            {loadingBatches ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading batches from contract...</div>
            ) : batches.length === 0 ? (
              <div style={{ padding: '4rem', textAlign: 'center', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 12 }}>
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No active hydrogen production batches available.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 24 }}>
                {batches.map(b => {
                  const now = BigInt(Math.floor(Date.now() / 1000));
                  const isExpired = now > b.purchaseDeadline;
                  const soldPct = b.totalKg > 0n ? Math.min(100, Number((b.totalSold * 100n) / b.totalKg)) : 0;
                  const isSoldOut = b.totalSold >= b.totalKg;
                  const canBuy = !b.isCompleted && !b.isCancelled && !isExpired && !isSoldOut;

                  return (
                    <div key={b.id} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', background: 'linear-gradient(to bottom, rgba(16,185,129,0.03), transparent)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>BATCH #{b.id}</span>
                          {b.isCompleted ? (
                            <span className="badge badge-green">Production Complete</span>
                          ) : b.isCancelled ? (
                            <span className="badge badge-red">Cancelled</span>
                          ) : isExpired ? (
                            <span className="badge badge-yellow">Closed</span>
                          ) : (
                            <span className="badge badge-blue">Accepting Pre-Purchase</span>
                          )}
                        </div>
                        <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700 }}>{fmtDate(b.deliveryEstimate)} Delivery</h3>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>Producer: {b.producer.slice(0, 8)}...{b.producer.slice(-6)}</p>
                      </div>

                      <div style={{ padding: '1.5rem', flexGrow: 1 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                          <div>
                            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Pre-Purchase Price</span>
                            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--brand)' }}>{fmtGBPT(b.salePricePerKg)} <span style={{ fontSize: 11, fontWeight: 400 }}>/ kg</span></div>
                          </div>
                          <div>
                            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Overstay Storage Fee</span>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--red)' }}>{fmtGBPT(b.storageFeePerKgPerDay)} <span style={{ fontSize: 11, fontWeight: 400 }}>/ kg / day</span></div>
                          </div>
                        </div>

                        {/* Progress */}
                        <div style={{ marginBottom: 20 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Capacity Allocated</span>
                            <span style={{ fontWeight: 700 }}>{b.totalSold.toString()} / {b.totalKg.toString()} kg</span>
                          </div>
                          <div className="progress-bar" style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                            <div className="progress-fill" style={{ width: `${soldPct}%`, background: '#10b981', height: '100%' }} />
                          </div>
                        </div>

                        {/* Terms */}
                        <div style={{ fontSize: 12, background: 'var(--bg)', borderRadius: 8, padding: '10px 12px', color: 'var(--text-secondary)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span>Pre-purchase ends:</span>
                            <span style={{ fontWeight: 600, color: 'var(--text)' }}>{fmtDate(b.purchaseDeadline)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Redemption Window:</span>
                            <span style={{ fontWeight: 600, color: 'var(--text)' }}>{Number(b.redemptionWindow) / 86400} Days</span>
                          </div>
                        </div>
                      </div>

                      {/* Buy Form */}
                      {canBuy && (
                        <div style={{ padding: '1.25rem 1.5rem', background: 'var(--bg)', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center' }}>
                          <input 
                            type="number"
                            placeholder="Qty (kg)"
                            value={purchaseQty[b.id] ?? ''}
                            onChange={e => setPurchaseQty(p => ({ ...p, [b.id]: e.target.value }))}
                            style={{ width: 90, padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', fontSize: 13 }}
                          />
                          <div style={{ display: 'flex', gap: 6, flexGrow: 1 }}>
                            <button 
                              className="btn btn-outline btn-sm"
                              onClick={() => handleApprove(b.salePricePerKg, BigInt(purchaseQty[b.id] || '0'))}
                              disabled={isPendingTx || !purchaseQty[b.id]}
                              style={{ flex: 1, fontSize: 11 }}
                            >
                              Approve
                            </button>
                            <button 
                              className="btn btn-primary btn-sm"
                              onClick={() => handlePurchase(b.id, b.salePricePerKg)}
                              disabled={isPendingTx || !purchaseQty[b.id]}
                              style={{ flex: 2, fontSize: 11 }}
                            >
                              Pre-Purchase
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Tab 2: Portfolio (My Allocations) ── */}
        {activeTab === 'portfolio' && (
          <div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Your Hydrogen Pre-Purchase Allocations</h2>
            {loadingAllocations ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Checking ledger for tokens...</div>
            ) : allocations.length === 0 ? (
              <div style={{ padding: '4rem', textAlign: 'center', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 12 }}>
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>You do not own any hydrogen allocations. Purchase allocations in the marketplace tab.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 24 }}>
                {allocations.map(a => {
                  const b = a.batch;
                  const storageFee = calculateStorageFee(b, a.balance);
                  
                  const now = BigInt(Math.floor(Date.now() / 1000));
                  const isPastRefundEstimate = now > b.deliveryEstimate + (60n * 86400n);
                  const canRefund = !b.isCompleted && (b.isCancelled || isPastRefundEstimate);

                  let statusText = 'Pending Delivery';
                  let statusCls = 'badge-yellow';
                  if (b.isCompleted) {
                    const overstayDeadline = b.completionTime + b.redemptionWindow;
                    if (now > overstayDeadline) {
                      statusText = 'Overdue - Storage Fees Accruing';
                      statusCls = 'badge-red';
                    } else {
                      statusText = 'Ready to Redeem';
                      statusCls = 'badge-green';
                    }
                  } else if (b.isCancelled) {
                    statusText = 'Producer Cancelled (Refund Ready)';
                    statusCls = 'badge-red';
                  }

                  return (
                    <div key={b.id} className="card" style={{ display: 'flex', flexDirection: 'column', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)' }}>
                      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', background: 'linear-gradient(to bottom, rgba(16,185,129,0.03), transparent)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>BATCH #{b.id} ALLOCATION</span>
                          <span className={`badge ${statusCls}`}>{statusText}</span>
                        </div>
                        <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800, color: 'var(--brand)' }}>
                          {a.balance.toString()} kg Hydrogen
                        </h3>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>Producer: {b.producer.slice(0, 8)}...{b.producer.slice(-6)}</p>
                      </div>

                      <div style={{ padding: '1.5rem', flexGrow: 1 }}>
                        <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Delivery Estimate:</span>
                            <span style={{ fontWeight: 600 }}>{fmtDate(b.deliveryEstimate)}</span>
                          </div>
                          {b.isCompleted && (
                            <>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Completed On:</span>
                                <span style={{ fontWeight: 600 }}>{fmtDate(b.completionTime)}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Redemption Limit:</span>
                                <span style={{ fontWeight: 600 }}>{fmtDate(b.completionTime + b.redemptionWindow)}</span>
                              </div>
                            </>
                          )}
                          {storageFee > 0n && (
                            <div style={{ background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 8, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ color: 'var(--red)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <AlertTriangle size={14} /> Accrued Storage Fee:
                              </span>
                              <span style={{ color: 'var(--red)', fontWeight: 800 }}>{fmtGBPT(storageFee)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ padding: '1.25rem 1.5rem', background: 'var(--bg)', borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
                        {b.isCompleted && (
                          <>
                            {storageFee > 0n && (
                              <button
                                className="btn btn-outline btn-sm"
                                onClick={() => approve(storageFee)}
                                disabled={isPendingTx}
                                style={{ flex: 1 }}
                              >
                                Approve Storage Fee
                              </button>
                            )}
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => redeem(b.id, a.balance)}
                              disabled={isPendingTx}
                              style={{ flex: 2 }}
                            >
                              Redeem Hydrogen
                            </button>
                          </>
                        )}
                        
                        {canRefund && (
                          <button
                            className="btn btn-red btn-sm"
                            onClick={() => refund(b.id, a.balance)}
                            disabled={isPendingTx}
                            style={{ width: '100%' }}
                          >
                            Claim Delivery Refund
                          </button>
                        )}

                        {!b.isCompleted && !canRefund && (
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center', width: '100%', fontStyle: 'italic', padding: '4px 0' }}>
                            Allocation locked until producer completes delivery
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Tab 3: Producer Portal ── */}
        {activeTab === 'producer' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 32, alignItems: 'start' }}>
              
              {/* Batch Commit Form */}
              <div className="card" style={{ padding: '1.75rem', borderRadius: 14, border: '1px solid var(--border)' }}>
                <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.25rem', fontWeight: 800 }}>Commit Production Batch</h3>
                <form onSubmit={handleCommitBatch} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>BATCH CAPACITY (KG)</label>
                    <input 
                      type="number"
                      required
                      value={newBatch.capacity}
                      onChange={e => setNewBatch(nb => ({ ...nb, capacity: e.target.value }))}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>PRODUCER COST (£/KG)</label>
                      <input 
                        type="number"
                        step="0.01"
                        required
                        value={newBatch.priceProducer}
                        onChange={e => setNewBatch(nb => ({ ...nb, priceProducer: e.target.value }))}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>MARKET SALE (£/KG)</label>
                      <input 
                        type="number"
                        step="0.01"
                        required
                        value={newBatch.priceSale}
                        onChange={e => setNewBatch(nb => ({ ...nb, priceSale: e.target.value }))}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff' }}
                      />
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>SALE RUNWAY (DAYS)</label>
                      <input 
                        type="number"
                        required
                        value={newBatch.deadlineDays}
                        onChange={e => setNewBatch(nb => ({ ...nb, deadlineDays: e.target.value }))}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>DELIVERY (DAYS)</label>
                      <input 
                        type="number"
                        required
                        value={newBatch.estimateDays}
                        onChange={e => setNewBatch(nb => ({ ...nb, estimateDays: e.target.value }))}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>REDEMPTION LIMIT</label>
                      <input 
                        type="number"
                        required
                        value={newBatch.redemptionDays}
                        onChange={e => setNewBatch(nb => ({ ...nb, redemptionDays: e.target.value }))}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>STORAGE OVERSTAY FEE</label>
                      <input 
                        type="number"
                        step="0.01"
                        required
                        value={newBatch.storageFee}
                        onChange={e => setNewBatch(nb => ({ ...nb, storageFee: e.target.value }))}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff' }}
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={isPendingTx}
                    style={{ marginTop: 10, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}
                  >
                    <Plus size={16} /> Commit to Marketplace
                  </button>
                </form>
              </div>

              {/* Producer Batches List */}
              <div>
                <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.25rem', fontWeight: 800 }}>Your Production Batches</h3>
                
                {batches.filter(b => b.producer.toLowerCase() === walletAddress?.toLowerCase()).length === 0 ? (
                  <div style={{ padding: '3rem', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 12, textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No batches registered under your wallet address.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {batches.filter(b => b.producer.toLowerCase() === walletAddress?.toLowerCase()).map(b => {
                      const now = BigInt(Math.floor(Date.now() / 1000));
                      const isExpired = now > b.purchaseDeadline;
                      const hasUnsold = b.totalKg > b.totalSold;

                      return (
                        <div key={b.id} className="card" style={{ padding: '1.25rem 1.5rem', borderRadius: 12, border: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <div>
                              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>BATCH #{b.id}</span>
                              <h4 style={{ margin: '2px 0 0', fontSize: 15 }}>Estimate: {fmtDate(b.deliveryEstimate)}</h4>
                            </div>
                            <div>
                              {b.isCompleted ? (
                                <span className="badge badge-green">Delivered</span>
                              ) : b.isCancelled ? (
                                <span className="badge badge-red">Cancelled</span>
                              ) : (
                                <span className="badge badge-blue">In Production</span>
                              )}
                            </div>
                          </div>

                          <div style={{ fontSize: 13, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                            <div>
                              <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: 11 }}>Sold:</span>
                              <span style={{ fontWeight: 700 }}>{b.totalSold.toString()} kg</span>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: 11 }}>Total Capacity:</span>
                              <span style={{ fontWeight: 700 }}>{b.totalKg.toString()} kg</span>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: 11 }}>Producer Share:</span>
                              <span style={{ fontWeight: 700, color: 'var(--brand)' }}>{fmtGBPT(b.pricePerKg)} / kg</span>
                            </div>
                          </div>

                          {/* Producer Actions */}
                          {!b.isCompleted && !b.isCancelled && (
                            <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => complete(b.id)}
                                disabled={isPendingTx}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flex: 2 }}
                              >
                                <CheckCircle size={13} /> Complete Delivery
                              </button>
                              
                              {isExpired && hasUnsold && (
                                <button
                                  className="btn btn-outline btn-sm"
                                  onClick={() => cancelUnsold(b.id)}
                                  disabled={isPendingTx}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flex: 1 }}
                                >
                                  Cancel Unsold
                                </button>
                              )}

                              <button
                                className="btn btn-red btn-sm"
                                onClick={() => cancelBatch(b.id)}
                                disabled={isPendingTx}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
