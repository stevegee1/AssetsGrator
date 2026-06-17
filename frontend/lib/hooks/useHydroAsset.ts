'use client';

import { useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { HYDRO_ASSET_ABI, USDC_ABI } from '@/lib/contracts/abis';
import { useContractAddresses } from '@/lib/contracts/addresses';

export interface ProductionBatch {
  id: number;
  producer: `0x${string}`;
  totalKg: bigint;
  pricePerKg: bigint;
  salePricePerKg: bigint;
  purchaseDeadline: bigint;
  deliveryEstimate: bigint;
  completionTime: bigint;
  redemptionWindow: bigint;
  storageFeePerKgPerDay: bigint;
  totalSold: bigint;
  totalRedeemed: bigint;
  isCompleted: boolean;
  isCancelled: boolean;
}

/** Get the next batch ID from HydroAsset */
export function useNextBatchId() {
  const { HYDRO_ASSET } = useContractAddresses();
  const { data, isLoading, refetch } = useReadContract({
    address: HYDRO_ASSET,
    abi: HYDRO_ASSET_ABI,
    functionName: 'nextBatchId',
    query: { enabled: HYDRO_ASSET !== '0x0000000000000000000000000000000000000000' }
  });
  return { nextBatchId: (data as bigint) ?? 1n, isLoading, refetch };
}

/** Check if an address is a whitelisted producer */
export function useIsProducer(walletAddress: `0x${string}` | undefined) {
  const { HYDRO_ASSET } = useContractAddresses();
  const { data, isLoading } = useReadContract({
    address: HYDRO_ASSET,
    abi: HYDRO_ASSET_ABI,
    functionName: 'isProducer',
    args: walletAddress ? [walletAddress] : undefined,
    query: { enabled: !!walletAddress && HYDRO_ASSET !== '0x0000000000000000000000000000000000000000' }
  });
  return { isProducer: (data as boolean) ?? false, isLoading };
}

/** Helper to query my producer status */
export function useIsMyProducer() {
  const { address } = useAccount();
  return useIsProducer(address);
}

/** Get all production batches on-chain */
export function useAllBatches() {
  const { HYDRO_ASSET } = useContractAddresses();
  const { nextBatchId, isLoading: loadingId, refetch: refetchId } = useNextBatchId();

  const batchCount = nextBatchId ? Number(nextBatchId) - 1 : 0;
  
  const contracts = Array.from({ length: batchCount }, (_, i) => ({
    address: HYDRO_ASSET,
    abi: HYDRO_ASSET_ABI,
    functionName: 'batches' as const,
    args: [BigInt(i + 1)] as [bigint],
  }));

  const { data: results, isLoading: loadingBatches, refetch: refetchBatches } = useReadContracts({
    contracts,
    query: { enabled: batchCount > 0 && HYDRO_ASSET !== '0x0000000000000000000000000000000000000000' }
  });

  const refetch = async () => {
    await refetchId();
    await refetchBatches();
  };

  const batches: ProductionBatch[] = [];
  if (results && results.length > 0) {
    results.forEach((r, i) => {
      if (r.status === 'success' && r.result) {
        const res = r.result as any;
        batches.push({
          id: i + 1,
          producer: res[0],
          totalKg: res[1],
          pricePerKg: res[2],
          salePricePerKg: res[3],
          purchaseDeadline: res[4],
          deliveryEstimate: res[5],
          completionTime: res[6],
          redemptionWindow: res[7],
          storageFeePerKgPerDay: res[8],
          totalSold: res[9],
          totalRedeemed: res[10],
          isCompleted: res[11],
          isCancelled: res[12],
        });
      }
    });
  }

  return {
    batches,
    isLoading: loadingId || loadingBatches,
    refetch,
  };
}

/** Get batch balances for the connected wallet */
export function useMyAllocations(batches: ProductionBatch[]) {
  const { address: wallet } = useAccount();
  const { HYDRO_ASSET } = useContractAddresses();

  const contracts = batches.map(b => ({
    address: HYDRO_ASSET,
    abi: HYDRO_ASSET_ABI,
    functionName: 'balanceOf' as const,
    args: [wallet ?? '0x0000000000000000000000000000000000000000', BigInt(b.id)] as [`0x${string}`, bigint]
  }));

  const { data: results, isLoading, refetch } = useReadContracts({
    contracts,
    query: { enabled: batches.length > 0 && !!wallet && HYDRO_ASSET !== '0x0000000000000000000000000000000000000000' }
  });

  const allocations = batches.map((b, i) => {
    const balance = results ? (results[i]?.result as bigint ?? 0n) : 0n;
    return {
      batch: b,
      balance,
    };
  }).filter(a => a.balance > 0n);

  return { allocations, isLoading, refetch };
}

/** Approve GBPT/USDC spend for HydroAsset purchases */
export function useApproveGBPT() {
  const { USDC, HYDRO_ASSET } = useContractAddresses();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const approve = (amountGbpt: bigint) => {
    writeContract({
      address: USDC,
      abi: USDC_ABI,
      functionName: 'approve',
      args: [HYDRO_ASSET, amountGbpt],
    });
  };

  return { approve, isPending, isConfirming, isSuccess, hash, error };
}

/** Purchase allocation from a batch */
export function usePurchaseAllocation() {
  const { HYDRO_ASSET } = useContractAddresses();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const purchase = (batchId: number, quantityKg: bigint) => {
    writeContract({
      address: HYDRO_ASSET,
      abi: HYDRO_ASSET_ABI,
      functionName: 'purchaseAllocation',
      args: [BigInt(batchId), quantityKg],
    });
  };

  return { purchase, isPending, isConfirming, isSuccess, hash, error };
}

/** Redeem allocation */
export function useRedeemAllocation() {
  const { HYDRO_ASSET } = useContractAddresses();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const redeem = (batchId: number, quantityKg: bigint) => {
    writeContract({
      address: HYDRO_ASSET,
      abi: HYDRO_ASSET_ABI,
      functionName: 'redeemAllocation',
      args: [BigInt(batchId), quantityKg],
    });
  };

  return { redeem, isPending, isConfirming, isSuccess, hash, error };
}

/** Request refund for delayed/cancelled batch */
export function useRequestRefund() {
  const { HYDRO_ASSET } = useContractAddresses();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const refund = (batchId: number, quantityKg: bigint) => {
    writeContract({
      address: HYDRO_ASSET,
      abi: HYDRO_ASSET_ABI,
      functionName: 'requestRefund',
      args: [BigInt(batchId), quantityKg],
    });
  };

  return { refund, isPending, isConfirming, isSuccess, hash, error };
}

/** Commit new production batch */
export function useCommitProduction() {
  const { HYDRO_ASSET } = useContractAddresses();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const commit = (
    totalKg: bigint,
    pricePerKg: bigint,
    salePricePerKg: bigint,
    purchaseDeadline: bigint,
    deliveryEstimate: bigint,
    redemptionWindow: bigint,
    storageFeePerKgPerDay: bigint
  ) => {
    writeContract({
      address: HYDRO_ASSET,
      abi: HYDRO_ASSET_ABI,
      functionName: 'commitProduction',
      args: [
        totalKg,
        pricePerKg,
        salePricePerKg,
        purchaseDeadline,
        deliveryEstimate,
        redemptionWindow,
        storageFeePerKgPerDay
      ],
    });
  };

  return { commit, isPending, isConfirming, isSuccess, hash, error };
}

/** Complete production */
export function useCompleteProduction() {
  const { HYDRO_ASSET } = useContractAddresses();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const complete = (batchId: number) => {
    writeContract({
      address: HYDRO_ASSET,
      abi: HYDRO_ASSET_ABI,
      functionName: 'completeProduction',
      args: [BigInt(batchId)],
    });
  };

  return { complete, isPending, isConfirming, isSuccess, hash, error };
}

/** Cancel unsold allocation */
export function useCancelUnsoldAllocation() {
  const { HYDRO_ASSET } = useContractAddresses();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const cancelUnsold = (batchId: number) => {
    writeContract({
      address: HYDRO_ASSET,
      abi: HYDRO_ASSET_ABI,
      functionName: 'cancelUnsoldAllocation',
      args: [BigInt(batchId)],
    });
  };

  return { cancelUnsold, isPending, isConfirming, isSuccess, hash, error };
}

/** Cancel batch */
export function useCancelBatch() {
  const { HYDRO_ASSET } = useContractAddresses();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const cancel = (batchId: number) => {
    writeContract({
      address: HYDRO_ASSET,
      abi: HYDRO_ASSET_ABI,
      functionName: 'cancelBatch',
      args: [BigInt(batchId)],
    });
  };

  return { cancel, isPending, isConfirming, isSuccess, hash, error };
}
