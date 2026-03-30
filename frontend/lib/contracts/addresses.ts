// Deployed contract addresses — Arbitrum Sepolia (chainId 421614)
// Deployed: 2026-03-30 — AssetsGrator Asset* + Fhenix CoFHE suite
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

    ASSET_GOVERNANCE: (process.env.NEXT_PUBLIC_ASSET_GOVERNANCE ??
      '0xA2A3222D0ACB90428241Caa230B2148aE74d6a0e') as `0x${string}`,

    // ── T-REX Identity Infrastructure ────────────────────────────────────────
    IDENTITY_REGISTRY: (process.env.NEXT_PUBLIC_IDENTITY_REGISTRY ??
      '0xE413130d308d1587d0E080E9FFB4bb2826952701') as `0x${string}`,

    TRUSTED_ISSUERS_REGISTRY: (process.env.NEXT_PUBLIC_TRUSTED_ISSUERS_REGISTRY ??
      '0x7b1E2919D2B6bacB66Ec2745c845Df5d739Da349') as `0x${string}`,

    CLAIM_TOPICS_REGISTRY: (process.env.NEXT_PUBLIC_CLAIM_TOPICS_REGISTRY ??
      '0x827c98d9b5C361e7d0b1748A40B1Ea34162Ff979') as `0x${string}`,

    IDENTITY_REGISTRY_STORAGE: (process.env.NEXT_PUBLIC_IDENTITY_REGISTRY_STORAGE ??
      '0x493390e984E71A709DE7C5aE05088492C75eA357') as `0x${string}`,

    // ── FHE Privacy Contracts ────────────────────────────────────────────────
    FHE_KYC_REGISTRY: (process.env.NEXT_PUBLIC_FHE_KYC_REGISTRY ??
      '0xA2c3c3B96FA38f3eb6E384E7602860d62aDC3fD5') as `0x${string}`,

    FHE_VALUATION: (process.env.NEXT_PUBLIC_FHE_VALUATION ??
      '0x13C9B635bc1F6D72616ED6dd9DE092209584743b') as `0x${string}`,

    FHE_FEE_MANAGER: (process.env.NEXT_PUBLIC_FHE_FEE_MANAGER ??
      '0xFF9d2eA96821d426Fc681177F625bD7052F18662') as `0x${string}`,

    FHE_PORTFOLIO_REGISTRY: (process.env.NEXT_PUBLIC_FHE_PORTFOLIO_REGISTRY ??
      '0xA62a161251fEd2eb2cfdA5e328055A47d08dA360') as `0x${string}`,

    CONFIDENTIAL_LOAN: (process.env.NEXT_PUBLIC_CONFIDENTIAL_LOAN ??
      '0x9485Fa34Af83488f967647D445689F535378cc87') as `0x${string}`,

    // ── Payment Token ────────────────────────────────────────────────────────
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
