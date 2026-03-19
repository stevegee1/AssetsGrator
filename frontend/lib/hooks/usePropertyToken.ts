"use client";

import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { PROPERTY_TOKEN_ABI } from "@/lib/contracts/abis";

/**
 * usePropertyToken — read metadata and interact with an ERC-3643 property token.
 * @param tokenAddress  The deployed PropertyToken contract address
 */
export function usePropertyToken(tokenAddress: `0x${string}` | undefined) {
  const enabled = !!tokenAddress;

  const { data: metadata, isLoading: metaLoading } = useReadContract({
    address: tokenAddress,
    abi: PROPERTY_TOKEN_ABI,
    functionName: "propertyMetadata",
    query: { enabled },
  });

  const { data: status } = useReadContract({
    address: tokenAddress,
    abi: PROPERTY_TOKEN_ABI,
    functionName: "propertyStatus",
    query: { enabled },
  });

  const { data: pricePerUnit } = useReadContract({
    address: tokenAddress,
    abi: PROPERTY_TOKEN_ABI,
    functionName: "pricePerUnit",
    query: { enabled },
  });

  const { data: availableUnits } = useReadContract({
    address: tokenAddress,
    abi: PROPERTY_TOKEN_ABI,
    functionName: "availableUnits",
    query: { enabled },
  });

  const { data: totalSupply } = useReadContract({
    address: tokenAddress,
    abi: PROPERTY_TOKEN_ABI,
    functionName: "totalSupply",
    query: { enabled },
  });

  return {
    metadata,
    status,
    pricePerUnit,
    availableUnits,
    totalSupply,
    isLoading: metaLoading,
  };
}

/**
 * useTokenBalance — get an address's token balance for a property token.
 */
export function useTokenBalance(
  tokenAddress: `0x${string}` | undefined,
  walletAddress: `0x${string}` | undefined,
) {
  const { data: balance } = useReadContract({
    address: tokenAddress,
    abi: PROPERTY_TOKEN_ABI,
    functionName: "balanceOf",
    args: walletAddress ? [walletAddress] : undefined,
    query: { enabled: !!tokenAddress && !!walletAddress },
  });

  return { balance: balance ?? 0n };
}

/**
 * useOwnershipBPS — get ownership percentage (basis points) for a wallet.
 */
export function useOwnershipBPS(
  tokenAddress: `0x${string}` | undefined,
  walletAddress: `0x${string}` | undefined,
) {
  const { data: bps } = useReadContract({
    address: tokenAddress,
    abi: PROPERTY_TOKEN_ABI,
    functionName: "ownershipBPS",
    args: walletAddress ? [walletAddress] : undefined,
    query: { enabled: !!tokenAddress && !!walletAddress },
  });

  return { ownershipBPS: bps ?? 0n };
}
