import { ethers, upgrades } from "hardhat";
import { Contract } from "ethers";

// ─── ERC-3643 imports — deployed by you or use existing registry ──────────────
// When deploying to a new network, you need to deploy these base ERC-3643
// contracts first. On testnets, Tokeny may have public deployments you can reuse.

const PROPERTY_TYPES = { RESIDENTIAL: 0, COMMERCIAL: 1, LAND: 2, MIXED: 3 };

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("\n🏗️  Deploying RWA Platform");
  console.log("   Deployer:", deployer.address);
  console.log("   Network: ", (await ethers.provider.getNetwork()).name);
  console.log("─".repeat(60));

  // ════════════════════════════════════════════════════════════════
  // STEP 1: Deploy ERC-3643 base infrastructure
  // ════════════════════════════════════════════════════════════════
  console.log("\n📋 Step 1: ERC-3643 Infrastructure");

  // 1a. Claim Topics Registry
  const ClaimTopicsRegistry = await ethers.getContractFactory("ClaimTopicsRegistry");
  const claimTopicsRegistry = await upgrades.deployProxy(ClaimTopicsRegistry, [], {
    initializer: "init",
  });
  await claimTopicsRegistry.waitForDeployment();
  const ctrAddr = await claimTopicsRegistry.getAddress();
  console.log("   ✓ ClaimTopicsRegistry:       ", ctrAddr);

  // Add KYC claim topic (topic 1 = KYC by convention)
  await claimTopicsRegistry.addClaimTopic(1);
  console.log("   ✓ Added claim topic: 1 (KYC)");

  // 1b. Trusted Issuers Registry
  const TrustedIssuersRegistry = await ethers.getContractFactory("TrustedIssuersRegistry");
  const trustedIssuersRegistry = await upgrades.deployProxy(TrustedIssuersRegistry, [], {
    initializer: "init",
  });
  await trustedIssuersRegistry.waitForDeployment();
  const tirAddr = await trustedIssuersRegistry.getAddress();
  console.log("   ✓ TrustedIssuersRegistry:    ", tirAddr);

  // 1c. Identity Registry Storage
  const IdentityRegistryStorage = await ethers.getContractFactory("IdentityRegistryStorage");
  const identityRegistryStorage = await upgrades.deployProxy(IdentityRegistryStorage, [], {
    initializer: "init",
  });
  await identityRegistryStorage.waitForDeployment();
  const irsAddr = await identityRegistryStorage.getAddress();
  console.log("   ✓ IdentityRegistryStorage:   ", irsAddr);

  // 1d. Identity Registry (shared across all properties on this platform)
  const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
  const identityRegistry = await upgrades.deployProxy(
    IdentityRegistry,
    [tirAddr, ctrAddr, irsAddr],
    { initializer: "init" }
  );
  await identityRegistry.waitForDeployment();
  const irAddr = await identityRegistry.getAddress();
  console.log("   ✓ IdentityRegistry:          ", irAddr);

  // Bind storage to registry
  await identityRegistryStorage.bindIdentityRegistry(irAddr);
  console.log("   ✓ Bound IdentityRegistryStorage → IdentityRegistry");

  // ════════════════════════════════════════════════════════════════
  // STEP 2: Deploy implementation contracts (used as Clone templates)
  // ════════════════════════════════════════════════════════════════
  console.log("\n📋 Step 2: Implementation Contracts (Clone Templates)");

  const PropertyTokenImpl = await ethers.getContractFactory("PropertyToken");
  const propertyTokenImpl = await PropertyTokenImpl.deploy();
  await propertyTokenImpl.waitForDeployment();
  const tokenImplAddr = await propertyTokenImpl.getAddress();
  console.log("   ✓ PropertyToken impl:        ", tokenImplAddr);

  const ModularCompliance = await ethers.getContractFactory("ModularCompliance");
  const complianceImpl = await ModularCompliance.deploy();
  await complianceImpl.waitForDeployment();
  const compImplAddr = await complianceImpl.getAddress();
  console.log("   ✓ ModularCompliance impl:    ", compImplAddr);

  const KYCModule = await ethers.getContractFactory("KYCComplianceModule");
  const kycModuleImpl = await KYCModule.deploy();
  await kycModuleImpl.waitForDeployment();
  const kycImplAddr = await kycModuleImpl.getAddress();
  console.log("   ✓ KYCComplianceModule impl:  ", kycImplAddr);

  // ════════════════════════════════════════════════════════════════
  // STEP 3: Deploy PropertyFactory
  // ════════════════════════════════════════════════════════════════
  console.log("\n📋 Step 3: PropertyFactory");

  const PropertyFactory = await ethers.getContractFactory("PropertyFactory");
  const factory = await upgrades.deployProxy(
    PropertyFactory,
    [tokenImplAddr, compImplAddr, kycImplAddr, irAddr],
    { initializer: "initialize" }
  );
  await factory.waitForDeployment();
  const factoryAddr = await factory.getAddress();
  console.log("   ✓ PropertyFactory:           ", factoryAddr);

  // ════════════════════════════════════════════════════════════════
  // STEP 4: Deploy PropertyMarketplace
  // ════════════════════════════════════════════════════════════════
  console.log("\n📋 Step 4: PropertyMarketplace");

  // Using ETH as payment (paymentToken = address(0))
  // For USDC: replace address(0) with USDC contract address
  const PropertyMarketplace = await ethers.getContractFactory("PropertyMarketplace");
  const marketplace = await upgrades.deployProxy(
    PropertyMarketplace,
    [
      factoryAddr,
      ethers.ZeroAddress,    // paymentToken: address(0) = ETH (change to USDC addr)
      deployer.address,      // feeRecipient
      100,                   // platformFeeBPS: 100 = 1%
    ],
    { initializer: "initialize" }
  );
  await marketplace.waitForDeployment();
  const marketplaceAddr = await marketplace.getAddress();
  console.log("   ✓ PropertyMarketplace:       ", marketplaceAddr);

  // ════════════════════════════════════════════════════════════════
  // STEP 5: Deploy PropertyRegistry
  // ════════════════════════════════════════════════════════════════
  console.log("\n📋 Step 5: PropertyRegistry");

  const PropertyRegistry = await ethers.getContractFactory("PropertyRegistry");
  const registry = await upgrades.deployProxy(
    PropertyRegistry,
    [factoryAddr],
    { initializer: "initialize" }
  );
  await registry.waitForDeployment();
  const registryAddr = await registry.getAddress();
  console.log("   ✓ PropertyRegistry:          ", registryAddr);

  // ════════════════════════════════════════════════════════════════
  // STEP 6: Example — Deploy a sample property
  // ════════════════════════════════════════════════════════════════
  console.log("\n📋 Step 6: Sample Property Deployment");

  // Add deployer as agent on IdentityRegistry so we can register investors
  await identityRegistry.addAgent(deployer.address);
  await identityRegistry.addAgent(marketplaceAddr);

  // Deploy example residential property
  const samplePropertyTx = await factory.deployProperty({
    name:         "Maitama Duplex Block A",
    symbol:       "MDUP-A",
    ipfsCID:      "QmExampleCIDReplaceWithRealIPFSHash",  // replace with real IPFS CID
    location:     "Plot 1234, Maitama District, Abuja, Nigeria",
    propType:     PROPERTY_TYPES.RESIDENTIAL,
    totalSupply:  1_000_000,                              // 1,000,000 fractional units
    pricePerUnit: ethers.parseUnits("0.5", 18),           // $0.50 per unit
    valuationUSD: ethers.parseUnits("500000", 18),        // $500,000 total value
    identityRegistry: ethers.ZeroAddress,                 // uses default (shared) registry
    compliance:   ethers.ZeroAddress,                     // factory creates new one
  });

  const receipt = await samplePropertyTx.wait();

  // Get deployed token address from event
  const deployEvent = receipt?.logs
    .map((log: any) => {
      try { return factory.interface.parseLog(log); } catch { return null; }
    })
    .find((e: any) => e?.name === "PropertyDeployed");

  const tokenAddress = deployEvent?.args?.tokenAddress;
  console.log("   ✓ Sample PropertyToken:      ", tokenAddress);

  // Activate the property and mint supply to marketplace as treasury
  const propertyToken = await ethers.getContractAt("PropertyToken", tokenAddress);
  await propertyToken.addAgent(deployer.address);
  await propertyToken.addAgent(marketplaceAddr);

  // Register marketplace as a KYC'd address so it can hold tokens (treasury)
  // In production: marketplace must have its own ONCHAINID + KYC claim
  // For local/dev: you can add it manually via the identity registry
  // await identityRegistry.registerIdentity(marketplaceAddr, onchainIdAddr, 566); // 566 = NGA

  console.log("   ✓ Property token configured");

  // ════════════════════════════════════════════════════════════════
  // SUMMARY
  // ════════════════════════════════════════════════════════════════
  console.log("\n" + "═".repeat(60));
  console.log("✅  DEPLOYMENT COMPLETE");
  console.log("═".repeat(60));
  console.log(JSON.stringify({
    erc3643: {
      claimTopicsRegistry:      ctrAddr,
      trustedIssuersRegistry:   tirAddr,
      identityRegistryStorage:  irsAddr,
      identityRegistry:         irAddr,
    },
    implementations: {
      propertyToken:            tokenImplAddr,
      modularCompliance:        compImplAddr,
      kycModule:                kycImplAddr,
    },
    platform: {
      propertyFactory:          factoryAddr,
      propertyMarketplace:      marketplaceAddr,
      propertyRegistry:         registryAddr,
    },
    sampleProperty: {
      tokenAddress:             tokenAddress,
    },
  }, null, 2));

  console.log("\n📌 Next steps:");
  console.log("   1. Add your KYC provider's address as a trusted issuer:");
  console.log(`      trustedIssuersRegistry.addTrustedIssuer(kycProviderAddr, [1])`);
  console.log("   2. Upload real property docs/images to IPFS and update CID:");
  console.log(`      propertyToken.updateIPFSMetadata(realCID)`);
  console.log("   3. Register marketplace in IdentityRegistry with ONCHAINID");
  console.log("   4. Activate property and mint supply to treasury:");
  console.log(`      propertyToken.activate(treasuryAddress)`);
  console.log("   5. Register treasury in marketplace:");
  console.log(`      marketplace.registerPropertyTreasury(tokenAddress, treasuryAddress)`);
  console.log("   6. Investors complete KYC → claim added to ONCHAINID → can buy");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
