"use client";

import { useReadContract, useAccount } from "wagmi";
import { useChainId } from "wagmi";
import { ADDRESSES } from "@/lib/contracts/addresses";

const OWNER_ABI = [
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

/**
 * Returns true only if the connected wallet is the PropertyFactory owner.
 * No backend — reads directly from the contract on-chain.
 */
export function useIsAdmin() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const addresses =
    chainId === 80002 // 80002 = Polygon Amoy
      ? ADDRESSES.mumbai // our testnet addresses live here
      : ADDRESSES.polygon;

  const { data: factoryOwner, isLoading } = useReadContract({
    address: addresses.PROPERTY_FACTORY as `0x${string}`,
    abi: OWNER_ABI,
    functionName: "owner",
    query: {
      enabled: isConnected && !!addresses.PROPERTY_FACTORY,
      staleTime: 60_000, // re-check every 60 s
    },
  });

  const isAdmin =
    isConnected &&
    !!address &&
    !!factoryOwner &&
    address.toLowerCase() === factoryOwner.toLowerCase();

  return { isAdmin, isLoading, factoryOwner };
}
