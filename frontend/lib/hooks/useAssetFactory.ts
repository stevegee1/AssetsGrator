'use client';

/**
 * useAssetFactory — reads and writes against AssetFactory.sol
 *
 * Reads:
 *   getAllAssets()        → list of all deployed AssetToken addresses
 *   totalAssets()         → total count
 *   assetTreasury(token)  → treasury address for a given token
 *   assetCompliance(token)→ compliance address for a given token
 *
 * Writes:
 *   deployAsset(params)   → deploys a new AssetToken + Treasury (admin only)
 */

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ASSET_FACTORY_ABI } from '@/lib/contracts/abis';
import { useContractAddresses } from '@/lib/contracts/addresses';

export function useAllAssets() {
  const { ASSET_FACTORY } = useContractAddresses();
  const { data, isLoading, error, refetch } = useReadContract({
    address: ASSET_FACTORY,
    abi: ASSET_FACTORY_ABI,
    functionName: 'getAllAssets',
  });
  return {
    assets: (data ?? []) as `0x${string}`[],
    isLoading,
    error,
    refetch,
  };
}

export function useTotalAssets() {
  const { ASSET_FACTORY } = useContractAddresses();
  const { data, isLoading } = useReadContract({
    address: ASSET_FACTORY,
    abi: ASSET_FACTORY_ABI,
    functionName: 'totalAssets',
  });
  return { total: (data ?? 0n) as bigint, isLoading };
}

export function useAssetTreasuryAddress(tokenAddress: `0x${string}` | undefined) {
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

export interface DeployAssetParams {
  name: string;
  symbol: string;
  ipfsCID: string;
  location: string;
  category: number;           // AssetCategory enum: 0=RealEstate, 1=Energy, 2=Carbon, 3=REC
  assetSubType: string;
  totalSupply: bigint;        // e.g. 1_000_000n (1M tokens)
  pricePerUnit: bigint;       // 18-decimal USD e.g. 10n * 10n**18n = £10
  valuationUSD: bigint;       // 18-decimal USD
  identityRegistry: `0x${string}`;
  capacityKW: bigint;         // 0 for non-energy assets
  annualYieldMWh: bigint;     // 0 for non-energy assets
  ppaContractCID: string;     // '' for non-energy assets
  ppaTermYears: bigint;       // 0 for non-energy assets
}

export function useDeployAsset() {
  const { ASSET_FACTORY } = useContractAddresses();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const deployAsset = (params: DeployAssetParams) => {
    writeContract({
      address: ASSET_FACTORY,
      abi: ASSET_FACTORY_ABI,
      functionName: 'deployAsset',
      args: [{
        name: params.name,
        symbol: params.symbol,
        ipfsCID: params.ipfsCID,
        location: params.location,
        category: params.category,
        assetSubType: params.assetSubType,
        totalSupply: params.totalSupply,
        pricePerUnit: params.pricePerUnit,
        valuationUSD: params.valuationUSD,
        identityRegistry: params.identityRegistry,
        capacityKW: params.capacityKW,
        annualYieldMWh: params.annualYieldMWh,
        ppaContractCID: params.ppaContractCID,
        ppaTermYears: params.ppaTermYears,
      }],
    });
  };

  return { deployAsset, isPending, isConfirming, isSuccess, hash, error };
}
