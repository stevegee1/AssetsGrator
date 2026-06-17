'use client';

/**
 * useMarketplace — reads and writes against AssetMarketplace.sol
 *
 * The marketplace handles secondary P2P trading of AssetToken shares.
 * Payment is in USDC (ERC-20), not native ETH/MATIC.
 */

import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { ASSET_MARKETPLACE_ABI, USDC_ABI } from '@/lib/contracts/abis';
import { useContractAddresses } from '@/lib/contracts/addresses';

/** Get all active listing IDs for a given asset token */
export function useActiveListings(tokenAddress: `0x${string}` | undefined) {
  const { ASSET_MARKETPLACE } = useContractAddresses();

  const { data: listingIds, isLoading } = useReadContract({
    address: ASSET_MARKETPLACE,
    abi: ASSET_MARKETPLACE_ABI,
    functionName: 'getActiveListings',
    args: tokenAddress ? [tokenAddress] : undefined,
    query: { enabled: !!tokenAddress },
  });

  return { listingIds: (listingIds ?? []) as bigint[], isLoading };
}

/** Get a single listing by ID */
export function useListing(listingId: bigint | undefined) {
  const { ASSET_MARKETPLACE } = useContractAddresses();

  const { data: listing, isLoading } = useReadContract({
    address: ASSET_MARKETPLACE,
    abi: ASSET_MARKETPLACE_ABI,
    functionName: 'getListing',
    args: listingId !== undefined ? [listingId] : undefined,
    query: { enabled: listingId !== undefined },
  });

  return { listing, isLoading };
}

/**
 * useCreateListing — list units on the secondary market.
 * Seller must first approve the marketplace to transfer their tokens.
 */
export function useCreateListing() {
  const { ASSET_MARKETPLACE } = useContractAddresses();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const createListing = (
    tokenAddress: `0x${string}`,
    units: bigint,
    pricePerUnitUsdc: bigint, // 6-decimal USDC
  ) => {
    writeContract({
      address: ASSET_MARKETPLACE,
      abi: ASSET_MARKETPLACE_ABI,
      functionName: 'createListing',
      args: [tokenAddress, units, pricePerUnitUsdc],
    });
  };

  return { createListing, isPending, isConfirming, isSuccess, hash, error };
}

/**
 * useCancelListing — cancel an existing listing (seller only).
 */
export function useCancelListing() {
  const { ASSET_MARKETPLACE } = useContractAddresses();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const cancelListing = (listingId: bigint) => {
    writeContract({
      address: ASSET_MARKETPLACE,
      abi: ASSET_MARKETPLACE_ABI,
      functionName: 'cancelListing',
      args: [listingId],
    });
  };

  return { cancelListing, isPending, isConfirming, isSuccess, hash, error };
}

/**
 * usePurchaseListing — buy from a secondary market listing.
 * Buyer must first approve USDC spend on the marketplace contract.
 */
export function usePurchaseListing() {
  const { ASSET_MARKETPLACE } = useContractAddresses();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const purchase = (listingId: bigint, units: bigint) => {
    writeContract({
      address: ASSET_MARKETPLACE,
      abi: ASSET_MARKETPLACE_ABI,
      functionName: 'fillListing',
      args: [listingId, units],
    });
  };

  return { purchase, isPending, isConfirming, isSuccess, hash, error };
}

/**
 * useApproveUSDC — approve the marketplace to spend USDC on behalf of buyer.
 * Call this before purchase().
 */
export function useApproveUSDC() {
  const { USDC, ASSET_MARKETPLACE } = useContractAddresses();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const approve = (amountUsdc: bigint) => {
    writeContract({
      address: USDC,
      abi: USDC_ABI,
      functionName: 'approve',
      args: [ASSET_MARKETPLACE, amountUsdc],
    });
  };

  return { approve, isPending, isConfirming, isSuccess, hash, error };
}
