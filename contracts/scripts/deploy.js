// scripts/deploy.js — Full ERC-3643 / T-REX deployment
// Run: npx hardhat run scripts/deploy.js --network amoy

const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = hre.network.name;

  console.log("\n=================================================");
  console.log("  ERC-3643 / T-REX Deployment");
  console.log("=================================================");
  console.log(`Network  : ${network}`);
  console.log(`Deployer : ${deployer.address}`);
  const bal = await ethers.provider.getBalance(deployer.address);
  console.log(`Balance  : ${ethers.formatEther(bal)} MATIC`);
  console.log("=================================================\n");

  // ─── 1. Deploy T-REX Identity Registry infrastructure ────────────────────
  console.log("1/8  Deploying T-REX registry infrastructure...");

  const ClaimTopicsRegistry = await ethers.getContractFactory(
    "ClaimTopicsRegistry",
  );
  const claimTopicsRegistry = await ClaimTopicsRegistry.deploy();
  await claimTopicsRegistry.waitForDeployment();
  const ctrAddr = await claimTopicsRegistry.getAddress();
  await (await claimTopicsRegistry.init()).wait();
  console.log(`     ClaimTopicsRegistry     : ${ctrAddr}`);

  const TrustedIssuersRegistry = await ethers.getContractFactory(
    "TrustedIssuersRegistry",
  );
  const trustedIssuersRegistry = await TrustedIssuersRegistry.deploy();
  await trustedIssuersRegistry.waitForDeployment();
  const tirAddr = await trustedIssuersRegistry.getAddress();
  await (await trustedIssuersRegistry.init()).wait();
  console.log(`     TrustedIssuersRegistry  : ${tirAddr}`);

  const IdentityRegistryStorage = await ethers.getContractFactory(
    "IdentityRegistryStorage",
  );
  const identityRegistryStorage = await IdentityRegistryStorage.deploy();
  await identityRegistryStorage.waitForDeployment();
  const irsAddr = await identityRegistryStorage.getAddress();
  await (await identityRegistryStorage.init()).wait();
  console.log(`     IdentityRegistryStorage : ${irsAddr}`);

  const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
  const identityRegistry = await IdentityRegistry.deploy();
  await identityRegistry.waitForDeployment();
  const irAddr = await identityRegistry.getAddress();
  await (await identityRegistry.init(tirAddr, ctrAddr, irsAddr)).wait();
  console.log(`     IdentityRegistry        : ${irAddr}`);

  // Wire IdentityRegistryStorage → IdentityRegistry
  await (await identityRegistryStorage.bindIdentityRegistry(irAddr)).wait();
  console.log("     IdentityRegistryStorage bound ✓");

  // ─── 2. Deploy ModularCompliance implementation ──────────────────────
  console.log("\n2/7  Deploying ModularCompliance implementation...");
  const ModularCompliance = await ethers.getContractFactory(
    "ModularCompliance",
  );
  const complianceImpl = await ModularCompliance.deploy();
  await complianceImpl.waitForDeployment();
  const complianceImplAddr = await complianceImpl.getAddress();
  console.log(`     ModularCompliance impl  : ${complianceImplAddr}`);

  // ─── 3. Deploy KYCComplianceModule (shared singleton) ────────────────────
  console.log("\n3/7  Deploying KYCComplianceModule...");
  const KYCModule = await ethers.getContractFactory("KYCComplianceModule");
  const kycModule = await KYCModule.deploy();
  await kycModule.waitForDeployment();
  const kycModuleAddr = await kycModule.getAddress();
  console.log(`     KYCComplianceModule     : ${kycModuleAddr}`);

  // ─── 4. Deploy PropertyToken implementation (master copy for clones) ─────────
  console.log("\n4/7  Deploying PropertyToken implementation...");
  const PropertyToken = await ethers.getContractFactory("PropertyToken");
  const propertyTokenImpl = await PropertyToken.deploy();
  await propertyTokenImpl.waitForDeployment();
  const propertyTokenImplAddr = await propertyTokenImpl.getAddress();
  console.log(`     PropertyToken impl      : ${propertyTokenImplAddr}`);

  // ─── 5. Deploy PropertyFactory ──────────────────────────────────────────
  console.log("\n5/7  Deploying PropertyFactory...");
  // USDC contract on Polygon Amoy testnet
  const USDC_ADDRESS =
    process.env.USDC_ADDRESS_TESTNET ||
    "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582";
  const PLATFORM_WALLET = process.env.PLATFORM_WALLET || deployer.address;
  const PLATFORM_RENT_BPS = 1_000; // 10% platform cut on rental income
  const EXIT_FEE_BPS = 50; // 0.5% exit fee on redemptions
  const PropertyFactory = await ethers.getContractFactory("PropertyFactory");
  const factory = await PropertyFactory.deploy();
  await factory.waitForDeployment();
  const factoryAddr = await factory.getAddress();

  await (
    await factory.initialize(
      propertyTokenImplAddr,
      complianceImplAddr,
      kycModuleAddr,
      irAddr,
      USDC_ADDRESS,
      PLATFORM_WALLET,
      PLATFORM_RENT_BPS,
      EXIT_FEE_BPS,
    )
  ).wait();
  console.log(`     PropertyFactory         : ${factoryAddr}`);

  // ─── 6. Deploy PropertyMarketplace ─────────────────────────────────────
  console.log("\n6/7  Deploying PropertyMarketplace...");
  const PropertyMarketplace = await ethers.getContractFactory(
    "PropertyMarketplace",
  );
  const marketplace = await PropertyMarketplace.deploy();
  await marketplace.waitForDeployment();
  const marketplaceAddr = await marketplace.getAddress();
  await (
    await marketplace.initialize(
      factoryAddr,
      USDC_ADDRESS, // WHY: USDC not MATIC — platform uses stablecoin payments
      PLATFORM_WALLET, // fee recipient
      100, // platformFeeBPS = 1%
    )
  ).wait();
  console.log(`     PropertyMarketplace     : ${marketplaceAddr}`);

  // ─── 7. Deploy PropertyRegistry ──────────────────────────────────────────
  console.log("\n7/7  Deploying PropertyRegistry...");
  const PropertyRegistry = await ethers.getContractFactory("PropertyRegistry");
  const registry = await PropertyRegistry.deploy();
  await registry.waitForDeployment();
  const registryAddr = await registry.getAddress();
  await (await registry.initialize(factoryAddr)).wait();
  console.log(`     PropertyRegistry        : ${registryAddr}`);

  // ─── Setup: Add KYC claim topic and deployer as trusted issuer ───────────────
  console.log(
    "\n──── Setup: Configuring KYC claim topic and trusted issuer...",
  );
  const KYC_CLAIM_TOPIC = 1;
  await (await claimTopicsRegistry.addClaimTopic(KYC_CLAIM_TOPIC)).wait();
  await (
    await trustedIssuersRegistry.addTrustedIssuer(deployer.address, [
      KYC_CLAIM_TOPIC,
    ])
  ).wait();
  console.log(
    `     Deployer added as trusted KYC issuer for topic ${KYC_CLAIM_TOPIC} ✓`,
  );

  // ─── Summary ──────────────────────────────────────────────────────────────
  const addresses = {
    network,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    ClaimTopicsRegistry: ctrAddr,
    TrustedIssuersRegistry: tirAddr,
    IdentityRegistryStorage: irsAddr,
    IdentityRegistry: irAddr,
    ComplianceImplementation: complianceImplAddr,
    KYCComplianceModule: kycModuleAddr,
    PropertyTokenImplementation: propertyTokenImplAddr,
    PropertyFactory: factoryAddr,
    PropertyMarketplace: marketplaceAddr,
    PropertyRegistry: registryAddr,
  };

  console.log("\n=================================================");
  console.log("  Deployment Complete ✅");
  console.log("=================================================");
  console.log(JSON.stringify(addresses, null, 2));

  const outPath = path.join(__dirname, "../deployed-addresses.json");
  fs.writeFileSync(outPath, JSON.stringify(addresses, null, 2));
  console.log(`\nAddresses saved to deployed-addresses.json`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
