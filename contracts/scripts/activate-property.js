// scripts/activate-property.js
// Usage: npx hardhat run scripts/activate-property.js --network amoy
// Set TOKEN_ADDRESS below to the deployed PropertyToken address.

const TOKEN_ADDRESS = "0xc512d470977d18337e72712Af8bB9e35c766e4aF"; // ← your token
const TREASURY = process.env.TREASURY_ADDRESS || undefined; // set in .env or here

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Activating as:", deployer.address);

  // Treasury defaults to deployer wallet if not specified
  const treasury = TREASURY || deployer.address;
  console.log("Treasury (receives minted supply):", treasury);

  const token = await ethers.getContractAt("PropertyToken", TOKEN_ADDRESS);

  // Check current status
  const status = await token.propertyStatus();
  const STATUS = ["PENDING", "ACTIVE", "PAUSED", "CLOSED"];
  console.log("Current status:", STATUS[status] ?? status);

  if (status !== 0n && status !== 0) {
    console.log("Token is already", STATUS[status] ?? "not PENDING — skipping");
    return;
  }

  console.log("Calling activate()...");
  const tx = await token.activate(treasury);
  console.log("Tx hash:", tx.hash);
  await tx.wait();

  const newStatus = await token.propertyStatus();
  console.log("New status:", STATUS[newStatus] ?? newStatus);
  console.log("✅ Property token activated!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
