'use client';

import { useState } from 'react';
import {
  useWriteContract, useWaitForTransactionReceipt,
  useAccount, useChainId, useReadContract, useSwitchChain,
} from 'wagmi';
import { arbitrumSepolia } from 'wagmi/chains';
import { parseUnits, formatUnits } from 'viem';
import { MOCK_PROPOSALS } from '@/lib/mock-data';
import {
  ThumbsUp, ThumbsDown, Plus, Vote,
  ShieldOff, Loader, DollarSign, List, ToggleLeft,
  CheckCircle, AlertCircle, ExternalLink,
} from 'lucide-react';
import {
  ASSET_FACTORY_ABI, ASSET_TOKEN_ABI,
} from '@/lib/contracts/abis';
import { useContractAddresses } from '@/lib/contracts/addresses';
import { useIsAdmin } from '@/lib/hooks/useIsAdmin';
import DeployProperty from '@/components/admin/DeployProperty';


// ─── Shared helpers ──────────────────────────────────────────────────────────
type Tab = 'register' | 'token' | 'vault' | 'properties' | 'governance';

function useTxState() {
  const { writeContract, data: txHash, isPending, error: writeError, reset } = useWriteContract();
  const { isLoading: isMining, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });
  return { writeContract, txHash, isPending, writeError, reset, isMining, isSuccess };
}

function TxFeedback({ isSuccess, writeError, successMsg }: {
  isSuccess: boolean; writeError: Error | null; successMsg: string;
}) {
  if (isSuccess) return (
    <div style={{ background: 'var(--green-bg)', color: 'var(--green)', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: 12, fontSize: 14 }}>
      ✓ {successMsg}
    </div>
  );
  if (writeError) return (
    <div style={{ background: 'var(--red-bg)', color: 'var(--red)', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: 12, fontSize: 14 }}>
      {writeError.message.split('\n')[0]}
    </div>
  );
  return null;
}

// ─── Tab 1: Deployed Assets ─────────────────────────────────────────────────
function DeployedPropertiesTab() {
  const { ASSET_FACTORY } = useContractAddresses();
  const { data: allProperties, isLoading } = useReadContract({
    address: ASSET_FACTORY,
    abi: ASSET_FACTORY_ABI,
    functionName: 'getAllAssets',
    query: { enabled: !!ASSET_FACTORY, refetchInterval: 15000 },
  });

  const props = (allProperties ?? []) as `0x${string}`[];

  return (
    <div className="card" style={{ padding: '1.25rem' }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>📋 Deployed Asset Tokens</h3>
      {isLoading && <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Loading…</p>}
      {!isLoading && props.length === 0 && (
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '1rem', fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center' }}>
          No assets deployed yet. Use the <strong>Deploy Asset</strong> tab.
        </div>
      )}
      {props.map((addr, i) => (
        <div key={addr} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.65rem 0.75rem', borderRadius: 8, background: 'var(--bg-secondary)', marginBottom: 6, fontSize: 13 }}>
          <span style={{ fontWeight: 700, minWidth: 24 }}>#{i + 1}</span>
          <code style={{ flex: 1, fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all' }}>{addr}</code>
          <a href={`https://sepolia.arbiscan.io/address/${addr}`} target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--brand)', fontSize: 11, whiteSpace: 'nowrap' }}>Arbiscan ↗</a>
        </div>
      ))}
      {props.length > 0 && (
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
          {props.length} asset{props.length === 1 ? '' : 's'} deployed · Factory: {ASSET_FACTORY.slice(0,6)}…
        </div>
      )}
    </div>
  );
}

// ─── Tab 2: Token Management ─────────────────────────────────────────────────
function TokenManagementTab() {
  const [tokenAddr, setTokenAddr] = useState('');
  const { writeContract, isPending, writeError, isMining, isSuccess } = useTxState();

  const PROPERTY_TOKEN_ABI_MINI = [
    { inputs: [{ name: 'treasury', type: 'address' }], name: 'activate', outputs: [], stateMutability: 'nonpayable', type: 'function' },
    { inputs: [{ name: 'status', type: 'uint8' }], name: 'setStatus', outputs: [], stateMutability: 'nonpayable', type: 'function' },
    { inputs: [], name: 'propertyStatus', outputs: [{ name: '', type: 'uint8' }], stateMutability: 'view', type: 'function' },
    { inputs: [], name: 'totalSupply', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  ] as const;

  const validAddr = /^0x[0-9a-fA-F]{40}$/.test(tokenAddr);

  const { data: status } = useReadContract({
    address: tokenAddr as `0x${string}`,
    abi: PROPERTY_TOKEN_ABI_MINI,
    functionName: 'propertyStatus',
    query: { enabled: validAddr },
  });

  const { data: totalSupply } = useReadContract({
    address: tokenAddr as `0x${string}`,
    abi: PROPERTY_TOKEN_ABI_MINI,
    functionName: 'totalSupply',
    query: { enabled: validAddr },
  });

  const STATUS_LABELS = ['PENDING', 'ACTIVE', 'PAUSED', 'CLOSED'];
  const [treasury, setTreasury] = useState('');

  const activate = () => {
    if (!/^0x[0-9a-fA-F]{40}$/.test(treasury)) return;
    writeContract({
      address: tokenAddr as `0x${string}`,
      abi: ASSET_TOKEN_ABI,
      functionName: 'activate',
      maxFeePerGas: 100_000_000n,        // 0.1 gwei — prevents baseFee race on Arb Sepolia
      maxPriorityFeePerGas: 1_000_000n,  // 0.001 gwei
      args: [treasury as `0x${string}`],
    });
  };

  const busy = isPending || isMining;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="card" style={{ padding: '1.25rem' }}>
        <label style={{ fontWeight: 600 }}>PropertyToken address</label>
        <input id="token-addr" placeholder="0x… from getAllProperties()" value={tokenAddr}
          onChange={e => setTokenAddr(e.target.value)}
          style={{ fontFamily: 'monospace', fontSize: 13, marginTop: 4 }} />
      </div>

      {validAddr && (
        <>
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Token Status</h3>
            <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
              <div><span style={{ color: 'var(--text-secondary)' }}>Status: </span><strong>{status !== undefined ? STATUS_LABELS[status] ?? status : '…'}</strong></div>
              <div><span style={{ color: 'var(--text-secondary)' }}>Supply: </span><strong>{totalSupply !== undefined ? formatUnits(totalSupply, 18) : '…'}</strong></div>
            </div>
          </div>

          {status === 0 && (
            <div className="card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Activate Token</h3>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>Mints total supply to treasury address and opens trading. Treasury must be KYC-verified.</p>
              <TxFeedback isSuccess={isSuccess} writeError={writeError ?? null} successMsg="Token activated! Supply minted to treasury." />
              <label>Treasury Address (KYC verified)</label>
              <input id="treasury-addr" placeholder="0x…" value={treasury} onChange={e => setTreasury(e.target.value)}
                style={{ fontFamily: 'monospace', fontSize: 13, marginTop: 4, marginBottom: 8 }} />
              <button id="activate-btn" className="btn btn-primary" style={{ width: '100%' }}
                onClick={activate} disabled={busy || !/^0x[0-9a-fA-F]{40}$/.test(treasury)}>
                {busy ? 'Activating…' : '🚀 Activate Asset Token'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Tab 3: Rent & Vault ──────────────────────────────────────────────────────
const VAULT_ABI_MINI = [
  { inputs: [{ name: 'amount', type: 'uint256' }], name: 'receiveRent', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [], name: 'distributeRent', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: 'newValue', type: 'uint256' }, { name: 'notes', type: 'string' }], name: 'updateAppraisal', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  {
    inputs: [],
    name: 'getVaultStats',
    outputs: [
      { name: 'totalDeposited', type: 'uint256' },
      { name: 'totalDistributed', type: 'uint256' },
      { name: 'pendingRent', type: 'uint256' },
      { name: 'currentPropertyValue', type: 'uint256' },
      { name: 'annualRent', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// stub for USDC approve
const ERC20_APPROVE_ABI = [
  { inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], name: 'approve', outputs: [{ name: '', type: 'bool' }], stateMutability: 'nonpayable', type: 'function' },
] as const;

function RentVaultTab() {
  const { USDC } = useContractAddresses();
  const [vaultAddr, setVaultAddr] = useState('');
  const [rentAmt, setRentAmt] = useState('');
  const [appraisalVal, setAppraisalVal] = useState('');
  const [appraisalNote, setAppraisalNote] = useState('');
  const { writeContract, isPending, writeError, isMining, isSuccess } = useTxState();

  const validAddr = /^0x[0-9a-fA-F]{40}$/.test(vaultAddr);
  const busy = isPending || isMining;

  const { data: stats } = useReadContract({
    address: vaultAddr as `0x${string}`,
    abi: VAULT_ABI_MINI,
    functionName: 'getVaultStats',
    query: { enabled: validAddr, refetchInterval: 10000 },
  });

  const [deposited, distributed, pending, propValue, annual] = stats ?? [];

  // Revenue deposit via treasury
  const depositRent = () => {
    if (!rentAmt) return;
    writeContract({ address: vaultAddr as `0x${string}`, abi: VAULT_ABI_MINI, functionName: 'receiveRent', args: [parseUnits(rentAmt, 6)] });
  };

  const distribute = () => writeContract({ address: vaultAddr as `0x${string}`, abi: VAULT_ABI_MINI, functionName: 'distributeRent', args: [] });

  const updateAppraisal = () => {
    if (!appraisalVal) return;
    writeContract({ address: vaultAddr as `0x${string}`, abi: VAULT_ABI_MINI, functionName: 'updateAppraisal', args: [parseUnits(appraisalVal, 6), appraisalNote || 'Manual update'] });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="card" style={{ padding: '1.25rem' }}>
        <label style={{ fontWeight: 600 }}>PropertyVault contract address</label>
        <input id="vault-addr" placeholder="0x..." value={vaultAddr} onChange={e => setVaultAddr(e.target.value)}
          style={{ fontFamily: 'monospace', fontSize: 13, marginTop: 4 }} />
      </div>

      {validAddr && (
        <>
          {/* Vault stats */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Vault Overview</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
              {[
                { label: 'Asset Value', value: propValue !== undefined ? `$${Number(formatUnits(propValue, 6)).toLocaleString()}` : '…' },
                { label: 'Annual Rent',    value: annual    !== undefined ? `$${Number(formatUnits(annual, 6)).toLocaleString()}` : '…' },
                { label: 'Pending',        value: pending   !== undefined ? `$${Number(formatUnits(pending, 6)).toLocaleString()}` : '…' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{s.label}</div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginTop: 2 }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          <TxFeedback isSuccess={isSuccess} writeError={writeError ?? null} successMsg="Transaction confirmed!" />

          {/* Deposit rent */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Deposit Rent (USDC)</h3>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
              Approve USDC first, then deposit. Tenant payments go into the vault for distribution.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input id="rent-amount" type="number" min="1" step="1" placeholder="USDC amount (e.g. 4500)"
                value={rentAmt} onChange={e => setRentAmt(e.target.value)} style={{ flex: 1 }} />
              <button id="approve-usdc-btn" className="btn btn-outline" disabled={busy || !rentAmt}
                onClick={() => writeContract({ address: USDC, abi: ERC20_APPROVE_ABI, functionName: 'approve', args: [vaultAddr as `0x${string}`, parseUnits(rentAmt, 6)] })}>
                1. Approve
              </button>
              <button id="deposit-rent-btn" className="btn btn-primary" disabled={busy || !rentAmt} onClick={depositRent}>
                2. Deposit
              </button>
            </div>
          </div>

          {/* Distribute */}
          <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700 }}>Distribute Rent</h3>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                Pays out pending USDC proportionally to all token holders
              </p>
            </div>
            <button id="distribute-btn" className="btn btn-primary" onClick={distribute} disabled={busy}>
              {busy ? 'Distributing…' : 'Distribute Now'}
            </button>
          </div>

          {/* Appraisal */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Update Asset Valuation</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input id="appraisal-val" type="number" min="1" placeholder="New value in USD (e.g. 550000)"
                value={appraisalVal} onChange={e => setAppraisalVal(e.target.value)} />
              <input id="appraisal-note" placeholder="Notes (e.g. Q1 2024 appraisal)"
                value={appraisalNote} onChange={e => setAppraisalNote(e.target.value)} />
            </div>
            <button id="update-appraisal-btn" className="btn btn-primary" style={{ marginTop: 8 }}
              onClick={updateAppraisal} disabled={busy || !appraisalVal}>
              {busy ? 'Updating…' : 'Update Valuation'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Tab 4: Properties List ───────────────────────────────────────────────────
const FACTORY_READ_ABI = [
  { inputs: [], name: 'propertyCount', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: 'propertyId', type: 'uint256' }], name: 'properties', outputs: [
    { name: 'id', type: 'uint256' }, { name: 'securityToken', type: 'address' },
    { name: 'propertyVault', type: 'address' }, { name: 'governance', type: 'address' },
    { name: 'tokenSale', type: 'address' }, { name: 'propertyManager', type: 'address' },
    { name: 'metadataURI', type: 'string' }, { name: 'createdAt', type: 'uint256' }, { name: 'active', type: 'bool' },
  ], stateMutability: 'view', type: 'function' },
] as const;

function PropertiesListTab() {
  const { ASSET_FACTORY } = useContractAddresses();
  const { data: count } = useReadContract({
    address: ASSET_FACTORY,
    abi: ASSET_FACTORY_ABI,
    functionName: 'totalAssets',
    query: { refetchInterval: 15000 },
  });

  const ids = count !== undefined ? Array.from({ length: Number(count) }, (_, i) => i) : [];

  return (
    <div className="card" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700 }}>Registered Properties</h3>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{count !== undefined ? `${Number(count)} total` : '…'}</span>
      </div>

      {ids.length === 0 && count !== undefined && (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontSize: 14 }}>
          No properties registered yet. Use the Register tab to add the first one.
        </div>
      )}

      {ids.map(id => (
        <PropertyRow key={id} id={id} factoryAddr={ASSET_FACTORY} />
      ))}
    </div>
  );
}

function PropertyRow({ id, factoryAddr }: { id: number; factoryAddr: `0x${string}` }) {
  const { data } = useReadContract({
    address: factoryAddr,
    abi: FACTORY_READ_ABI,
    functionName: 'properties',
    args: [BigInt(id)],
  });

  if (!data) return (
    <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)', fontSize: 13, color: 'var(--text-secondary)' }}>Loading asset {id}…</div>
  );

  const [pid, token, vault, gov, sale, manager, uri, createdAt, active] = data;
  const short = (addr: string) => `${addr.slice(0, 6)}…${addr.slice(-4)}`;
  const scanBase = 'https://sepolia.arbiscan.io/address/';

  return (
    <div style={{ padding: '0.85rem 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ fontWeight: 700, fontSize: 15 }}>Asset #{Number(pid)}</span>
        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: active ? 'var(--green-bg)' : 'var(--red-bg)', color: active ? 'var(--green)' : 'var(--red)' }}>
          {active ? 'Active' : 'Inactive'}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginLeft: 'auto' }}>
          {new Date(Number(createdAt) * 1000).toLocaleDateString()}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 4, fontSize: 12 }}>
        {[['Token', token], ['Vault', vault], ['Governance', gov], ['TokenSale', sale]].map(([label, addr]) => (
          <div key={label as string}>
            <span style={{ color: 'var(--text-secondary)' }}>{label}: </span>
            <a href={`${scanBase}${addr}`} target="_blank" rel="noopener noreferrer"
              style={{ fontFamily: 'monospace', color: 'var(--brand)' }}>{short(addr as string)}</a>
          </div>
        ))}
      </div>
      {uri && <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-secondary)', wordBreak: 'break-all' }}>{uri}</div>}
    </div>
  );
}

// ─── Tab 5: Governance ───────────────────────────────────────────────────────
function GovernanceTab() {
  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Active Proposals</h3>
      {MOCK_PROPOSALS.length === 0
        ? <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontSize: 14 }}>No active proposals.</div>
        : MOCK_PROPOSALS.map((p) => (
          <div key={p.id} style={{ padding: '0.85rem 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{p.title}</span>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Ends {p.endDate}</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 8px' }}>{p.description}</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-outline" style={{ fontSize: 12, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 4 }}>
                <ThumbsUp size={12} /> For ({p.votesFor}%)
              </button>
              <button className="btn btn-outline" style={{ fontSize: 12, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 4 }}>
                <ThumbsDown size={12} /> Against ({p.votesAgainst}%)
              </button>
            </div>
          </div>
        ))}
    </div>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────
const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'register',   label: 'Deploy Asset',      icon: <Plus size={14} /> },
  { id: 'token',       label: 'Token Management',   icon: <ToggleLeft size={14} /> },
  { id: 'vault',      label: 'Rent & Vault',       icon: <DollarSign size={14} /> },
  { id: 'properties', label: 'Properties',         icon: <List size={14} /> },
  { id: 'governance', label: 'Governance',         icon: <Vote size={14} /> },
];

export default function AdminPage() {
  const { isAdmin, isLoading } = useIsAdmin();
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [tab, setTab] = useState<Tab>('register');

  const isWrongChain = isConnected && chainId !== arbitrumSepolia.id;

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 10, color: 'var(--text-secondary)' }}>
      <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
      <span>Verifying admin access…</span>
    </div>
  );
  if (!isConnected) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12 }}>
      <ShieldOff size={40} color="var(--text-secondary)" />
      <h2 style={{ fontSize: 20 }}>Wallet not connected</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Connect the admin wallet to access this page.</p>
    </div>
  );
  if (!isAdmin) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12 }}>
      <ShieldOff size={40} color="var(--red)" />
      <h2 style={{ fontSize: 20 }}>Access Denied</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>This page is restricted to the PropertyFactory owner wallet.</p>
    </div>
  );

  return (
    <section className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Admin Panel</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
          Manage assets, token activation, and revenue distribution on Arbitrum Sepolia
        </p>
      </div>

      {/* ── Wrong network banner ─────────────────────────────────────── */}
      {isWrongChain && (
        <div style={{
          background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 8,
          padding: '0.75rem 1rem', marginBottom: '1.25rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#92400e' }}>
            ⚠️ Wrong network — contracts are on Arbitrum Sepolia (421614). You are on chain {chainId}.
          </span>
          <button
            className="btn btn-sm"
            style={{ background: '#f59e0b', color: '#fff', border: 'none', whiteSpace: 'nowrap' }}
            onClick={() => switchChain({ chainId: arbitrumSepolia.id })}
          >
            Switch Network
          </button>
        </div>
      )}

      {/* Tab bar */}
      <div className="tab-bar" style={{ display: 'flex', gap: 4, marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
              background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              color: tab === t.id ? 'var(--brand)' : 'var(--text-secondary)',
              borderBottom: tab === t.id ? '2px solid var(--brand)' : '2px solid transparent',
              marginBottom: -1,
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'register'   && <DeployProperty />}
      {tab === 'token'       && <TokenManagementTab />}
      {tab === 'vault'      && <RentVaultTab />}
      {tab === 'properties' && <PropertiesListTab />}
      {tab === 'governance' && <GovernanceTab />}
    </section>
  );
}
