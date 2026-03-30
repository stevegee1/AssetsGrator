import { arbitrumSepolia } from 'wagmi/chains';

// Arbitrum Sepolia — primary Fhenix CoFHE co-processor testnet
export const SUPPORTED_CHAIN = arbitrumSepolia;
export const DEFAULT_CHAIN_ID = arbitrumSepolia.id; // 421614

export const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL ||
  'https://sepolia-rollup.arbitrum.io/rpc';
