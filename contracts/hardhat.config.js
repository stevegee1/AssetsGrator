require("@nomicfoundation/hardhat-toolbox");
require("@cofhe/hardhat-plugin");

// Load .env manually using Node built-ins (no dotenv package required)
const fs = require("fs");
const path = require("path");
try {
  const envPath = path.join(__dirname, ".env");
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, "utf8")
      .split("\n")
      .forEach((line) => {
        const [key, ...vals] = line.trim().split("=");
        if (key && !key.startsWith("#") && vals.length) {
          process.env[key.trim()] = vals.join("=").trim();
        }
      });
  }
} catch (e) {
  /* .env optional */
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        // FHE contracts — requires cofhe-contracts >= 0.8.25, evmVersion cancun
        // (cancun needed for transient storage opcodes used by coFHE protocol)
        version: "0.8.28",
        settings: {
          optimizer: { enabled: true, runs: 1 },
          viaIR: true,
          evmVersion: "cancun",
        },
      },
      {
        version: "0.8.20",
        settings: {
          optimizer: { enabled: true, runs: 1 },
          viaIR: true,
        },
      },
      {
        // T-REX / ERC-3643 (locked to 0.8.17 by Tokeny)
        version: "0.8.17",
        settings: {
          optimizer: { enabled: true, runs: 200 },
        },
      },
    ],
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    // ── Fhenix Testnet ──────────────────────────────────────────────────────
    fhenix: {
      url: process.env.FHENIX_RPC_URL || "https://api.nitrogen.fhenix.zone",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 8008135,
    },
    // ── Polygon Amoy Testnet (active testnet as of 2024) ──
    amoy: {
      url:
        process.env.POLYGON_AMOY_RPC_URL ||
        "https://rpc-amoy.polygon.technology",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 80002,
      gasPrice: "auto",
    },
    // ── Legacy Mumbai (deprecated) ──
    mumbai: {
      url:
        process.env.POLYGON_MUMBAI_RPC_URL ||
        "https://rpc-mumbai.maticvigil.com",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 80001,
    },
    // ── Polygon Mainnet ──
    polygon: {
      url: process.env.POLYGON_MAINNET_RPC_URL || "https://polygon-rpc.com",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 137,
    },
  },
  etherscan: {
    apiKey: {
      polygon: process.env.POLYGONSCAN_API_KEY || "",
      polygonMumbai: process.env.POLYGONSCAN_API_KEY || "",
      polygonAmoy: process.env.POLYGONSCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "polygonAmoy",
        chainId: 80002,
        urls: {
          apiURL: "https://api-amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com",
        },
      },
    ],
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
