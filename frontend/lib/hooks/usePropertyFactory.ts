"use client";

import { useReadContract } from "wagmi";
import {
  PROPERTY_FACTORY_ABI,
  IDENTITY_REGISTRY_ABI,
} from "@/lib/contracts/abis";
import { ADDRESSES } from "@/lib/contracts/addresses";
import { useChainId, useAccount } from "wagmi";

function useAddresses() {
  const chainId = useChainId();
  // chainId 80002 = Polygon Amoy (stored under 'mumbai' key)
  return chainId === 80001 || chainId === 80002
    ? ADDRESSES.mumbai
    : ADDRESSES.polygon;
}

/**
 * usePropertyFactory — read all deployed property token addresses.
 */
export function usePropertyFactory() {
  const addresses = useAddresses();

  const { data: allProperties, isLoading } = useReadContract({
    address: addresses.PROPERTY_FACTORY,
    abi: PROPERTY_FACTORY_ABI,
    functionName: "getAllProperties",
    query: { enabled: !!addresses.PROPERTY_FACTORY },
  });

  return {
    allProperties: (allProperties ?? []) as `0x${string}`[],
    isLoading,
    factoryAddress: addresses.PROPERTY_FACTORY,
  };
}

/**
 * useKYCStatus — check if the connected wallet is KYC-verified
 * via the ERC-3643 IdentityRegistry (on-chain ONCHAINID check).
 */
export function useKYCStatus() {
  const { address } = useAccount();
  const addresses = useAddresses();

  const { data: isVerified, isLoading } = useReadContract({
    address: addresses.IDENTITY_REGISTRY,
    abi: IDENTITY_REGISTRY_ABI,
    functionName: "isVerified",
    args: address ? [address] : undefined,
    query: { enabled: !!addresses.IDENTITY_REGISTRY && !!address },
  });

  return {
    isVerified: isVerified ?? false,
    isLoading,
  };
}
