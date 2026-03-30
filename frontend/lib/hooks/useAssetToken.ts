'use client';

/**
 * useAssetToken — reads from a specific deployed AssetToken.sol
 *
 * Each asset has its own token contract. Pass the token address.
 */

import { useReadContract, useReadContracts, useAccount } from 'wagmi';
import { ASSET_TOKEN_ABI } from '@/lib/contracts/abis';

export interface AssetMetadata {
  name: string;
  symbol: string;
  ipfsCID: string;
  location: string;
  category: number;
  assetSubType: string;
  totalSupply: bigint;
  pricePerUnit: bigint;   // 18-decimal USD
  valuationUSD: bigint;   // euint64 handle (encrypted — returns 0 for public reads)
  identityRegistry: `0x${string}`;
  capacityKW: bigint;
  annualYieldMWh: bigint;
}

export function useAssetDetails(tokenAddress: `0x${string}` | undefined) {
  const enabled = !!tokenAddress;
  const { data: results, isLoading } = useReadContracts({
    contracts: [
      { address: tokenAddress!, abi: ASSET_TOKEN_ABI, functionName: 'name' },
      { address: tokenAddress!, abi: ASSET_TOKEN_ABI, functionName: 'symbol' },
      { address: tokenAddress!, abi: ASSET_TOKEN_ABI, functionName: 'totalSupply' },
      { address: tokenAddress!, abi: ASSET_TOKEN_ABI, functionName: 'pricePerUnit' },
      { address: tokenAddress!, abi: ASSET_TOKEN_ABI, functionName: 'paused' },
      { address: tokenAddress!, abi: ASSET_TOKEN_ABI, functionName: 'assetMetadata' },
    ],
    query: { enabled },
  });

  if (!results) return { details: null, isLoading };

  const [name, symbol, totalSupply, pricePerUnit, isPaused, meta] = results.map(r => r.result);
  const metadata = meta as AssetMetadata | undefined;

  return {
    details: {
      name: (name as string) ?? '',
      symbol: (symbol as string) ?? '',
      totalSupply: (totalSupply as bigint) ?? 0n,
      pricePerUnit: (pricePerUnit as bigint) ?? 0n,
      isPaused: (isPaused as boolean) ?? false,
      ipfsCID: metadata?.ipfsCID ?? '',
      location: metadata?.location ?? '',
      category: metadata?.category ?? 0,
      assetSubType: metadata?.assetSubType ?? '',
      annualYieldMWh: (metadata as any)?.annualYieldMWh ?? 0n,
      capacityKW: metadata?.capacityKW ?? 0n,
    },
    isLoading,
  };
}

export function useAssetBalance(
  tokenAddress: `0x${string}` | undefined,
  walletAddress: `0x${string}` | undefined,
) {
  const { data: balance, isLoading } = useReadContract({
    address: tokenAddress!,
    abi: ASSET_TOKEN_ABI,
    functionName: 'balanceOf',
    args: walletAddress ? [walletAddress] : undefined,
    query: { enabled: !!tokenAddress && !!walletAddress },
  });
  return { balance: (balance as bigint) ?? 0n, isLoading };
}

/**
 * useIsKYCVerified — checks identityRegistry().isVerified(wallet) for a given token.
 * The identity registry is ERC-3643. AssetToken exposes the registry address via identityRegistry().
 * We delegate to useKYCVerified from useFHEKYC for the actual check.
 */
export function useMyAssetBalance(tokenAddress: `0x${string}` | undefined) {
  const { address: wallet } = useAccount();
  return useAssetBalance(tokenAddress, wallet);
}
