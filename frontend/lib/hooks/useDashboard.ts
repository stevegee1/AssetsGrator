'use client';

/**
 * useDashboard — aggregate on-chain data for the investor dashboard.
 *
 * Reads for each AssetToken the connected wallet holds:
 *   - AssetFactory.getAllAssets() → list of token addresses
 *   - AssetFactory.assetTreasury(token) → treasury per token
 *   - AssetToken.balanceOf(wallet), pricePerUnit(), assetMetadata()
 *   - AssetTreasury.claimableRevenue(wallet) → claimable USDC
 *   - IdentityRegistry.isVerified(wallet) → KYC status
 */

import { useAccount, useReadContract, useReadContracts } from 'wagmi';
import { useContractAddresses } from '@/lib/contracts/addresses';
import {
  ASSET_FACTORY_ABI,
  ASSET_TOKEN_ABI,
} from '@/lib/contracts/abis';

// Minimal treasury ABI for reading claimable USDC
const TREASURY_READ_ABI = [
  {
    name: 'claimableRevenue',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'investor', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
] as const;

// Minimal Identity Registry ABI
const IDENTITY_REGISTRY_READ_ABI = [
  {
    name: 'isVerified',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'userAddress', type: 'address' }],
    outputs: [{ type: 'bool' }],
  },
] as const;

export interface AssetHolding {
  tokenAddress: `0x${string}`;
  treasuryAddress: `0x${string}` | undefined;
  name: string;
  symbol: string;
  location: string;
  ipfsCID: string;
  category: number;
  balance: bigint;        // raw (1 unit = 1e18 base tokens)
  units: bigint;          // balance / 1e18
  pricePerUnit: bigint;   // 18-decimal USD
  currentValueUsd: bigint;// units * pricePerUnit / 1e18 → USD (18-decimal)
  claimableUsdc: bigint;  // 6-decimal USDC from treasury
  annualYieldBps: bigint;
}

export function useDashboard() {
  const { address: wallet } = useAccount();
  const { ASSET_FACTORY, IDENTITY_REGISTRY } = useContractAddresses();

  // ── 1. Get all deployed asset tokens ──────────────────────────────────────
  const { data: allAssets, isLoading: loadingAssets } = useReadContract({
    address: ASSET_FACTORY,
    abi: ASSET_FACTORY_ABI,
    functionName: 'getAllAssets',
  });
  const assets = (allAssets ?? []) as `0x${string}`[];

  // ── 2. KYC status from IdentityRegistry ───────────────────────────────────
  const { data: isKYCVerified, isLoading: loadingKYC } = useReadContract({
    address: IDENTITY_REGISTRY,
    abi: IDENTITY_REGISTRY_READ_ABI,
    functionName: 'isVerified',
    args: wallet ? [wallet] : undefined,
    query: { enabled: !!wallet },
  });

  // ── 3. Batch: balance + pricePerUnit + metadata + treasury per token ───────
  const tokenCalls = assets.flatMap((token) => [
    {
      address: token,
      abi: ASSET_TOKEN_ABI,
      functionName: 'balanceOf' as const,
      args: [wallet ?? '0x0000000000000000000000000000000000000000'] as [`0x${string}`],
    },
    {
      address: token,
      abi: ASSET_TOKEN_ABI,
      functionName: 'pricePerUnit' as const,
    },
    {
      address: token,
      abi: ASSET_TOKEN_ABI,
      functionName: 'assetMetadata' as const,
    },
    {
      address: ASSET_FACTORY,
      abi: ASSET_FACTORY_ABI,
      functionName: 'assetTreasury' as const,
      args: [token] as [`0x${string}`],
    },
  ]);

  const { data: tokenResults, isLoading: loadingTokens } = useReadContracts({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    contracts: tokenCalls as any[],
    query: { enabled: assets.length > 0 && !!wallet },
  });

  // ── 4. Build partial holdings (filter to balances > 0) ───────────────────
  type PartialHolding = Omit<AssetHolding, 'claimableUsdc'>;
  const partialHoldings: PartialHolding[] = [];

  if (tokenResults && assets.length > 0) {
    assets.forEach((token, i) => {
      const base = i * 4;
      const balance = (tokenResults[base]?.result ?? 0n) as bigint;
      if (balance === 0n) return;

      const pricePerUnit = (tokenResults[base + 1]?.result ?? 0n) as bigint;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const meta = tokenResults[base + 2]?.result as any;
      const treasury = tokenResults[base + 3]?.result as `0x${string}` | undefined;

      const units = balance / BigInt(1e18);
      const currentValueUsd = (units * pricePerUnit); // both 18-decimal

      partialHoldings.push({
        tokenAddress: token,
        treasuryAddress: treasury,
        balance,
        units,
        pricePerUnit,
        currentValueUsd,
        name: meta?.name ?? 'Unknown Asset',
        symbol: meta?.symbol ?? '???',
        location: meta?.location ?? '',
        ipfsCID: meta?.ipfsCID ?? '',
        category: meta?.category ?? 0,
        annualYieldBps: meta?.annualYieldBps ?? 0n,
      });
    });
  }

  // ── 5. Batch claimableRevenue for all held assets ─────────────────────────
  const revenueCalls = partialHoldings
    .filter((h) => h.treasuryAddress && h.units > 0n)
    .map((h) => ({
      address: h.treasuryAddress!,
      abi: TREASURY_READ_ABI,
      functionName: 'claimableRevenue' as const,
      args: [wallet!] as [`0x${string}`],
    }));

  const { data: revenueResults, isLoading: loadingRevenue } = useReadContracts({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    contracts: revenueCalls as any[],
    query: { enabled: revenueCalls.length > 0 && !!wallet },
  });

  // ── 6. Merge claimable USDC into final holdings ───────────────────────────
  let ri = 0;
  const holdings: AssetHolding[] = partialHoldings.map((h) => {
    let claimableUsdc = 0n;
    if (h.treasuryAddress && h.units > 0n && revenueResults) {
      claimableUsdc = (revenueResults[ri]?.result as bigint) ?? 0n;
      ri++;
    }
    return { ...h, claimableUsdc };
  });

  // ── 7. Aggregate totals ───────────────────────────────────────────────────
  const totalValueUsd = holdings.reduce((s, h) => s + h.currentValueUsd, 0n);
  const totalClaimable = holdings.reduce((s, h) => s + h.claimableUsdc, 0n);

  return {
    holdings,
    totalValueUsd,
    totalClaimable,
    isKYCVerified: (isKYCVerified as boolean) ?? false,
    isLoading: loadingAssets || loadingKYC || loadingTokens || loadingRevenue,
    walletConnected: !!wallet,
  };
}
