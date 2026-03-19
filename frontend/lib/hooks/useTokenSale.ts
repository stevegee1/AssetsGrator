/**
 * useTokenSale — deprecated in ERC-3643 migration.
 * Primary market sales are now handled via PropertyMarketplace.buyFromIssuance().
 * See /lib/hooks/useMarketplace.ts for the new hook.
 * This stub is kept so existing imports don't break.
 */
export function useTokenSale(_tokenSaleAddress?: `0x${string}`) {
  return {
    saleActive: false,
    tokenPrice: 0n,
    totalRaised: 0n,
    totalTokensSold: 0n,
    availableTokens: 0n,
    buy: async (_amount: bigint) => {},
    isBuying: false,
    isBuySuccess: false,
    buyTxHash: undefined,
  };
}
