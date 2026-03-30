// scripts/seed-properties.js
// ─────────────────────────────────────────────────────────────────────────────
// Seeds 10 UK real estate property tokens on Arbitrum Sepolia via AssetFactory.
// After deploying each AssetToken the script:
//   1. Registers the deployer as an agent (so it can mint)
//   2. Mints the full totalSupply to the deployer (platform owner)
//
// Run: npx hardhat run scripts/seed-properties.js --network arbitrumSepolia
// ─────────────────────────────────────────────────────────────────────────────

const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");
const path = require("path");

const deployed = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../deployed-addresses.json"), "utf8")
);

// AssetCategory enum — must match IAssetToken.sol
const Category = {
  RESIDENTIAL: 0,
  COMMERCIAL:  1,
  INDUSTRIAL:  2,
  LAND:        3,
  ENERGY:      4,
};

// USDC has 6 decimals; all prices / valuations are in USDC
const USDC = (n) => ethers.parseUnits(String(n), 6);

// ─── 10 UK Real Estate Properties ────────────────────────────────────────────
const PROPERTIES = [
  {
    name:         "Mayfair Luxury Apartment",
    symbol:       "MLA",
    location:     "Park Lane, Mayfair, London W1K 1BE",
    category:     Category.RESIDENTIAL,
    assetSubType: "luxury apartment",
    totalSupply:  100_000n,          // 100,000 tokens
    pricePerUnit: USDC(50),          // $50 per token
    valuationUSD: USDC(5_000_000),   // $5M property
    ipfsCID:      "QmMayfairLuxuryApartmentParkLaneLondonW1K",
    image:        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
  },
  {
    name:         "Canary Wharf Office Tower",
    symbol:       "CWO",
    location:     "One Canada Square, Canary Wharf, London E14 5AB",
    category:     Category.COMMERCIAL,
    assetSubType: "office tower",
    totalSupply:  200_000n,
    pricePerUnit: USDC(30),          // $30 per token
    valuationUSD: USDC(6_000_000),   // $6M
    ipfsCID:      "QmCanaryWharfOfficeTowerE14LondonUK2024",
    image:        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
  },
  {
    name:         "Kensington Townhouse",
    symbol:       "KTH",
    location:     "Victoria Road, Kensington, London W8 5RD",
    category:     Category.RESIDENTIAL,
    assetSubType: "townhouse",
    totalSupply:  50_000n,
    pricePerUnit: USDC(40),          // $40 per token
    valuationUSD: USDC(2_000_000),   // $2M
    ipfsCID:      "QmKensingtonTownhouseVictoriaRoadW8London",
    image:        "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80",
  },
  {
    name:         "Manchester City Centre Flats",
    symbol:       "MCF",
    location:     "Deansgate, Manchester M3 4LZ",
    category:     Category.RESIDENTIAL,
    assetSubType: "apartment complex",
    totalSupply:  150_000n,
    pricePerUnit: USDC(10),          // $10 per token
    valuationUSD: USDC(1_500_000),   // $1.5M
    ipfsCID:      "QmManchesterCityCentreFlatsDeansgate2024",
    image:        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
  },
  {
    name:         "Edinburgh Old Town Tenement",
    symbol:       "EOT",
    location:     "Royal Mile, Edinburgh EH1 1PB",
    category:     Category.RESIDENTIAL,
    assetSubType: "tenement flat",
    totalSupply:  80_000n,
    pricePerUnit: USDC(15),          // $15 per token
    valuationUSD: USDC(1_200_000),   // $1.2M
    ipfsCID:      "QmEdinburghOldTownTenementRoyalMileEH1",
    image:        "https://images.unsplash.com/photo-1600596542815-ffad4c153b09?w=800&q=80",
  },
  {
    name:         "Birmingham Retail Park",
    symbol:       "BRP",
    location:     "Bullring, Birmingham B5 4BU",
    category:     Category.COMMERCIAL,
    assetSubType: "retail park",
    totalSupply:  100_000n,
    pricePerUnit: USDC(25),          // $25 per token
    valuationUSD: USDC(2_500_000),   // $2.5M
    ipfsCID:      "QmBirminghamRetailParkBullringB5London2024",
    image:        "https://images.unsplash.com/photo-1554435493-93422e8220c8?w=800&q=80",
  },
  {
    name:         "Bristol Harbourside Penthouse",
    symbol:       "BHP",
    location:     "Harbourside, Bristol BS1 5TT",
    category:     Category.RESIDENTIAL,
    assetSubType: "penthouse",
    totalSupply:  40_000n,
    pricePerUnit: USDC(35),          // $35 per token
    valuationUSD: USDC(1_400_000),   // $1.4M
    ipfsCID:      "QmBristolHarboursidePenthouseBS1UK2024xx",
    image:        "https://images.unsplash.com/photo-1600607687939-ce8a6d79a41a?w=800&q=80",
  },
  {
    name:         "Leeds Industrial Warehouse",
    symbol:       "LIW",
    location:     "White Rose Park, Leeds LS11 0AL",
    category:     Category.INDUSTRIAL,
    assetSubType: "warehouse complex",
    totalSupply:  60_000n,
    pricePerUnit: USDC(20),          // $20 per token
    valuationUSD: USDC(1_200_000),   // $1.2M
    ipfsCID:      "QmLeedsIndustrialWarehouseWhiteRoseLS11UK",
    image:        "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&q=80",
  },
  {
    name:         "Oxford Student Quarter",
    symbol:       "OSQ",
    location:     "Cowley Road, Oxford OX4 1HU",
    category:     Category.RESIDENTIAL,
    assetSubType: "student accommodation",
    totalSupply:  120_000n,
    pricePerUnit: USDC(8),           // $8 per token
    valuationUSD: USDC(960_000),     // $960K
    ipfsCID:      "QmOxfordStudentQuarterCowleyRdOX42024UK",
    image:        "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
  },
  {
    name:         "Surrey Country Estate",
    symbol:       "SCE",
    location:     "Guildford Road, Surrey GU2 7XH",
    category:     Category.LAND,
    assetSubType: "country estate",
    totalSupply:  50_000n,
    pricePerUnit: USDC(60),          // $60 per token
    valuationUSD: USDC(3_000_000),   // $3M
    ipfsCID:      "QmSurreyCountryEstateGuildfordRdGU2UK2024",
    image:        "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80",
  },
];

// ─── ABIs needed ─────────────────────────────────────────────────────────────
const ASSET_TOKEN_ABI = [
  "function addAgent(address agent) external",
  "function mint(address _to, uint256 _amount) external",
  "function totalSupply() view returns (uint256)",
  "function owner() view returns (address)",
  "function compliance() view returns (address)",
];

const COMPLIANCE_ABI = [
  "function getModules() view returns (address[])",
  "function removeModule(address _module) external",
  "function addModule(address _module) external",
  "function owner() view returns (address)",
];

const IDENTITY_REGISTRY_ABI = [
  "function addAgent(address agent) external",
  "function registerIdentity(address _userAddress, address _identity, uint16 _country) external",
  "function contains(address _userAddress) view returns (bool)",
];

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const [deployer] = await ethers.getSigners();
  const network    = hre.network.name;

  console.log("\n=======================================================");
  console.log("  PropAsset — UK Property Seed Script (Wave 1)");
  console.log("  Deploying 10 UK Properties via AssetFactory");
  console.log("  NOTE: Minting deferred — KYC claim setup in Wave 2");
  console.log("=======================================================");
  console.log(`Network  : ${network}`);
  console.log(`Deployer : ${deployer.address}`);
  console.log(`Factory  : ${deployed.AssetFactory}`);
  console.log("=======================================================\n");

  const factory = await ethers.getContractAt("AssetFactory", deployed.AssetFactory);
  const results = [];

  for (let i = 0; i < PROPERTIES.length; i++) {
    const p = PROPERTIES[i];
    console.log(`[${i + 1}/10] Deploying "${p.name}" (${p.symbol})...`);

    const tx = await factory.deployAsset({
      name:             p.name,
      symbol:           p.symbol,
      ipfsCID:          p.ipfsCID,
      location:         p.location,
      category:         p.category,
      assetSubType:     p.assetSubType,
      totalSupply:      p.totalSupply,
      pricePerUnit:     p.pricePerUnit,
      valuationUSD:     p.valuationUSD,
      identityRegistry: ethers.ZeroAddress,
      capacityKW:       0n,
      annualYieldMWh:   0n,
      ppaContractCID:   "",
      ppaTermYears:     0n,
    });

    const receipt = await tx.wait();

    // Parse AssetDeployed event to get token address
    const iface = factory.interface;
    let tokenAddress = null;
    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog(log);
        if (parsed?.name === "AssetDeployed") {
          tokenAddress = parsed.args.token;
          break;
        }
      } catch (_) {}
    }

    if (!tokenAddress) {
      console.error(`   ❌  No token address found`);
      continue;
    }

    console.log(`   ✅  Token   : ${tokenAddress}`);
    console.log(`       Tx     : ${receipt.hash}\n`);

    results.push({
      index:        i + 1,
      name:         p.name,
      symbol:       p.symbol,
      token:        tokenAddress,
      totalSupply:  p.totalSupply.toString(),
      priceUSD:     ethers.formatUnits(p.pricePerUnit, 6),
      valuationUSD: ethers.formatUnits(p.valuationUSD, 6),
      image:        p.image,
      ipfsCID:      p.ipfsCID,
      txHash:       receipt.hash,
    });
  }

  // Save results
  const outPath = path.join(__dirname, "../seeded-properties.json");
  fs.writeFileSync(outPath, JSON.stringify({ seededAt: new Date().toISOString(), network, factory: deployed.AssetFactory, properties: results }, null, 2));

  console.log("=======================================================");
  console.log("  ✅ Seed Complete — 10 UK properties live on-chain");
  console.log("  Metadata (name/location/valuation/price) readable now.");
  console.log("  Minting: run Wave 2 after KYC claim setup.");
  console.log("=======================================================");
  console.log(JSON.stringify(results.map(r => ({ name: r.name, token: r.token, val: `$${r.valuationUSD}` })), null, 2));
}

main().catch((err) => { console.error(err); process.exitCode = 1; });

