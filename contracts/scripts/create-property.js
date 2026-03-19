/**
 * create-property.js
 * Deploys a full property set (SecurityToken, PropertyVault, PropertyGovernance, TokenSale)
 * then registers it in PropertyFactory.
 *
 * Usage:
 *   npx hardhat run scripts/create-property.js --network amoy
 *
 * Edit the PROPERTY_PARAMS below before running.
 */

const hre = require("hardhat");
const { ethers } = require("hardhat");
const fs = require("fs");

// ─── Configure your property here ────────────────────────────────────────────
const PROPERTY_PARAMS = {
  tokenName: "Victoria Heights Token",
  tokenSymbol: "VHT",
  totalSupply: ethers.parseUnits("100000", 18), // 100,000 tokens
  metadataURI: "ipfs://QmYourIPFSHashHere", // upload to Pinata first
  initialPropertyValue: ethers.parseUnits("500000", 6), // $500,000 USDC
  managementFeeBasisPoints: 1000n, // 10%
  tokenPriceUsdc: ethers.parseUnits("5", 6), // $5 per token
  minPurchase: ethers.parseUnits("10", 18), // min 10 tokens
  maxPurchase: ethers.parseUnits("10000", 18), // max 10,000 tokens
  propertyManager: "", // ← SET THIS: the wallet that will manage this property
};
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  if (!PROPERTY_PARAMS.propertyManager) {
    throw new Error(
      "Set PROPERTY_PARAMS.propertyManager before running this script!",
    );
  }

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // Load deployed factory address
  const deploymentPath = `./deployments/${hre.network.name}.json`;
  if (!fs.existsSync(deploymentPath))
    throw new Error(
      `No deployment found for ${hre.network.name}. Run deploy.js first.`,
    );
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const {
    KYCRegistry: kycAddress,
    PropertyFactory: factoryAddress,
    USDC: usdcAddress,
  } = deployment.contracts;

  console.log("Using factory:", factoryAddress);
  console.log("Using KYCRegistry:", kycAddress);
  console.log("Using USDC:", usdcAddress);

  // ── 1. SecurityToken ──────────────────────────────────────────────────────
  console.log("\nDeploying SecurityToken...");
  const propertyId = 0; // update for each new property
  const SecurityToken = await ethers.getContractFactory("SecurityToken");
  const token = await SecurityToken.deploy(
    PROPERTY_PARAMS.tokenName,
    PROPERTY_PARAMS.tokenSymbol,
    PROPERTY_PARAMS.metadataURI,
    propertyId,
    kycAddress,
  );
  await token.waitForDeployment();
  const tokenAddr = await token.getAddress();
  console.log("SecurityToken:", tokenAddr);

  // ── 2. PropertyVault ──────────────────────────────────────────────────────
  console.log("Deploying PropertyVault...");
  const PropertyVault = await ethers.getContractFactory("PropertyVault");
  const vault = await PropertyVault.deploy(
    tokenAddr,
    usdcAddress,
    PROPERTY_PARAMS.initialPropertyValue,
    PROPERTY_PARAMS.propertyManager,
    PROPERTY_PARAMS.managementFeeBasisPoints,
  );
  await vault.waitForDeployment();
  const vaultAddr = await vault.getAddress();
  console.log("PropertyVault:", vaultAddr);

  // ── 3. PropertyGovernance ─────────────────────────────────────────────────
  console.log("Deploying PropertyGovernance...");
  const PropertyGovernance = await ethers.getContractFactory(
    "PropertyGovernance",
  );
  const governance = await PropertyGovernance.deploy(tokenAddr);
  await governance.waitForDeployment();
  const govAddr = await governance.getAddress();
  console.log("PropertyGovernance:", govAddr);

  // ── 4. TokenSale ──────────────────────────────────────────────────────────
  console.log("Deploying TokenSale...");
  const TokenSale = await ethers.getContractFactory("TokenSale");
  const tokenSale = await TokenSale.deploy(
    tokenAddr,
    usdcAddress,
    kycAddress,
    PROPERTY_PARAMS.tokenPriceUsdc,
    PROPERTY_PARAMS.minPurchase,
    PROPERTY_PARAMS.maxPurchase,
  );
  await tokenSale.waitForDeployment();
  const saleAddr = await tokenSale.getAddress();
  console.log("TokenSale:", saleAddr);

  // ── 5. Issue tokens to TokenSale ──────────────────────────────────────────
  console.log("\nIssuing tokens to TokenSale...");
  const DEFAULT_PARTITION = await token.DEFAULT_PARTITION();
  const data = ethers.AbiCoder.defaultAbiCoder().encode(
    ["string"],
    ["Initial issuance for sale"],
  );
  await (
    await token.issueByPartition(
      DEFAULT_PARTITION,
      saleAddr,
      PROPERTY_PARAMS.totalSupply,
      data,
    )
  ).wait();
  console.log("Tokens issued.");

  // ── 6. Link vault for floating price ──────────────────────────────────────
  console.log("Linking vault to TokenSale...");
  await (await tokenSale.linkVault(vaultAddr)).wait();
  console.log("Vault linked.");

  // ── 7. Transfer ownership to property manager ─────────────────────────────
  console.log("Transferring ownership to property manager...");
  await (await token.transferOwnership(PROPERTY_PARAMS.propertyManager)).wait();
  await (await vault.transferOwnership(PROPERTY_PARAMS.propertyManager)).wait();
  await (
    await governance.transferOwnership(PROPERTY_PARAMS.propertyManager)
  ).wait();
  await (
    await tokenSale.transferOwnership(PROPERTY_PARAMS.propertyManager)
  ).wait();
  console.log("Ownership transferred.");

  // ── 8. Register in PropertyFactory ────────────────────────────────────────
  console.log("\nRegistering property in PropertyFactory...");
  const factory = await ethers.getContractAt("PropertyFactory", factoryAddress);
  const tx = await factory.registerProperty(
    tokenAddr,
    vaultAddr,
    govAddr,
    saleAddr,
    PROPERTY_PARAMS.propertyManager,
    PROPERTY_PARAMS.metadataURI,
  );
  const receipt = await tx.wait();
  console.log("Registered. Tx:", receipt.hash);

  // ── 9. Save result ────────────────────────────────────────────────────────
  const result = {
    propertyId,
    securityToken: tokenAddr,
    propertyVault: vaultAddr,
    governance: govAddr,
    tokenSale: saleAddr,
    propertyManager: PROPERTY_PARAMS.propertyManager,
    metadataURI: PROPERTY_PARAMS.metadataURI,
    network: hre.network.name,
    timestamp: new Date().toISOString(),
  };

  const outPath = `./deployments/property-${propertyId}-${hre.network.name}.json`;
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));

  console.log("\n=== Property Creation Summary ===");
  console.log("PropertyId:      ", propertyId);
  console.log("SecurityToken:   ", tokenAddr);
  console.log("PropertyVault:   ", vaultAddr);
  console.log("Governance:      ", govAddr);
  console.log("TokenSale:       ", saleAddr);
  console.log("Saved to:", outPath);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
