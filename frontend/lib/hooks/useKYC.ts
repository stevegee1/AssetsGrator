'use client';

/**
 * useKYC — interact with T-REX IdentityRegistry.sol
 *
 * T-REX IdentityRegistry stores whether an investor address is verified to hold/trade tokens.
 *
 * Functions used by the frontend:
 *   • isVerified(investor) — check if an investor is verified/KYC-cleared
 */

import {
  useReadContract,
  useAccount,
} from 'wagmi';
import { IDENTITY_REGISTRY_ABI } from '@/lib/contracts/abis';
import { useContractAddresses } from '@/lib/contracts/addresses';

export type KYCStatus = 'not_started' | 'pending' | 'approved' | 'rejected';

/**
 * useKYCVerified — check if a wallet is verified in the T-REX IdentityRegistry.
 * This is the primary gate for accessing the platform.
 */
export function useKYCVerified(walletAddress?: `0x${string}`) {
  const { IDENTITY_REGISTRY } = useContractAddresses();
  const { address: connectedWallet } = useAccount();
  const target = walletAddress ?? connectedWallet;

  const { data, isLoading, refetch } = useReadContract({
    address: IDENTITY_REGISTRY,
    abi: IDENTITY_REGISTRY_ABI,
    functionName: 'isVerified',
    args: target ? [target] : undefined,
    query: { enabled: !!target },
  });

  return {
    isValid: (data as boolean) ?? false,
    isLoading,
    refetch,
  };
}

/**
 * useKYCAccredited — check if a wallet is accredited.
 * In the plaintext identity registry model, verification covers all attributes.
 */
export function useKYCAccredited(walletAddress?: `0x${string}`) {
  return useKYCVerified(walletAddress);
}

/**
 * useKYCAMLCleared — check if a wallet is AML cleared.
 * In the plaintext identity registry model, verification covers all attributes.
 */
export function useKYCAMLCleared(walletAddress?: `0x${string}`) {
  return useKYCVerified(walletAddress);
}

/**
 * useKYCStatus — derives a user-friendly status for the connected wallet.
 *
 * The flow:
 *   1. User completes off-chain KYC form → stored in backend DB
 *   2. Backend marks as "pending" in its own state
 *   3. Admin/operator registers the identity on-chain via IdentityRegistry
 *   4. isVerified returns true → approved
 *
 * The frontend reads isVerified to show status. "pending" is inferred from
 * a localStorage flag set when form submission is confirmed by the backend.
 */
export function useKYCStatus(): { status: KYCStatus; isLoading: boolean } {
  const { address: wallet } = useAccount();
  const { isValid: isVerified, isLoading } = useKYCVerified(wallet);

  if (isLoading) return { status: 'not_started', isLoading: true };
  if (!wallet) return { status: 'not_started', isLoading: false };

  // Check if the user submitted the KYC form (stored in localStorage)
  const submitted =
    typeof window !== 'undefined' &&
    localStorage.getItem(`kyc_submitted_${wallet?.toLowerCase()}`) === '1';

  if (isVerified) return { status: 'approved', isLoading: false };
  if (submitted) return { status: 'pending', isLoading: false };
  return { status: 'not_started', isLoading: false };
}
