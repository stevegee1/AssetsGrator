'use client';

import { WagmiProvider, createConfig, http } from 'wagmi';
import { arbitrumSepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';
import { parseGwei } from 'viem';

const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL ||
  'https://sepolia-rollup.arbitrum.io/rpc'; // public fallback

const config = createConfig({
  chains: [arbitrumSepolia],
  connectors: [
    injected(),                            // MetaMask + any browser wallet
    walletConnect({
      projectId:
        process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ||
        process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
        'assetsgrator',
    }),
    coinbaseWallet({ appName: 'AssetsGrator' }),
  ],
  transports: {
    [arbitrumSepolia.id]: http(RPC_URL),
  },
  ssr: true,
});

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
