// Deployed contract addresses — Arbitrum Sepolia (chainId 421614)
// Source: contracts/deployed-addresses.json

import { DEFAULT_CHAIN_ID } from '@/lib/web3-config';

export const ADDRESSES = {
  arbitrumSepolia: {
    // ── Core Asset Platform ──────────────────────────────────────────────────
    ASSET_FACTORY: (process.env.NEXT_PUBLIC_ASSET_FACTORY ??
      '0x3f26043bb5ac3058C8963D2C24dd1D1eC4D0CE67') as `0x${string}`,

    ASSET_MARKETPLACE: (process.env.NEXT_PUBLIC_ASSET_MARKETPLACE ??
      '0x6030A334fAcc6a207f1Ceb6fdbdc62EA01aC7f63') as `0x${string}`,

    ASSET_REGISTRY: (process.env.NEXT_PUBLIC_ASSET_REGISTRY ??
      '0x1bc8e14Fa92ab6F8Bf18832935f44C5704C436aD') as `0x${string}`,

    HYDRO_ASSET: (process.env.NEXT_PUBLIC_HYDRO_ASSET ??
      '0x0000000000000000000000000000000000000000') as `0x${string}`,

    // ─── T-REX Identity Infrastructure ────────────────────────────────────────
    IDENTITY_REGISTRY: (process.env.NEXT_PUBLIC_IDENTITY_REGISTRY ??
      '0xE413130d308d1587d0E080E9FFB4bb2826952701') as `0x${string}`,

    TRUSTED_ISSUERS_REGISTRY: (process.env.NEXT_PUBLIC_TRUSTED_ISSUERS_REGISTRY ??
      '0x7b1E2919D2B6bacB66Ec2745c845Df5d739Da349') as `0x${string}`,

    CLAIM_TOPICS_REGISTRY: (process.env.NEXT_PUBLIC_CLAIM_TOPICS_REGISTRY ??
      '0x827c98d9b5C361e7d0b1748A40B1Ea34162Ff979') as `0x${string}`,

    IDENTITY_REGISTRY_STORAGE: (process.env.NEXT_PUBLIC_IDENTITY_REGISTRY_STORAGE ??
      '0x493390e984E71A709DE7C5aE05088492C75eA357') as `0x${string}`,

    // ─── Fee Manager ─────────────────────────────────────────────────────────
    FEE_MANAGER: (process.env.NEXT_PUBLIC_FEE_MANAGER ??
      '0x0000000000000000000000000000000000000000') as `0x${string}`,

    // ─── Valuation Oracle ─────────────────────────────────────────────────────
    ASSET_VALUATION: (process.env.NEXT_PUBLIC_ASSET_VALUATION ??
      '0x0000000000000000000000000000000000000000') as `0x${string}`,

    // ─── Payment Token ────────────────────────────────────────────────────────
    USDC: (process.env.NEXT_PUBLIC_USDC ??
      '0x5cDc5E3a8eC911e13A2261Ed177dED7EE6B1F4DE') as `0x${string}`,
  },
} as const;

// Convenience accessor — always returns arbitrumSepolia addresses
export function useContractAddresses() {
  return ADDRESSES.arbitrumSepolia;
}

// Chain guard — returns true if connected to the correct chain
export const REQUIRED_CHAIN_ID = DEFAULT_CHAIN_ID; // 421614
