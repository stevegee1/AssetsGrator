/**
 * usePropertyVault — deprecated in ERC-3643 migration.
 * PropertyVault no longer exists; rental income distribution
 * is handled off-chain or via a future RentalDistributor contract.
 * This stub is kept so existing imports don't break.
 */
export function usePropertyVault(_vaultAddress?: `0x${string}`) {
  return {
    claimableUsdc: "0.00",
    annualRentUsdc: "0.00",
    totalReceived: "0.00",
    totalDistributed: "0.00",
    currentBalance: "0.00",
    propertyValue: "0.00",
    mgmtFeePercent: 0,
    claimRent: () => {},
    isClaiming: false,
    isClaimSuccess: false,
    claimTxHash: undefined,
    refetch: () => {},
  };
}
