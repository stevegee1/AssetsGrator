"use client";

/**
 * useDashboard — aggregate on-chain data for the investor dashboard.
 *
 * Reads for each property the connected wallet has tokens in:
 *  - PropertyFactory: getAllProperties() → list of token addresses
 *  - PropertyFactory: getTreasury(token) → treasury address per token
 *  - PropertyToken: balanceOf(wallet), pricePerUnit(), propertyMetadata()
 *  - PropertyTreasury: quoteRedemption(units) → claimable USDC estimate
 *  - IdentityRegistry: isVerified(wallet) → KYC status
 *
 * All numbers are BigInt from the chain. Formatting is done in the component.
 */

import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { useChainId } from "wagmi";
import { ADDRESSES } from "@/lib/contracts/addresses";
import {
  PROPERTY_FACTORY_ABI,
  PROPERTY_TOKEN_ABI,
  PROPERTY_TREASURY_ABI,
  GET_TREASURY_ABI,
  IDENTITY_REGISTRY_ABI,
} from "@/lib/contracts/abis";

function useAddresses() {
  const chainId = useChainId();
  return chainId === 80001 || chainId === 80002
    ? ADDRESSES.mumbai
    : ADDRESSES.polygon;
}

/** Single property holding for the dashboard */
export interface PropertyHolding {
  tokenAddress: `0x${string}`;
  treasuryAddress: `0x${string}` | undefined;
  name: string;
  symbol: string;
  location: string;
  ipfsCID: string;
  balance: bigint; // raw base tokens (1 unit = 1e18)
  units: bigint; // balance / 1e18
  pricePerUnit: bigint; // 18-decimal USD
  currentValueUsdc: bigint; // units * pricePerUnit / 1e12 → 6-decimal USDC
  claimableUsdc: bigint; // from quoteRedemption — 6-decimal USDC
}

export function useDashboard() {
  const { address: wallet } = useAccount();
  const addresses = useAddresses();

  // ── 1. Get all deployed property tokens ──────────────────────────────────
  const { data: allProperties, isLoading: loadingProperties } = useReadContract(
    {
      address: addresses.PROPERTY_FACTORY,
      abi: PROPERTY_FACTORY_ABI,
      functionName: "getAllProperties",
      query: { enabled: !!addresses.PROPERTY_FACTORY },
    },
  );

  const properties = (allProperties ?? []) as `0x${string}`[];

  // ── 2. KYC status ─────────────────────────────────────────────────────────
  const { data: isKYCVerified, isLoading: loadingKYC } = useReadContract({
    address: addresses.IDENTITY_REGISTRY,
    abi: IDENTITY_REGISTRY_ABI,
    functionName: "isVerified",
    args: wallet ? [wallet] : undefined,
    query: { enabled: !!wallet && !!addresses.IDENTITY_REGISTRY },
  });

  // ── 3. Batch: get balance + price + metadata for each property ────────────
  const tokenCalls = properties.flatMap((token) => [
    {
      address: token,
      abi: PROPERTY_TOKEN_ABI,
      functionName: "balanceOf" as const,
      args: [wallet ?? "0x0000000000000000000000000000000000000000"] as [
        `0x${string}`,
      ],
    },
    {
      address: token,
      abi: PROPERTY_TOKEN_ABI,
      functionName: "pricePerUnit" as const,
    },
    {
      address: token,
      abi: PROPERTY_TOKEN_ABI,
      functionName: "propertyMetadata" as const,
    },
    {
      address: addresses.PROPERTY_FACTORY,
      abi: GET_TREASURY_ABI,
      functionName: "getTreasury" as const,
      args: [token] as [`0x${string}`],
    },
  ]);

  const { data: tokenResults, isLoading: loadingTokens } = useReadContracts({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    contracts: tokenCalls as any[],
    query: { enabled: properties.length > 0 && !!wallet },
  });

  // ── 4. For each property with a balance, get quoteRedemption ─────────────
  // Build holdings from batch results first
  const partialHoldings: Array<{
    tokenAddress: `0x${string}`;
    treasuryAddress: `0x${string}` | undefined;
    balance: bigint;
    units: bigint;
    pricePerUnit: bigint;
    currentValueUsdc: bigint;
    name: string;
    symbol: string;
    location: string;
    ipfsCID: string;
  }> = [];

  if (tokenResults && properties.length > 0) {
    properties.forEach((token, i) => {
      const base = i * 4;
      const balance = (tokenResults[base]?.result ?? 0n) as bigint;
      const pricePerUnit = (tokenResults[base + 1]?.result ?? 0n) as bigint;
      const meta = tokenResults[base + 2]?.result as any;
      const treasury = tokenResults[base + 3]?.result as
        | `0x${string}`
        | undefined;

      if (balance === 0n) return; // skip properties user doesn't hold

      const units = balance / BigInt(1e18);
      // pricePerUnit is 18-decimal USD, convert to 6-decimal USDC
      const currentValueUsdc = (units * pricePerUnit) / BigInt(1e12);

      partialHoldings.push({
        tokenAddress: token,
        treasuryAddress: treasury,
        balance,
        units,
        pricePerUnit,
        currentValueUsdc,
        name: meta?.name ?? "Unknown Property",
        symbol: meta?.symbol ?? "???",
        location: meta?.location ?? "",
        ipfsCID: meta?.ipfsCID ?? "",
      });
    });
  }

  // ── 5. Batch quoteRedemption for held properties ──────────────────────────
  const redemptionCalls = partialHoldings
    .filter((h) => h.treasuryAddress && h.units > 0n)
    .map((h) => ({
      address: h.treasuryAddress!,
      abi: PROPERTY_TREASURY_ABI,
      functionName: "quoteRedemption" as const,
      args: [h.units] as [bigint],
    }));

  const { data: redemptionResults, isLoading: loadingRedemptions } =
    useReadContracts({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      contracts: redemptionCalls as any[],
      query: { enabled: redemptionCalls.length > 0 },
    });

  // ── 6. Merge claimable USDC into final holdings ───────────────────────────
  let redemptionIdx = 0;
  const holdings: PropertyHolding[] = partialHoldings.map((h) => {
    let claimableUsdc = 0n;
    if (h.treasuryAddress && h.units > 0n && redemptionResults) {
      const result = redemptionResults[redemptionIdx]?.result as
        | [bigint, bigint, bigint]
        | undefined;
      if (result) claimableUsdc = result[2]; // netUsdc
      redemptionIdx++;
    }
    return { ...h, claimableUsdc };
  });

  // ── 7. Aggregate totals ───────────────────────────────────────────────────
  const totalValueUsdc = holdings.reduce((s, h) => s + h.currentValueUsdc, 0n);
  const totalClaimable = holdings.reduce((s, h) => s + h.claimableUsdc, 0n);

  return {
    holdings,
    totalValueUsdc,
    totalClaimable,
    isKYCVerified: isKYCVerified ?? false,
    isLoading:
      loadingProperties || loadingKYC || loadingTokens || loadingRedemptions,
    walletConnected: !!wallet,
  };
}
