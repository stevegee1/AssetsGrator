// scripts/deploy.js — Full AssetsGrator deployment: Asset* + FHE suite
// Target: Arbitrum Sepolia (Fhenix CoFHE co-processor network, L2 — low gas)
//
// Deploy order:
//   1. T-REX identity registry infrastructure
//   2. ModularCompliance + KYCComplianceModule implementations
//   3. AssetToken implementation (master clone)
//   4. AssetFactory (ERC1967 proxy)
//   5. AssetMarketplace + AssetRegistry + AssetGovernance
//   6. MockUSDC (Sepolia testnet only — replace with real USDC on mainnet)
//   7. FHEKYCRegistry
//   8. FHEAssetValuation
//   9. FHEFeeManager  (encrypted fee rates via CoFHE)
//  10. ConfidentialLoan
//
// Run: npx hardhat run scripts/deploy.js --network sepolia

const hre    = require("hardhat");
const { ethers } = hre;
const fs   = require("fs");
const path = require("path");

// ─── Fee config ─────────────────────────────────────────────────────────────
// Platform: 2% | Maintenance reserve: 1% | Exit fee: 1.5%
// These are plaintext values — FHEFeeManager encrypts them via the CoFHE
// co-processor when the constructor calls FHE.asEuint32().
// InEuint32 is passed as { data: bytes, securityZone: 0 } — the CoFHE plugin
// intercepts the FHE.asEuint32 call and encrypts it on-chain during deployment.
const PLATFORM_REVENUE_BPS    = 200;   // 2%
const MAINTENANCE_RESERVE_BPS = 100;   // 1%
const EXIT_FEE_BPS            = 150;   // 1.5%
const MARKETPLACE_FEE_BPS     = 100;   // 1% (primary/secondary market commission)
const MAX_PLATFORM_BPS        = 1000;  // cap: 10%
const MAX_MAINTENANCE_BPS     = 500;   // cap: 5%
const MAX_EXIT_FEE_BPS        = 500;   // cap: 5%
const MAX_MARKETPLACE_BPS     = 500;   // cap: 5%

// ─── Loan config ─────────────────────────────────────────────────────────────
const MAX_LTV_BPS          = 7500;              // 75% max LTV
const MAX_LOAN_DURATION    = 365 * 24 * 60 * 60; // 1 year in seconds
const MIN_TREASURY_USDC    = ethers.parseUnits("1000", 6); // 1,000 USDC min

async function main() {
  const [deployer] = await ethers.getSigners();
  const network    = hre.network.name;

  console.log("\n=======================================================");
  console.log("  AssetsGrator — Full Platform Deployment");
  console.log("  Asset* suite + Fhenix FHE contracts");
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
  console.log("1/10  Deploying T-REX registry infrastructure...");

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

  // ─── 2. ModularCompliance + KYCComplianceModule ───────────────────────────
  console.log("\n2/10  Deploying compliance implementations...");

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

  // ─── 3. AssetToken implementation ─────────────────────────────────────────
  console.log("\n3/10  Deploying AssetToken implementation (master clone)...");

  const AssetToken     = await ethers.getContractFactory("AssetToken");
  const assetTokenImpl = await AssetToken.deploy();
  await assetTokenImpl.waitForDeployment();
  const assetTokenImplAddr = await assetTokenImpl.getAddress();
  console.log(`      AssetToken impl         : ${assetTokenImplAddr}`);

  // ─── 4. MockUSDC (Sepolia testnet only) ───────────────────────────────────
  console.log("\n4/10  Deploying MockUSDC (testnet stablecoin)...");

  let usdcAddr = process.env.USDC_ADDRESS;
  if (!usdcAddr) {
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUsdc = await MockUSDC.deploy();
    await mockUsdc.waitForDeployment();
    usdcAddr      = await mockUsdc.getAddress();
    // Mint 10M USDC to deployer (platform treasury)
    await (await mockUsdc.faucet(deployer.address, ethers.parseUnits("10000000", 6))).wait();
    console.log(`      MockUSDC (minted 10M)   : ${usdcAddr}`);
  } else {
    console.log(`      USDC (from env)         : ${usdcAddr}`);
  }

  // ─── 5. FHE Privacy Layer — Fee Manager ──────────────────────────────────
  console.log("\n5/10  Deploying FHEFeeManager (Encrypted Fees)...");
  
  // Encrypt basis points using the CoFHE SDK before deployment.
  // On live networks (arbSepolia), use createCofheConfig with the live environment.
  // On hardhat, createClientWithBatteries handles everything automatically.
  console.log("      Encrypting fee rates via CoFHE SDK...");
  const { createCofheConfig, createCofheClient } = require("@cofhe/sdk/node");
  const { arbSepolia, hardhat: hardhatChain } = require("@cofhe/sdk/chains");
  const { Encryptable } = require("@cofhe/sdk");

  let cofheClient;
  if (network === "hardhat" || network === "localcofhe") {
    cofheClient = await hre.cofhe.createClientWithBatteries(deployer);
  } else {
    // Live network (arbitrumSepolia / arb-sepolia)
    const cofheConfig = await createCofheConfig({
      environment: "node",
      supportedChains: [arbSepolia],
    });
    cofheClient = createCofheClient(cofheConfig);
    await hre.cofhe.connectWithHardhatSigner(cofheClient, deployer);
    await cofheClient.permits.createSelf({ issuer: deployer.address });
  }

  const [encPlatform, encMaint, encExit, encMarket] = await cofheClient
    .encryptInputs([
      Encryptable.uint32(PLATFORM_REVENUE_BPS),
      Encryptable.uint32(MAINTENANCE_RESERVE_BPS),
      Encryptable.uint32(EXIT_FEE_BPS),
      Encryptable.uint32(MARKETPLACE_FEE_BPS),
    ])
    .execute();

  const FHEFeeManager    = await ethers.getContractFactory("FHEFeeManager");
  const fheFeeManager    = await FHEFeeManager.deploy(
    encPlatform,
    encMaint,
    encExit,
    encMarket,
    MAX_PLATFORM_BPS,
    MAX_MAINTENANCE_BPS,
    MAX_EXIT_FEE_BPS,
    MAX_MARKETPLACE_BPS,
    deployer.address
  );
  await fheFeeManager.waitForDeployment();
  const fheFeeManagerAddr = await fheFeeManager.getAddress();
  console.log(`      FHEFeeManager (Encrypted) : ${fheFeeManagerAddr}`);


  // ─── 6. FHE Privacy Layer — Portfolio Registry ────────────────────────────
  console.log("\n6/10  Deploying FHEPortfolioRegistry (Encrypted Portfolios)...");

  const FHEPortfolioRegistry = await ethers.getContractFactory("FHEPortfolioRegistry");
  const fhePortfolioRegistry = await FHEPortfolioRegistry.deploy(deployer.address);
  await fhePortfolioRegistry.waitForDeployment();
  const fhePortfolioAddr      = await fhePortfolioRegistry.getAddress();
  console.log(`      FHEPortfolioRegistry    : ${fhePortfolioAddr}`);

  // ─── 7. AssetFactory (direct deploy + initialize) ─────────────────────────
  console.log("\n7/10  Deploying AssetFactory...");

  const PLATFORM_WALLET = process.env.PLATFORM_WALLET || deployer.address;

  const AssetFactory     = await ethers.getContractFactory("AssetFactory");
  const assetFactory     = await AssetFactory.deploy();
  await assetFactory.waitForDeployment();
  const factoryAddr      = await assetFactory.getAddress();
  await (await assetFactory.initialize(
    assetTokenImplAddr,
    complianceImplAddr,
    kycModuleAddr,
    irAddr,
    fheFeeManagerAddr,
    fhePortfolioAddr,
    usdcAddr,
    PLATFORM_WALLET,
  )).wait();
  console.log(`      AssetFactory            : ${factoryAddr}`);

  // ─── 7. AssetMarketplace + AssetRegistry + AssetGovernance ───────────────
  console.log("\n7/10  Deploying AssetMarketplace, AssetRegistry, AssetGovernance...");
  // ... (rest of the script follows) ...

  const AssetMarketplace    = await ethers.getContractFactory("AssetMarketplace");
  const assetMarketplace    = await AssetMarketplace.deploy();
  await assetMarketplace.waitForDeployment();
  const marketplaceAddr     = await assetMarketplace.getAddress();
  await (await assetMarketplace.initialize(
    factoryAddr,
    usdcAddr,
    PLATFORM_WALLET,
    fheFeeManagerAddr
  )).wait();
  console.log(`      AssetMarketplace        : ${marketplaceAddr}`);

  const AssetRegistry = await ethers.getContractFactory("AssetRegistry");
  const assetRegistry = await AssetRegistry.deploy();
  await assetRegistry.waitForDeployment();
  const registryAddr  = await assetRegistry.getAddress();
  await (await assetRegistry.initialize(factoryAddr)).wait();
  console.log(`      AssetRegistry           : ${registryAddr}`);

  const AssetGovernance = await ethers.getContractFactory("AssetGovernance");
  const assetGovernance = await AssetGovernance.deploy(
    factoryAddr,
    100,                  // proposalThresholdBps — 1% of supply to propose
    2_000,               // quorumBps            — 20% quorum required
    7 * 24 * 60 * 60,   // votingPeriod         — 7 days
    2 * 24 * 60 * 60,   // executionDelay       — 2 day timelock
    7 * 24 * 60 * 60,   // gracePeriod          — 7 days to execute
  );
  await assetGovernance.waitForDeployment();
  const governanceAddr  = await assetGovernance.getAddress();
  console.log(`      AssetGovernance         : ${governanceAddr}`);


  // ─── 8. FHEKYCRegistry ────────────────────────────────────────────────────
  console.log("\n8/10  Deploying FHEKYCRegistry...");

  const FHEKYCRegistry    = await ethers.getContractFactory("FHEKYCRegistry");
  const fheKycRegistry    = await FHEKYCRegistry.deploy();
  await fheKycRegistry.waitForDeployment();
  const fheKycAddr        = await fheKycRegistry.getAddress();
  console.log(`      FHEKYCRegistry          : ${fheKycAddr}`);

  // ─── 9. FHEAssetValuation ─────────────────────────────────────────────────
  console.log("\n9/10  Deploying FHEAssetValuation...");

  const FHEAssetValuation = await ethers.getContractFactory("FHEAssetValuation");
  const fheValuation      = await FHEAssetValuation.deploy();
  await fheValuation.waitForDeployment();
  const fheValuationAddr  = await fheValuation.getAddress();
  console.log(`      FHEAssetValuation       : ${fheValuationAddr}`);

  // Authorise the deployer as the initial valuator
  await (await fheValuation.authoriseValuator(deployer.address)).wait();
  console.log("      Deployer authorised as valuator ✓");

  // ─── 10. ConfidentialLoan ─────────────────────────────────────────────────
  console.log("\n10/10 Deploying ConfidentialLoan...");

  const TREASURY_WALLET   = process.env.TREASURY_WALLET || deployer.address;

  const ConfidentialLoan  = await ethers.getContractFactory("ConfidentialLoan");
  const confidentialLoan  = await ConfidentialLoan.deploy(
    fheKycAddr,
    fheValuationAddr,
    fheFeeManagerAddr,
    usdcAddr,
    TREASURY_WALLET,
    MAX_LTV_BPS,
    MAX_LOAN_DURATION,
    MIN_TREASURY_USDC,
    deployer.address,
  );
  await confidentialLoan.waitForDeployment();
  const loanAddr = await confidentialLoan.getAddress();
  console.log(`      ConfidentialLoan        : ${loanAddr}`);

  // Authorise loan contract as a KYC provider (reads KYC attrs for borrowers)
  await (await fheKycRegistry.authoriseProvider(loanAddr)).wait();
  // Authorise loan contract as a valuator (reads encrypted asset valuations)
  await (await fheValuation.authoriseValuator(loanAddr)).wait();
  console.log("      ConfidentialLoan wired to FHEKYCRegistry + FHEAssetValuation ✓");

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
    // Asset suite
    AssetTokenImplementation: assetTokenImplAddr,
    AssetFactory:             factoryAddr,
    AssetMarketplace:         marketplaceAddr,
    AssetRegistry:            registryAddr,
    AssetGovernance:          governanceAddr,
    // Payment token
    USDC:                     usdcAddr,
    // FHE Privacy layer
    FHEKYCRegistry:           fheKycAddr,
    FHEAssetValuation:        fheValuationAddr,
    FHEFeeManager:            fheFeeManagerAddr,
    FHEPortfolioRegistry:     fhePortfolioAddr,
    ConfidentialLoan:         loanAddr,
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
  console.log("  2. Verify contracts: npx hardhat verify --network sepolia <address>");
  console.log("  3. Fund treasury wallet with USDC for loan disbursals");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
