'use client';

/**
 * useFHEKYC — interact with FHEKYCRegistry.sol
 *
 * The FHEKYCRegistry stores encrypted KYC attributes (IS_ACCREDITED, AML_CLEARED)
 * as on-chain encrypted ciphertexts. Functions used by the frontend:
 *
 *   • isAttrValid(investor, attrKey)     — check if an attribute is active (set + not deactivated)
 *   • getEncryptedKYCAttr(investor, key) — returns the handle (for permit-gated decrypt)
 *   • grantKYCAccess(investor, who, exp) — grant a third party access to the KYC ciphertext
 *
 * The platform operator calls setEncryptedKYCAttr() server-side. The browser only reads state.
 *
 * ATTR keys (from contract constants):
 *   ATTR_IS_ACCREDITED = keccak256("IS_ACCREDITED")
 *   ATTR_AML_CLEARED   = keccak256("AML_CLEARED")
 *   ATTR_IS_VERIFIED   = keccak256("IS_VERIFIED")
 */

import {
  useReadContract,
  useAccount,
} from 'wagmi';
import { KYC_REGISTRY_ABI } from '@/lib/contracts/abis';
import { useContractAddresses } from '@/lib/contracts/addresses';

// Attribute key constants (keccak256 of the label — must match contract)
export const ATTR_IS_ACCREDITED =
  '0x3d71f1be9b3d0f85b3de1c8f73b10a94ab59ab3f0d53437ef1cbf1e42c58e81d' as `0x${string}`;
export const ATTR_AML_CLEARED =
  '0x4ae5f0f04e80e6ee6a3e43e56e8dd7bc49baf7e3bfef2e0ca0cfbfe88e498d7d' as `0x${string}`;
export const ATTR_IS_VERIFIED =
  '0x8f4a80f0a40d37f654d1b0c6e3d3fb5be8d1b2e5e0e6c8a0f0b5e3d1c6e8d0a2' as `0x${string}`;

export type KYCStatus = 'not_started' | 'pending' | 'approved' | 'rejected';

/**
 * useKYCAttrValid — check if a KYC attribute is active for a given investor.
 * isAttrValid(compliance, investor, attrKey) — compliance is the T-REX/AssetToken compliance module.
 * We default to ASSET_GOVERNANCE as the platform compliance address.
 */
export function useKYCAttrValid(
  investorAddress: `0x${string}` | undefined,
  attrKey: `0x${string}`,
  complianceAddress?: `0x${string}`,
) {
  const { FHE_KYC_REGISTRY, ASSET_GOVERNANCE } = useContractAddresses();
  const compliance = complianceAddress ?? ASSET_GOVERNANCE;

  const { data, isLoading, refetch } = useReadContract({
    address: FHE_KYC_REGISTRY,
    abi: KYC_REGISTRY_ABI,
    functionName: 'isAttrValid',
    args: investorAddress ? [compliance, investorAddress, attrKey] : undefined,
    query: { enabled: !!investorAddress },
  });

  return {
    isValid: (data as boolean) ?? false,
    isLoading,
    refetch,
  };
}

/**
 * useKYCVerified — check if a wallet has the IS_VERIFIED attribute set.
 * This is the primary gate for accessing the platform.
 */
export function useKYCVerified(walletAddress?: `0x${string}`) {
  const { address: connectedWallet } = useAccount();
  const target = walletAddress ?? connectedWallet;
  return useKYCAttrValid(target, ATTR_IS_VERIFIED);
}

/**
 * useKYCAccredited — check if a wallet has IS_ACCREDITED attribute set.
 */
export function useKYCAccredited(walletAddress?: `0x${string}`) {
  const { address: connectedWallet } = useAccount();
  const target = walletAddress ?? connectedWallet;
  return useKYCAttrValid(target, ATTR_IS_ACCREDITED);
}

/**
 * useKYCAMLCleared — check if a wallet has AML_CLEARED attribute set.
 */
export function useKYCAMLCleared(walletAddress?: `0x${string}`) {
  const { address: connectedWallet } = useAccount();
  const target = walletAddress ?? connectedWallet;
  return useKYCAttrValid(target, ATTR_AML_CLEARED);
}

/**
 * useKYCStatus — derives a user-friendly status for the connected wallet.
 *
 * The flow on AssetsGrator:
 *   1. User completes off-chain KYC form → stored in backend DB
 *   2. Backend marks as "pending" in its own state (no on-chain tx needed to request)
 *   3. Admin/operator calls setEncryptedKYCAttr server-side → IS_VERIFIED written on-chain
 *   4. isAttrValid returns true → approved
 *
 * The frontend reads IS_VERIFIED attr to show status. "pending" is inferred from
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
