'use client';

import { WagmiProvider, createConfig, http } from 'wagmi';
import { polygon, polygonAmoy } from 'wagmi/chains';  // polygonAmoy = chainId 80002
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';

const config = createConfig({
  chains: [polygonAmoy, polygon],   // Amoy first = default/suggested chain
  connectors: [
    injected(),                              // MetaMask + any browser wallet
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'assetsgrator',
    }),
    coinbaseWallet({ appName: 'AssetsGrator' }),
  ],
  transports: {
    [polygonAmoy.id]: http('https://polygon-amoy.g.alchemy.com/v2/peDij9jekttvNoG7q6C0S'),
    [polygon.id]:     http(),
  },
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
