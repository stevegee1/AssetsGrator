// scripts/setup-kyc-and-activate.js
// Registers deployer as KYC-verified identity, then activates the PropertyToken.
// Usage: npx hardhat run scripts/setup-kyc-and-activate.js --network amoy

const ADDRESSES = require("../deployed-addresses.json");
const TOKEN_ADDRESS = "0xc512d470977d18337e72712Af8bB9e35c766e4aF";

// Inline ABI — avoids interface artifact resolution issues
const IDENTITY_REGISTRY_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "addAgent",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "userAddress", type: "address" },
      { name: "identity", type: "address" },
      { name: "country", type: "uint16" },
    ],
    name: "registerIdentity",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "userAddress", type: "address" }],
    name: "isVerified",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
];

const PROPERTY_TOKEN_ABI = [
  {
    inputs: [],
    name: "propertyStatus",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "treasury", type: "address" }],
    name: "activate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const ir = new ethers.Contract(
    ADDRESSES.IdentityRegistry,
    IDENTITY_REGISTRY_ABI,
    deployer,
  );

  // ── Step 1: Grant agent role ────────────────────────────────────
  console.log("Granting Agent role to deployer on IdentityRegistry...");
  try {
    const tx = await ir.addAgent(deployer.address);
    await tx.wait();
    console.log("✓ Agent role granted:", tx.hash);
  } catch (e) {
    if (e.message?.includes("already") || e.message?.includes("Agent")) {
      console.log("✓ Already an agent (or role already set)");
    } else {
      throw e;
    }
  }

  // ── Step 2: Register identity ───────────────────────────────────
  const isVerified = await ir.isVerified(deployer.address);
  if (isVerified) {
    console.log("✓ Already KYC-verified");
  } else {
    console.log("Registering deployer identity...");
    const tx = await ir.registerIdentity(
      deployer.address, // wallet to verify
      deployer.address, // ONCHAINID (use wallet itself on testnet)
      566, // country code (NG)
    );
    await tx.wait();
    console.log("✓ Identity registered:", tx.hash);
  }

  // ── Step 3: Activate PropertyToken ─────────────────────────────
  const token = new ethers.Contract(
    TOKEN_ADDRESS,
    PROPERTY_TOKEN_ABI,
    deployer,
  );
  const status = await token.propertyStatus();
  const STATUS = ["PENDING", "ACTIVE", "PAUSED", "CLOSED"];
  console.log("Token status:", STATUS[Number(status)] ?? status);

  if (Number(status) !== 0) {
    console.log("Token is not PENDING — skipping activation");
    return;
  }

  // PropertyToken.mint() also requires AgentRole on the token itself
  console.log("Adding deployer as agent on PropertyToken...");
  const TOKEN_AGENT_ABI = [
    {
      inputs: [{ name: "account", type: "address" }],
      name: "addAgent",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
  ];
  const tokenWithAgent = new ethers.Contract(
    TOKEN_ADDRESS,
    TOKEN_AGENT_ABI,
    deployer,
  );
  try {
    const txA = await tokenWithAgent.addAgent(deployer.address);
    await txA.wait();
    console.log("✓ Agent role granted on token:", txA.hash);
  } catch (e) {
    console.log(
      "Agent role already set or skipped:",
      e.shortMessage ?? e.message,
    );
  }

  console.log("Activating token (minting supply to deployer)...");
  const tx = await token.activate(deployer.address);
  await tx.wait();
  console.log("✓ Token activated:", tx.hash);

  const newStatus = await token.propertyStatus();
  console.log("New status:", STATUS[Number(newStatus)] ?? newStatus);
  console.log("🎉 Done!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
