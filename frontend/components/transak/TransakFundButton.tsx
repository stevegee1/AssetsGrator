'use client';

import { useEffect, useRef, useState } from 'react';
import { useAccount } from 'wagmi';
import { Transak } from '@transak/ui-js-sdk';
import { Wallet, Loader2 } from 'lucide-react';

interface Props {
  /** Optional override — defaults to connected wallet */
  walletAddress?: string;
  /** Fiat currency. Defaults to GBP */
  fiatCurrency?: 'GBP' | 'USD' | 'EUR';
  /** Pre-fill amount */
  defaultFiatAmount?: number;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export default function TransakFundButton({
  walletAddress: propWallet,
  fiatCurrency = 'GBP',
  defaultFiatAmount = 50,
  className,
  style,
  children,
}: Props) {
  const { address } = useAccount();
  const wallet      = propWallet ?? address;
  const transakRef  = useRef<InstanceType<typeof Transak> | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      transakRef.current?.close();
    };
  }, []);

  const openWidget = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      // Get a fresh one-time widgetUrl from our backend every click
      const res = await fetch('/api/transak/widget-url', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: wallet, fiatCurrency, defaultFiatAmount }),
      });

      if (!res.ok) throw new Error('Could not initialise payment widget');
      const { widgetUrl } = await res.json();

      // Close any existing instance before creating a new one
      transakRef.current?.close();

      const transak = new Transak({ widgetUrl });
      transakRef.current = transak;

      transak.init();

      Transak.on(Transak.EVENTS.TRANSAK_WIDGET_CLOSE, () => {
        setLoading(false);
      });

      Transak.on(Transak.EVENTS.TRANSAK_ORDER_SUCCESSFUL, (data) => {
        console.log('[Transak] Order successful:', data);
        transak.close();
        setLoading(false);
      });

      Transak.on(Transak.EVENTS.TRANSAK_ORDER_CREATED, (data) => {
        console.log('[Transak] Order created:', data);
      });

    } catch (err) {
      console.error('[Transak]', err);
      setError('Payment widget failed to open. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={openWidget}
        disabled={loading}
        className={className ?? 'btn btn-primary'}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, opacity: loading ? 0.75 : 1, ...style }}
      >
        {loading
          ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Processing…</>
          : <><Wallet size={15} /> {children ?? 'Fund Wallet'}</>
        }
      </button>
      {error && (
        <p style={{ fontSize: 12, color: 'var(--red)', marginTop: 6 }}>{error}</p>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
