'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';
import { Wallet, LogOut, ChevronDown, X, Zap } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

const WC_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ||
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
  'dfbac420794354bf67363ec253e924c4';

const CONNECTORS = [
  {
    id: 'injected',
    label: 'MetaMask',
    desc: 'Connect with browser extension',
    icon: '🦊',
    fn: injected(),
  },
  {
    id: 'walletConnect',
    label: 'WalletConnect',
    desc: 'Scan QR code with any wallet',
    icon: '🔗',
    fn: walletConnect({ projectId: WC_PROJECT_ID }),
  },
  {
    id: 'coinbaseWallet',
    label: 'Coinbase Wallet',
    desc: 'Connect with Coinbase Wallet app',
    icon: '🔵',
    fn: coinbaseWallet({ appName: 'AssetsGrator' }),
  },
];

export default function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [showModal, setShowModal] = useState(false);
  const [showMenu, setShowMenu]   = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const short = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : '';

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close modal on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowModal(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleConnect = async (c: typeof CONNECTORS[0]) => {
    setConnecting(c.id);
    connect({ connector: c.fn });
    setTimeout(() => {
      setConnecting(null);
      setShowModal(false);
    }, 1500);
  };

  /* ── Disconnected: CTA button ───────────────────────────────────────── */
  if (!isConnected) {
    return (
      <>
        <button
          id="connect-wallet-btn"
          onClick={() => setShowModal(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            padding: '0.5rem 1.1rem',
            borderRadius: 999,
            border: 'none',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 700,
            background: 'linear-gradient(135deg, var(--brand) 0%, #0ea5e9 100%)',
            color: '#fff',
            boxShadow: '0 2px 12px rgba(26,111,168,0.35)',
            transition: 'transform 0.15s, box-shadow 0.15s',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(26,111,168,0.45)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 12px rgba(26,111,168,0.35)';
          }}
        >
          <Wallet size={14} />
          Connect
        </button>

        {/* ── Modal overlay ───────────────────────────────────────────── */}
        {showModal && (
          <div
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 300, padding: '1rem',
            }}
            onClick={() => setShowModal(false)}
          >
            <div
              style={{
                background: '#fff',
                borderRadius: 20,
                width: 'min(400px, 100%)',
                overflow: 'hidden',
                boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
                animation: 'slideUp 0.2s ease',
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal header with gradient */}
              <div style={{
                background: 'linear-gradient(135deg, var(--brand) 0%, #0ea5e9 100%)',
                padding: '1.5rem 1.5rem 1.25rem',
                position: 'relative',
              }}>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    position: 'absolute', top: 14, right: 14,
                    background: 'rgba(255,255,255,0.2)', border: 'none',
                    borderRadius: '50%', width: 30, height: 30,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#fff',
                  }}
                >
                  <X size={15} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div style={{
                    background: 'rgba(255,255,255,0.25)', borderRadius: 10,
                    padding: '5px 7px', display: 'flex', alignItems: 'center',
                  }}>
                    <Zap size={18} color="#fff" />
                  </div>
                  <h3 style={{ margin: 0, fontSize: 18, color: '#fff', fontWeight: 800 }}>
                    Connect Wallet
                  </h3>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
                  Choose your wallet to access AssetsGrator
                </p>
              </div>

              {/* Wallet options */}
              <div style={{ padding: '1rem' }}>
                {CONNECTORS.map(c => (
                  <button
                    key={c.id}
                    id={`connect-${c.id}`}
                    disabled={connecting === c.id}
                    onClick={() => handleConnect(c)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      width: '100%', padding: '0.875rem 1rem',
                      borderRadius: 12, border: '1.5px solid var(--border)',
                      background: connecting === c.id ? 'var(--brand-light)' : '#fff',
                      cursor: connecting === c.id ? 'wait' : 'pointer',
                      marginBottom: 8, transition: 'all 0.15s', textAlign: 'left',
                    }}
                    onMouseEnter={e => {
                      if (connecting !== c.id) {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--brand)';
                        (e.currentTarget as HTMLButtonElement).style.background = 'var(--brand-light)';
                        (e.currentTarget as HTMLButtonElement).style.transform = 'translateX(3px)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (connecting !== c.id) {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
                        (e.currentTarget as HTMLButtonElement).style.background = '#fff';
                        (e.currentTarget as HTMLButtonElement).style.transform = 'translateX(0)';
                      }
                    }}
                  >
                    <span style={{ fontSize: 26, lineHeight: 1 }}>{c.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                        {c.label}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 1 }}>
                        {connecting === c.id ? 'Connecting…' : c.desc}
                      </div>
                    </div>
                    {connecting === c.id && (
                      <div style={{
                        width: 16, height: 16, borderRadius: '50%',
                        border: '2px solid var(--brand)', borderTopColor: 'transparent',
                        animation: 'spin 0.7s linear infinite',
                      }} />
                    )}
                  </button>
                ))}
              </div>

              <p style={{
                textAlign: 'center', fontSize: 11, color: 'var(--text-secondary)',
                padding: '0 1rem 1rem', margin: 0,
              }}>
                By connecting you agree to our{' '}
                <a href="#" style={{ color: 'var(--brand)' }}>Terms of Service</a>
              </p>
            </div>
          </div>
        )}

        <style>{`
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px) scale(0.97); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </>
    );
  }

  /* ── Connected: address pill ────────────────────────────────────────── */
  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        id="wallet-address-btn"
        onClick={() => setShowMenu(o => !o)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          padding: '0.45rem 0.95rem', borderRadius: 999,
          border: '1.5px solid var(--brand)', background: 'var(--brand-light)',
          color: 'var(--brand)', cursor: 'pointer', fontSize: 13, fontWeight: 700,
          transition: 'background 0.15s',
        }}
      >
        {/* Green dot */}
        <span style={{
          width: 7, height: 7, borderRadius: '50%',
          background: '#22c55e', flexShrink: 0,
          boxShadow: '0 0 0 2px rgba(34,197,94,0.25)',
        }} />
        {short}
        <ChevronDown size={13} style={{ opacity: 0.7 }} />
      </button>

      {showMenu && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 8px)',
          background: '#fff', border: '1px solid var(--border)',
          borderRadius: 12, padding: '0.5rem',
          minWidth: 180, boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          zIndex: 200, animation: 'slideUp 0.15s ease',
        }}>
          <div style={{
            padding: '0.5rem 0.75rem 0.75rem',
            borderBottom: '1px solid var(--border)', marginBottom: '0.4rem',
          }}>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, margin: 0 }}>
              CONNECTED
            </p>
            <p style={{ fontSize: 13, fontWeight: 700, margin: '2px 0 0', fontFamily: 'monospace' }}>
              {short}
            </p>
          </div>
          <button
            id="disconnect-wallet-btn"
            onClick={() => { disconnect(); setShowMenu(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              width: '100%', padding: '0.6rem 0.75rem',
              borderRadius: 8, border: 'none', background: 'none',
              cursor: 'pointer', fontSize: 13, fontWeight: 600,
              color: 'var(--red)', transition: 'background 0.1s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--red-bg)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <LogOut size={14} /> Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
