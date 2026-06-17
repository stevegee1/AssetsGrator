// scripts/deploy.js — Full AssetsGrator deployment: Asset suite + plaintext FeeManager
// Target: Arbitrum Sepolia (L2 — low gas)
//
// Deploy order:
//   1. T-REX identity registry infrastructure
//   2. ModularCompliance + KYCComplianceModule + RetailInvestorCap implementations
//   3. AssetToken implementation (master clone)
//   4. MockUSDC (Sepolia testnet only)
//   5. FeeManager (plaintext basis-point fee rates)
//   6. AssetFactory
//   7. AssetMarketplace + AssetRegistry
//   8. AssetValuation (public oracle)
//
// Run: npx hardhat run scripts/deploy.js --network arbitrumSepolia

const hre    = require("hardhat");
const { ethers } = hre;
const fs   = require("fs");
const path = require("path");

// ─── Fee config ─────────────────────────────────────────────────────────────
// Platform: 2% | Maintenance reserve: 1% | Exit fee: 1.5% | Marketplace: 1%
const PLATFORM_REVENUE_BPS    = 200;   // 2%
const MAINTENANCE_RESERVE_BPS = 100;   // 1%
const EXIT_FEE_BPS            = 150;   // 1.5%
const MARKETPLACE_FEE_BPS     = 100;   // 1%
const MAX_PLATFORM_BPS        = 1000;  // cap: 10%
const MAX_MAINTENANCE_BPS     = 500;   // cap: 5%
const MAX_EXIT_FEE_BPS        = 500;   // cap: 5%
const MAX_MARKETPLACE_BPS     = 500;   // cap: 5%

async function main() {
  const [deployer] = await ethers.getSigners();
  const network    = hre.network.name;

  console.log("\n=======================================================");
  console.log("  AssetsGrator — Full Platform Deployment");
  console.log("=======================================================");
  console.log(`Network  : ${network}`);
  console.log(`Deployer : ${deployer.address}`);
  const bal = await ethers.provider.getBalance(deployer.address);
  console.log(`Balance  : ${ethers.formatEther(bal)} ETH`);
  console.log("=======================================================\n");

  if (bal < ethers.parseEther("0.05")) {
    throw new Error("Deployer balance too low — fund with at least 0.05 ETH");
  }

  // ─── 1. T-REX Identity Registry infrastructure ────────────────────────────
  console.log("1/8  Deploying T-REX registry infrastructure...");

  const ClaimTopicsRegistry = await ethers.getContractFactory("ClaimTopicsRegistry");
  const claimTopicsRegistry = await ClaimTopicsRegistry.deploy();
  await claimTopicsRegistry.waitForDeployment();
  const ctrAddr = await claimTopicsRegistry.getAddress();
  await (await claimTopicsRegistry.init()).wait();
  console.log(`      ClaimTopicsRegistry     : ${ctrAddr}`);

  const TrustedIssuersRegistry = await ethers.getContractFactory("TrustedIssuersRegistry");
  const trustedIssuersRegistry = await TrustedIssuersRegistry.deploy();
  await trustedIssuersRegistry.waitForDeployment();
  const tirAddr = await trustedIssuersRegistry.getAddress();
  await (await trustedIssuersRegistry.init()).wait();
  console.log(`      TrustedIssuersRegistry  : ${tirAddr}`);

  const IdentityRegistryStorage = await ethers.getContractFactory("IdentityRegistryStorage");
  const identityRegistryStorage = await IdentityRegistryStorage.deploy();
  await identityRegistryStorage.waitForDeployment();
  const irsAddr = await identityRegistryStorage.getAddress();
  await (await identityRegistryStorage.init()).wait();
  console.log(`      IdentityRegistryStorage : ${irsAddr}`);

  const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
  const identityRegistry = await IdentityRegistry.deploy();
  await identityRegistry.waitForDeployment();
  const irAddr = await identityRegistry.getAddress();
  await (await identityRegistry.init(tirAddr, ctrAddr, irsAddr)).wait();
  console.log(`      IdentityRegistry        : ${irAddr}`);

  await (await identityRegistryStorage.bindIdentityRegistry(irAddr)).wait();
  console.log("      IdentityRegistryStorage bound ✓");

  // Add deployer as trusted KYC issuer
  const KYC_CLAIM_TOPIC = 1;
  await (await claimTopicsRegistry.addClaimTopic(KYC_CLAIM_TOPIC)).wait();
  await (await trustedIssuersRegistry.addTrustedIssuer(deployer.address, [KYC_CLAIM_TOPIC])).wait();
  console.log(`      Deployer registered as trusted KYC issuer ✓`);

  // ─── 2. ModularCompliance + KYCComplianceModule + RetailInvestorCap ───────
  console.log("\n2/8  Deploying compliance implementations...");

  const ModularCompliance = await ethers.getContractFactory("ModularCompliance");
  const complianceImpl    = await ModularCompliance.deploy();
  await complianceImpl.waitForDeployment();
  const complianceImplAddr = await complianceImpl.getAddress();
  console.log(`      ModularCompliance impl  : ${complianceImplAddr}`);

  const KYCModule    = await ethers.getContractFactory("KYCComplianceModule");
  const kycModule    = await KYCModule.deploy();
  await kycModule.waitForDeployment();
  const kycModuleAddr = await kycModule.getAddress();
  console.log(`      KYCComplianceModule     : ${kycModuleAddr}`);

  const RetailCap    = await ethers.getContractFactory("RetailInvestorCap");
  const retailCap    = await RetailCap.deploy();
  await retailCap.waitForDeployment();
  const retailCapAddr = await retailCap.getAddress();
  console.log(`      RetailInvestorCap       : ${retailCapAddr}`);

  // ─── 3. AssetToken implementation ─────────────────────────────────────────
  console.log("\n3/8  Deploying AssetToken implementation (master clone)...");

  const AssetToken     = await ethers.getContractFactory("AssetToken");
  const assetTokenImpl = await AssetToken.deploy();
  await assetTokenImpl.waitForDeployment();
  const assetTokenImplAddr = await assetTokenImpl.getAddress();
  console.log(`      AssetToken impl         : ${assetTokenImplAddr}`);

  // ─── 4. GBPPlatformToken (fiat platform ledger) ───────────────────────────
  console.log("\n4/8  Deploying GBPPlatformToken...");

  let usdcAddr = process.env.GBP_TOKEN_ADDRESS || process.env.USDC_ADDRESS;
  if (!usdcAddr) {
    const GBPPlatformToken = await ethers.getContractFactory("GBPPlatformToken");
    const gbpToken = await GBPPlatformToken.deploy(deployer.address);
    await gbpToken.waitForDeployment();
    usdcAddr      = await gbpToken.getAddress();
    await (await gbpToken.mint(deployer.address, ethers.parseUnits("10000000", 6))).wait();
    console.log(`      GBPPlatformToken (minted 10M) : ${usdcAddr}`);
  } else {
    console.log(`      GBPPlatformToken (from env)   : ${usdcAddr}`);
  }

  // ─── 5. FeeManager (plaintext) ────────────────────────────────────────────
  console.log("\n5/8  Deploying FeeManager...");

  const FeeManager = await ethers.getContractFactory("FeeManager");
  const feeManager = await FeeManager.deploy(
    PLATFORM_REVENUE_BPS,
    MAINTENANCE_RESERVE_BPS,
    EXIT_FEE_BPS,
    MARKETPLACE_FEE_BPS,
    MAX_PLATFORM_BPS,
    MAX_MAINTENANCE_BPS,
    MAX_EXIT_FEE_BPS,
    MAX_MARKETPLACE_BPS,
    deployer.address
  );
  await feeManager.waitForDeployment();
  const feeManagerAddr = await feeManager.getAddress();
  console.log(`      FeeManager              : ${feeManagerAddr}`);

  // ─── 6. AssetFactory ──────────────────────────────────────────────────────
  console.log("\n6/8  Deploying AssetFactory...");

  const PLATFORM_WALLET = process.env.PLATFORM_WALLET || deployer.address;

  const AssetFactory     = await ethers.getContractFactory("AssetFactory");
  const assetFactory     = await AssetFactory.deploy();
  await assetFactory.waitForDeployment();
  const factoryAddr      = await assetFactory.getAddress();
  await (await assetFactory.initialize(
    assetTokenImplAddr,
    complianceImplAddr,
    kycModuleAddr,
    retailCapAddr,
    irAddr,
    feeManagerAddr,
    usdcAddr,
    PLATFORM_WALLET,
  )).wait();
  console.log(`      AssetFactory            : ${factoryAddr}`);

  // ─── 7. AssetMarketplace + AssetRegistry + AssetGovernance ───────────────
  console.log("\n7/8  Deploying AssetMarketplace, AssetRegistry, AssetGovernance...");

  const AssetMarketplace    = await ethers.getContractFactory("AssetMarketplace");
  const assetMarketplace    = await AssetMarketplace.deploy();
  await assetMarketplace.waitForDeployment();
  const marketplaceAddr     = await assetMarketplace.getAddress();
  await (await assetMarketplace.initialize(
    factoryAddr,
    usdcAddr,
    PLATFORM_WALLET,
    feeManagerAddr
  )).wait();
  console.log(`      AssetMarketplace        : ${marketplaceAddr}`);

  const AssetRegistry = await ethers.getContractFactory("AssetRegistry");
  const assetRegistry = await AssetRegistry.deploy();
  await assetRegistry.waitForDeployment();
  const registryAddr  = await assetRegistry.getAddress();
  await (await assetRegistry.initialize(factoryAddr)).wait();
  console.log(`      AssetRegistry           : ${registryAddr}`);

  // ─── 8. AssetValuation (public oracle) ───────────────────────────────────
  console.log("\n8/9  Deploying AssetValuation oracle...");

  const AssetValuation = await ethers.getContractFactory("AssetValuation");
  const assetValuation = await AssetValuation.deploy();
  await assetValuation.waitForDeployment();
  const valuationAddr  = await assetValuation.getAddress();
  await (await assetValuation.authoriseValuator(deployer.address)).wait();
  console.log(`      AssetValuation          : ${valuationAddr}`);
  console.log("      Deployer authorised as valuator ✓");


  // ─── 9. HydroAsset (hydrogen pre-purchase marketplace) ───────────────────
  console.log("\n9/9  Deploying HydroAsset...");

  const HydroAssetFactory = await ethers.getContractFactory("HydroAsset");
  const hydroAsset = await HydroAssetFactory.deploy(
    usdcAddr,
    PLATFORM_WALLET,
    irAddr,
    "https://api.assetsgrator.com/metadata/hydro/{id}.json"
  );
  await hydroAsset.waitForDeployment();
  const hydroAssetAddr = await hydroAsset.getAddress();
  
  // Whitelist deployer as a producer for testing purposes
  await (await hydroAsset.setProducerStatus(deployer.address, true)).wait();
  console.log(`      HydroAsset              : ${hydroAssetAddr}`);
  console.log("      Deployer registered as whitelisted producer ✓");

  // ─── Summary ──────────────────────────────────────────────────────────────
  const addresses = {
    network,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    // T-REX Infrastructure
    ClaimTopicsRegistry:      ctrAddr,
    TrustedIssuersRegistry:   tirAddr,
    IdentityRegistryStorage:  irsAddr,
    IdentityRegistry:         irAddr,
    // Compliance
    ComplianceImplementation: complianceImplAddr,
    KYCComplianceModule:      kycModuleAddr,
    RetailInvestorCap:        retailCapAddr,
    // Asset suite
    AssetTokenImplementation: assetTokenImplAddr,
    AssetFactory:             factoryAddr,
    AssetMarketplace:         marketplaceAddr,
    AssetRegistry:            registryAddr,
    HydroAsset:               hydroAssetAddr,
    // Payment token
    USDC:                     usdcAddr, // maps to GBPPlatformToken address under-the-hood
    // Fee Manager
    FeeManager:               feeManagerAddr,
    // Valuation oracle
    AssetValuation:           valuationAddr,
  };

  console.log("\n=======================================================");
  console.log("  Deployment Complete ✅");
  console.log("=======================================================");
  console.log(JSON.stringify(addresses, null, 2));

  const outPath = path.join(__dirname, "../deployed-addresses.json");
  fs.writeFileSync(outPath, JSON.stringify(addresses, null, 2));
  console.log(`\nAddresses saved → deployed-addresses.json`);
  console.log("\nNext steps:");
  console.log("  1. Copy addresses to frontend/.env.local");
  console.log("  2. Verify contracts: npx hardhat verify --network arbitrumSepolia <address>");
  console.log("  3. Fund treasury wallet with GBP for revenue operations");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
