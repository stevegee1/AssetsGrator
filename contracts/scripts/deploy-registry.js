// scripts/deploy-registry.js — Deploy PropertyRegistry only
// Run: npx hardhat run scripts/deploy-registry.js --network amoy

const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");
const path = require("path");

const FACTORY_ADDRESS = "0xa7E51613FB6fFA7e5A01b99F019993100B66a636";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying PropertyRegistry on ${hre.network.name}`);
  console.log(`Factory: ${FACTORY_ADDRESS}`);

  // PropertyRegistry uses OwnableUpgradeable but has no constructor args
  // It sets factory in initialize()
  const PropertyRegistry = await ethers.getContractFactory("PropertyRegistry");
  const registry = await PropertyRegistry.deploy();
  await registry.waitForDeployment();
  const registryAddr = await registry.getAddress();

  // Call initialize with factory address
  await (await registry.initialize(FACTORY_ADDRESS)).wait();
  console.log(`PropertyRegistry deployed + initialized: ${registryAddr}`);

  // Update deployed-addresses.json
  const outPath = path.join(__dirname, "../deployed-addresses.json");
  let addresses = {};
  if (fs.existsSync(outPath)) {
    addresses = JSON.parse(fs.readFileSync(outPath, "utf8"));
  }
  addresses.PropertyRegistry = registryAddr;
  fs.writeFileSync(outPath, JSON.stringify(addresses, null, 2));
  console.log("deployed-addresses.json updated ✓");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
