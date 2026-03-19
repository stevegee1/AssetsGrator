"use client";

import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther } from "viem";
import { MARKETPLACE_ABI } from "@/lib/contracts/abis";
import { ADDRESSES } from "@/lib/contracts/addresses";
import { useChainId } from "wagmi";

function useMarketplaceAddress() {
  const chainId = useChainId();
  return chainId === 80001 || chainId === 80002
    ? ADDRESSES.mumbai.PROPERTY_MARKETPLACE
    : ADDRESSES.polygon.PROPERTY_MARKETPLACE;
}

/**
 * useBuyFromIssuance — buy units from primary market (treasury → buyer)
 * Payment is in native MATIC (payable call).
 */
export function useBuyFromIssuance() {
  const marketplaceAddr = useMarketplaceAddress();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const buy = (
    tokenAddress: `0x${string}`,
    units: bigint,
    maticValue: bigint,
  ) => {
    writeContract({
      address: marketplaceAddr,
      abi: MARKETPLACE_ABI,
      functionName: "buyFromIssuance",
      args: [tokenAddress, units],
      value: maticValue,
    });
  };

  return { buy, isPending, isConfirming, isSuccess, hash };
}

/**
 * useActiveListings — get all secondary market listing IDs for a token.
 */
export function useActiveListings(tokenAddress: `0x${string}` | undefined) {
  const marketplaceAddr = useMarketplaceAddress();

  const { data: listingIds, isLoading } = useReadContract({
    address: marketplaceAddr,
    abi: MARKETPLACE_ABI,
    functionName: "getActiveListings",
    args: tokenAddress ? [tokenAddress] : undefined,
    query: { enabled: !!tokenAddress },
  });

  return { listingIds: (listingIds ?? []) as bigint[], isLoading };
}

/**
 * useListing — get a single listing by ID.
 */
export function useListing(listingId: bigint | undefined) {
  const marketplaceAddr = useMarketplaceAddress();

  const { data: listing, isLoading } = useReadContract({
    address: marketplaceAddr,
    abi: MARKETPLACE_ABI,
    functionName: "getListing",
    args: listingId !== undefined ? [listingId] : undefined,
    query: { enabled: listingId !== undefined },
  });

  return { listing, isLoading };
}

/**
 * useCreateListing — list units on the secondary market.
 * Seller must approve the marketplace to spend their tokens first.
 */
export function useCreateListing() {
  const marketplaceAddr = useMarketplaceAddress();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const createListing = (
    tokenAddress: `0x${string}`,
    units: bigint,
    pricePerUnit: bigint,
  ) => {
    writeContract({
      address: marketplaceAddr,
      abi: MARKETPLACE_ABI,
      functionName: "createListing",
      args: [tokenAddress, units, pricePerUnit],
    });
  };

  return { createListing, isPending, isConfirming, isSuccess, hash };
}

/**
 * useFillListing — buy from a secondary market listing.
 */
export function useFillListing() {
  const marketplaceAddr = useMarketplaceAddress();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const fillListing = (
    listingId: bigint,
    units: bigint,
    maticValue: bigint,
  ) => {
    writeContract({
      address: marketplaceAddr,
      abi: MARKETPLACE_ABI,
      functionName: "fillListing",
      args: [listingId, units],
      value: maticValue,
    });
  };

  return { fillListing, isPending, isConfirming, isSuccess, hash };
}
