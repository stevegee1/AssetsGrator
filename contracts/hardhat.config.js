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
    // ── Arbitrum Sepolia — primary deployment target ────────────────────────
    // Fhenix CoFHE co-processor supports Arbitrum Sepolia.
    // L2 gas is ~100x cheaper than Ethereum Sepolia.
    arbitrumSepolia: {
      url: process.env.ARBITRUM_SEPOLIA_RPC_URL,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 421614,
      timeout: 300_000,  // 5 min — handles slow mobile connections
    },
  },
  etherscan: {
    apiKey: {
      arbitrumSepolia: process.env.ARBISCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "arbitrumSepolia",
        chainId: 421614,
        urls: {
          apiURL: "https://api-sepolia.arbiscan.io/api",
          browserURL: "https://sepolia.arbiscan.io",
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
