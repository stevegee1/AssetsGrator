import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { polygon, polygonAmoy } from "wagmi/chains";
import { http } from "wagmi";

const AMOY_RPC =
  process.env.NEXT_PUBLIC_AMOY_RPC_URL || "https://rpc-amoy.polygon.technology"; // public fallback

export const wagmiConfig = getDefaultConfig({
  appName: "AssetsGrator",
  projectId:
    process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ||
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
    "assetsgrator-demo",
  chains: [polygonAmoy, polygon],
  transports: {
    [polygonAmoy.id]: http(AMOY_RPC),
    [polygon.id]: http(),
  },
  ssr: true,
});

// Default chain used for read-only queries (works even with no wallet connected)
export const DEFAULT_CHAIN_ID = polygonAmoy.id; // 80002
