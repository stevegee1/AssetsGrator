// Deployed contract addresses — Polygon Amoy testnet (chainId 80002)
// Last deployed: 2026-03-10 — post-audit redeployment (v2)

export const ADDRESSES = {
  mumbai: {
    // ── ERC-3643 / T-REX Platform contracts ──────────────────────────────────
    PROPERTY_FACTORY: (process.env.NEXT_PUBLIC_PROPERTY_FACTORY ??
      "0xAD0c595D27FdACc28462c2F30e121Dcd64e8EF9B") as `0x${string}`,

    PROPERTY_MARKETPLACE: (process.env.NEXT_PUBLIC_PROPERTY_MARKETPLACE ??
      "0x167C5d0167D38dACdF6c2eD4e960E402bb4ADe67") as `0x${string}`,

    PROPERTY_REGISTRY: (process.env.NEXT_PUBLIC_PROPERTY_REGISTRY ??
      "0x00E769bBC6960C82fF6d0836f642331B6A58b79D") as `0x${string}`,

    // ── T-REX Identity Registry infrastructure ───────────────────────────────
    IDENTITY_REGISTRY: (process.env.NEXT_PUBLIC_IDENTITY_REGISTRY ??
      "0x0B47038aD91Ae237f28899a8fC89D53e4Dd53Ea9") as `0x${string}`,

    TRUSTED_ISSUERS_REGISTRY: (process.env
      .NEXT_PUBLIC_TRUSTED_ISSUERS_REGISTRY ??
      "0xb05A96a4cc1eBa654a3687852655c044C2ddA756") as `0x${string}`,

    CLAIM_TOPICS_REGISTRY: (process.env.NEXT_PUBLIC_CLAIM_TOPICS_REGISTRY ??
      "0x6b82A3c6Ee7105a5a7025813B495F247830cD2A3") as `0x${string}`,

    IDENTITY_REGISTRY_STORAGE: (process.env
      .NEXT_PUBLIC_IDENTITY_REGISTRY_STORAGE ??
      "0xE341fdd836caE67DeE2B519b07DE0aBEb3C3f875") as `0x${string}`,

    // ── Implementation contracts (not called directly by frontend) ────────────
    KYC_COMPLIANCE_MODULE:
      "0xbCfA160D9B1Db2390Eb88a76C32B1298655B4162" as `0x${string}`,
    COMPLIANCE_IMPLEMENTATION:
      "0x96ce0D4706c1bCb34AEC5782d48Aeb82C5308d2B" as `0x${string}`,
    PROPERTY_TOKEN_IMPLEMENTATION:
      "0xB3F65DA721f72186Dca0617DDeD0CB1ab4C1fF37" as `0x${string}`,

    // ── Payment token (USDC on Polygon Amoy) ─────────────────────────────────
    USDC: (process.env.NEXT_PUBLIC_USDC_ADDRESS ??
      "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582") as `0x${string}`,
  },
  polygon: {
    PROPERTY_FACTORY: "" as `0x${string}`,
    PROPERTY_MARKETPLACE: "" as `0x${string}`,
    PROPERTY_REGISTRY: "" as `0x${string}`,
    IDENTITY_REGISTRY: "" as `0x${string}`,
    TRUSTED_ISSUERS_REGISTRY: "" as `0x${string}`,
    CLAIM_TOPICS_REGISTRY: "" as `0x${string}`,
    IDENTITY_REGISTRY_STORAGE: "" as `0x${string}`,
    KYC_COMPLIANCE_MODULE: "" as `0x${string}`,
    COMPLIANCE_IMPLEMENTATION: "" as `0x${string}`,
    PROPERTY_TOKEN_IMPLEMENTATION: "" as `0x${string}`,
    USDC: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359" as `0x${string}`,
  },
} as const;

// Deployed individual property token contracts (populated dynamically)
export const DEMO_PROPERTY_CONTRACTS: Record<string, { token: `0x${string}` }> =
  {};
