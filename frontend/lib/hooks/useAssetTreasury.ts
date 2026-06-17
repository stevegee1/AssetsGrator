'use client';

/**
 * useAssetTreasury — reads revenue and redemption data from AssetTreasury.sol
 *
 * Each deployed AssetToken has a paired AssetTreasury.
 * Get the treasury address via useAssetTreasuryAddress(tokenAddress) first.
 */

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ASSET_FACTORY_ABI } from '@/lib/contracts/abis';
import { useContractAddresses } from '@/lib/contracts/addresses';

// Minimal AssetTreasury ABI — only what the frontend needs
const ASSET_TREASURY_ABI = [
  {
    name: 'totalRevenue',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'pendingDistribution',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'claimableRevenue',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'investor', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'claimRevenue',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'depositRevenue',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  },
] as const;

export function useTreasuryRevenue(treasuryAddress: `0x${string}` | undefined) {
  const { data: total, isLoading: l1 } = useReadContract({
    address: treasuryAddress!,
    abi: ASSET_TREASURY_ABI,
    functionName: 'totalRevenue',
    query: { enabled: !!treasuryAddress },
  });

  const { data: pending, isLoading: l2 } = useReadContract({
    address: treasuryAddress!,
    abi: ASSET_TREASURY_ABI,
    functionName: 'pendingDistribution',
    query: { enabled: !!treasuryAddress },
  });

  return {
    totalRevenue: (total as bigint) ?? 0n,
    pendingDistribution: (pending as bigint) ?? 0n,
    isLoading: l1 || l2,
  };
}

export function useClaimableRevenue(
  treasuryAddress: `0x${string}` | undefined,
  investor: `0x${string}` | undefined,
) {
  const { data, isLoading } = useReadContract({
    address: treasuryAddress!,
    abi: ASSET_TREASURY_ABI,
    functionName: 'claimableRevenue',
    args: investor ? [investor] : undefined,
    query: { enabled: !!treasuryAddress && !!investor },
  });
  return { claimable: (data as bigint) ?? 0n, isLoading };
}

export function useClaimRevenue(treasuryAddress: `0x${string}` | undefined) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const claim = () => {
    if (!treasuryAddress) return;
    writeContract({
      address: treasuryAddress,
      abi: ASSET_TREASURY_ABI,
      functionName: 'claimRevenue',
    });
  };

  return { claim, isPending, isConfirming, isSuccess, hash, error };
}

/** Get treasury address from the factory for a given token */
export function useTreasuryAddress(tokenAddress: `0x${string}` | undefined) {
  const { ASSET_FACTORY } = useContractAddresses();
  const { data, isLoading } = useReadContract({
    address: ASSET_FACTORY,
    abi: ASSET_FACTORY_ABI,
    functionName: 'assetTreasury',
    args: tokenAddress ? [tokenAddress] : undefined,
    query: { enabled: !!tokenAddress },
  });
  return { treasury: data as `0x${string}` | undefined, isLoading };
}
