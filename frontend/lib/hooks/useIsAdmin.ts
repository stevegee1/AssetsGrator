'use client';

import { useReadContract, useAccount } from 'wagmi';
import { useContractAddresses } from '@/lib/contracts/addresses';

const OWNER_ABI = [
  {
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

/**
 * Returns true only if the connected wallet is the AssetFactory owner.
 * No backend — reads directly from the contract on-chain.
 */
export function useIsAdmin() {
  const { address, isConnected } = useAccount();
  const { ASSET_FACTORY } = useContractAddresses();

  const { data: factoryOwner, isLoading } = useReadContract({
    address: ASSET_FACTORY,
    abi: OWNER_ABI,
    functionName: 'owner',
    query: {
      enabled: isConnected && !!ASSET_FACTORY,
      staleTime: 60_000,
    },
  });

  const isAdmin =
    isConnected &&
    !!address &&
    !!factoryOwner &&
    address.toLowerCase() === factoryOwner.toLowerCase();

  return { isAdmin, isLoading, factoryOwner };
}
