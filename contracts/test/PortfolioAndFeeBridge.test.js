/**
 * Portfolio & Revelation Bridge — Integration Test Suite
 *
 * Tests the two major new features:
 *  1. FHEPortfolioRegistry — Shadow Sync on token transfers/mints/burns
 *  2. FHEFeeManager — Marketplace fee compute and plaintext revelation bridge (mock-level)
 *
 * Uses MockFHEPortfolioRegistry so tests run locally without Fhenix co-processor.
 * Real FHE-encrypted Portfolio tests are covered in FHEContracts.test.js (cofhe/sdk).
 */

const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

// ─── Helpers ──────────────────────────────────────────────────────────────
const USDC   = (n) => ethers.parseUnits(String(n), 6);
const TOKENS = (n) => ethers.parseEther(String(n));
const ASSET_CATEGORY = { REAL_ESTATE: 0, LAND: 1, RENEWABLE_ENERGY: 2 };

// ─── Full Fixture ─────────────────────────────────────────────────────────
async function deployFullStackV2() {
  const [owner, platformWallet, investor1, investor2, investor3] =
    await ethers.getSigners();

  // MockUSDC
  const MockUSDC = await ethers.getContractFactory("contracts/mocks/MockUSDC.sol:MockUSDC");
  const usdc = await MockUSDC.deploy();

  // MockFHEFeeManagerV2 (with marketplace fee support)
  const MockFee = await ethers.getContractFactory("contracts/mocks/MockFHEFeeManagerV2.sol:MockFHEFeeManagerV2");
  const feeManager = await MockFee.deploy(
    200,  // 2%   platform revenue
    100,  // 1%   maintenance reserve
    150,  // 1.5% exit fee
    100,  // 1%   marketplace commission
    500,  // max 5% platform
    300,  // max 3% maintenance
    500,  // max 5% exit
    500   // max 5% marketplace
  );

  // MockFHEPortfolioRegistry (Shadow Sync stub)
  const MockPortfolio = await ethers.getContractFactory(
    "contracts/mocks/MockFHEPortfolioRegistry.sol:MockFHEPortfolioRegistry"
  );
  const portfolioRegistry = await MockPortfolio.deploy();

  // T-REX Infrastructure
  const CTR = await ethers.getContractFactory(
    "@tokenysolutions/t-rex/contracts/registry/implementation/ClaimTopicsRegistry.sol:ClaimTopicsRegistry"
  );
  const claimTopicsRegistry = await CTR.deploy();
  await claimTopicsRegistry.init();

  const TIR = await ethers.getContractFactory(
    "@tokenysolutions/t-rex/contracts/registry/implementation/TrustedIssuersRegistry.sol:TrustedIssuersRegistry"
  );
  const trustedIssuersRegistry = await TIR.deploy();
  await trustedIssuersRegistry.init();

  const IRS = await ethers.getContractFactory(
    "@tokenysolutions/t-rex/contracts/registry/implementation/IdentityRegistryStorage.sol:IdentityRegistryStorage"
  );
  const identityRegistryStorage = await IRS.deploy();
  await identityRegistryStorage.init();

  const IR = await ethers.getContractFactory(
    "@tokenysolutions/t-rex/contracts/registry/implementation/IdentityRegistry.sol:IdentityRegistry"
  );
  const identityRegistry = await IR.deploy();
  await identityRegistry.init(
    await trustedIssuersRegistry.getAddress(),
    await claimTopicsRegistry.getAddress(),
    await identityRegistryStorage.getAddress()
  );
  await identityRegistryStorage.bindIdentityRegistry(await identityRegistry.getAddress());

  // Implementation contracts
  const AssetToken = await ethers.getContractFactory("AssetToken");
  const tokenImpl  = await AssetToken.deploy();

  const ModularCompliance = await ethers.getContractFactory(
    "@tokenysolutions/t-rex/contracts/compliance/modular/ModularCompliance.sol:ModularCompliance"
  );
  const complianceImpl = await ModularCompliance.deploy();

  const KYCModule = await ethers.getContractFactory("KYCComplianceModule");
  const kycModuleImpl = await KYCModule.deploy();

  // AssetFactory — now with portfolioRegistry param
  const AssetFactory = await ethers.getContractFactory("AssetFactory");
  const factoryImpl  = await AssetFactory.deploy();

  const initData = factoryImpl.interface.encodeFunctionData("initialize", [
    await tokenImpl.getAddress(),
    await complianceImpl.getAddress(),
    await kycModuleImpl.getAddress(),
    await identityRegistry.getAddress(),
    await feeManager.getAddress(),
    await portfolioRegistry.getAddress(),  // ← new param
    await usdc.getAddress(),
    platformWallet.address,
  ]);

  const ERC1967Proxy = await ethers.getContractFactory(
    "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy"
  );
  const proxy   = await ERC1967Proxy.deploy(await factoryImpl.getAddress(), initData);
  const factory = AssetFactory.attach(await proxy.getAddress());

  await identityRegistry.addAgent(await factory.getAddress());
  await identityRegistry.addAgent(owner.address);

  // Fund accounts
  await usdc.faucet(platformWallet.address, USDC(500_000));
  await usdc.faucet(investor1.address,      USDC(100_000));
  await usdc.faucet(investor2.address,      USDC(100_000));

  return {
    usdc, feeManager, portfolioRegistry,
    identityRegistry, factory,
    tokenImpl, complianceImpl, kycModuleImpl,
    owner, platformWallet, investor1, investor2, investor3,
  };
}

// ─── Helper: deploy one asset, register investors, activate ───────────────
async function setupActiveAsset(fixture, investorList = []) {
  const { factory, identityRegistry, owner } = fixture;

  const tx = await factory.connect(owner).deployAsset({
    name:             "Solar Farm Beta",
    symbol:           "SFB",
    ipfsCID:          "QmTest456",
    location:         "Lagos, NG",
    category:         ASSET_CATEGORY.RENEWABLE_ENERGY,
    assetSubType:     "solar farm",
    totalSupply:      TOKENS(1_000_000),
    pricePerUnit:     USDC(1),
    valuationUSD:     TOKENS(1_000_000),
    capacityKW:       5000,
    annualYieldMWh:   7000,
    ppaContractCID:   "QmPPA",
    ppaTermYears:     20,
    identityRegistry: ethers.ZeroAddress,
  });
  const receipt = await tx.wait();

  let tokenAddr;
  for (const log of receipt.logs) {
    try {
      const parsed = factory.interface.parseLog(log);
      if (parsed && parsed.name === "AssetDeployed") { tokenAddr = parsed.args[0]; break; }
    } catch {}
  }

  const token  = await ethers.getContractAt("AssetToken", tokenAddr);
  const treasuryAddr = await factory.getTreasury(tokenAddr);
  const treasury = await ethers.getContractAt("AssetTreasury", treasuryAddr);

  // Add owner as agent for minting
  await token.connect(owner).addAgent(owner.address);
  await token.connect(owner).setStatus(1); // ACTIVE

  // Register investors
  for (const inv of investorList) {
    const mockId = ethers.Wallet.createRandom().address;
    await identityRegistry.registerIdentity(inv.address, mockId, 566);
  }

  return { token, treasury, tokenAddr, treasuryAddr };
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe("Portfolio Shadow Sync & Fee Bridge — Integration Tests", function () {
  this.timeout(120_000);

  // ── Section 1: Shadow Portfolio Sync ──────────────────────────────────
  describe("1. FHEPortfolioRegistry — Shadow Sync", function () {

    it("portfolio is set to zero before any minting", async function () {
      const fixture = await loadFixture(deployFullStackV2);
      const { portfolioRegistry, investor1 } = fixture;
      const { tokenAddr } = await setupActiveAsset(fixture, [investor1]);

      // No mint yet — balance should be 0 in shadow registry
      const bal = await portfolioRegistry.getBalance(tokenAddr, investor1.address);
      expect(bal).to.equal(0n);
    });

    it("minting tokens triggers shadow sync for the recipient", async function () {
      const fixture = await loadFixture(deployFullStackV2);
      const { portfolioRegistry, owner, investor1 } = fixture;
      const { token, tokenAddr } = await setupActiveAsset(fixture, [investor1]);

      await token.connect(owner).mint(investor1.address, TOKENS(50_000));

      const synced = await portfolioRegistry.getBalance(tokenAddr, investor1.address);
      expect(synced).to.equal(TOKENS(50_000));
    });

    it("transfer updates shadow registry for both sender and receiver", async function () {
      const fixture = await loadFixture(deployFullStackV2);
      const { portfolioRegistry, owner, investor1, investor2 } = fixture;
      const { token, tokenAddr } = await setupActiveAsset(fixture, [investor1, investor2]);

      // Mint 100k to investor1
      await token.connect(owner).mint(investor1.address, TOKENS(100_000));

      // Transfer 30k from investor1 → investor2
      await token.connect(investor1).transfer(investor2.address, TOKENS(30_000));

      const bal1 = await portfolioRegistry.getBalance(tokenAddr, investor1.address);
      const bal2 = await portfolioRegistry.getBalance(tokenAddr, investor2.address);

      expect(bal1).to.equal(TOKENS(70_000));
      expect(bal2).to.equal(TOKENS(30_000));
    });

    it("forcedTransfer (T-REX agent function) also triggers shadow sync", async function () {
      const fixture = await loadFixture(deployFullStackV2);
      const { portfolioRegistry, owner, investor1, investor2 } = fixture;
      const { token, tokenAddr } = await setupActiveAsset(fixture, [investor1, investor2]);

      await token.connect(owner).mint(investor1.address, TOKENS(100_000));

      // Agent force-transfer 25k
      await token.connect(owner).forcedTransfer(investor1.address, investor2.address, TOKENS(25_000));

      const bal1 = await portfolioRegistry.getBalance(tokenAddr, investor1.address);
      const bal2 = await portfolioRegistry.getBalance(tokenAddr, investor2.address);

      expect(bal1).to.equal(TOKENS(75_000));
      expect(bal2).to.equal(TOKENS(25_000));
    });

    it("burn reduces the shadow registry balance for the burned address", async function () {
      const fixture = await loadFixture(deployFullStackV2);
      const { portfolioRegistry, owner, investor1 } = fixture;
      const { token, tokenAddr } = await setupActiveAsset(fixture, [investor1]);

      await token.connect(owner).mint(investor1.address, TOKENS(100_000));
      await token.connect(owner).burn(investor1.address, TOKENS(20_000));

      const bal = await portfolioRegistry.getBalance(tokenAddr, investor1.address);
      expect(bal).to.equal(TOKENS(80_000));
    });

    it("multiple mints accumulate correctly in the shadow registry", async function () {
      const fixture = await loadFixture(deployFullStackV2);
      const { portfolioRegistry, owner, investor1 } = fixture;
      const { token, tokenAddr } = await setupActiveAsset(fixture, [investor1]);

      await token.connect(owner).mint(investor1.address, TOKENS(50_000));
      await token.connect(owner).mint(investor1.address, TOKENS(25_000));

      const bal = await portfolioRegistry.getBalance(tokenAddr, investor1.address);
      // Each mint calls _mint → _sync → syncBalance — final state is current balance
      expect(bal).to.equal(TOKENS(75_000));
    });

    it("portfolio registry is asset-scoped — different assets tracked separately", async function () {
      const fixture = await loadFixture(deployFullStackV2);
      const { portfolioRegistry, owner, investor1 } = fixture;

      // Deploy two separate assets
      const { token: token1, tokenAddr: addr1 } = await setupActiveAsset(fixture, [investor1]);

      // Deploy second asset manually
      const tx2 = await fixture.factory.connect(owner).deployAsset({
        name: "Solar Farm Gamma", symbol: "SFG", ipfsCID: "QmGamma",
        location: "Abuja, NG", category: ASSET_CATEGORY.RENEWABLE_ENERGY,
        assetSubType: "solar farm",
        totalSupply: TOKENS(500_000), pricePerUnit: USDC(2),
        valuationUSD: TOKENS(1_000_000), capacityKW: 2500,
        annualYieldMWh: 3500, ppaContractCID: "QmPPA2", ppaTermYears: 15,
        identityRegistry: ethers.ZeroAddress,
      });
      const r2 = await tx2.wait();
      let addr2;
      for (const log of r2.logs) {
        try { const p = fixture.factory.interface.parseLog(log); if (p?.name === "AssetDeployed") { addr2 = p.args[0]; break; } } catch {}
      }
      const token2 = await ethers.getContractAt("AssetToken", addr2);
      await token2.connect(owner).addAgent(owner.address);
      await token2.connect(owner).setStatus(1);
      await fixture.identityRegistry.registerIdentity(investor1.address, ethers.Wallet.createRandom().address, 566).catch(() => {});

      await token1.connect(owner).mint(investor1.address, TOKENS(10_000));
      await token2.connect(owner).mint(investor1.address, TOKENS(5_000));

      const bal1 = await portfolioRegistry.getBalance(addr1, investor1.address);
      const bal2 = await portfolioRegistry.getBalance(addr2, investor1.address);

      expect(bal1).to.equal(TOKENS(10_000));
      expect(bal2).to.equal(TOKENS(5_000));
    });
  });

  // ── Section 2: Fee Manager Bridge (Updated) ──────────────────────────
  describe("2. MockFHEFeeManagerV2 — Marketplace + Revelation Bridge Logic", function () {

    it("computes correct marketplace commission (1% of gross)", async function () {
      const { feeManager } = await loadFixture(deployFullStackV2);
      const gross = USDC(10_000);
      const fee   = await feeManager.computeMarketplaceFeePlaintext(gross);
      expect(fee).to.equal(USDC(100)); // 1% of 10,000
    });

    it("computes correct platform revenue (2% of gross)", async function () {
      const { feeManager } = await loadFixture(deployFullStackV2);
      const gross = USDC(50_000);
      const cut   = await feeManager.computePlatformCutPlaintext(gross);
      expect(cut).to.equal(USDC(1_000)); // 2% of 50,000
    });

    it("computes correct exit fee (1.5% of gross)", async function () {
      const { feeManager } = await loadFixture(deployFullStackV2);
      const gross = USDC(20_000);
      const fee   = await feeManager.computeExitFeePlaintext(gross);
      expect(fee).to.equal(USDC(300)); // 1.5% of 20,000
    });

    it("computes correct maintenance reserve (1% of gross)", async function () {
      const { feeManager } = await loadFixture(deployFullStackV2);
      const gross = USDC(10_000);
      const cut   = await feeManager.computeMaintenanceCutPlaintext(gross);
      expect(cut).to.equal(USDC(100)); // 1% of 10,000
    });

    it("updating marketplace fee to 2% changes the compute result", async function () {
      const { feeManager } = await loadFixture(deployFullStackV2);
      await feeManager.updateMarketplaceFeeBps(200); // change to 2%

      const gross = USDC(10_000);
      const fee   = await feeManager.computeMarketplaceFeePlaintext(gross);
      expect(fee).to.equal(USDC(200)); // now 2% of 10,000
    });

    it("all four fee types sum to expected total deduction rate", async function () {
      const { feeManager } = await loadFixture(deployFullStackV2);
      const gross = USDC(100_000);

      const platform    = await feeManager.computePlatformCutPlaintext(gross);
      const maintenance = await feeManager.computeMaintenanceCutPlaintext(gross);
      const exitFee     = await feeManager.computeExitFeePlaintext(gross);
      const marketplace = await feeManager.computeMarketplaceFeePlaintext(gross);

      // 2% + 1% + 1.5% + 1% = 5.5% of 100,000 = 5,500 USDC
      expect(platform + maintenance + exitFee + marketplace).to.equal(USDC(5_500));
    });
  });

  // ── Section 3: AssetFactory with Portfolio Registry ───────────────────
  describe("3. AssetFactory V2 — Portfolio Registry Wiring", function () {

    it("factory stores and exposes the portfolio registry address", async function () {
      const { factory, portfolioRegistry } = await loadFixture(deployFullStackV2);
      expect(await factory.portfolioRegistry()).to.equal(
        await portfolioRegistry.getAddress()
      );
    });

    it("factory stores and exposes the fee manager address", async function () {
      const { factory, feeManager } = await loadFixture(deployFullStackV2);
      expect(await factory.fheFeeManager()).to.equal(
        await feeManager.getAddress()
      );
    });

    it("deployed AssetToken carries the portfolio registry address", async function () {
      const fixture = await loadFixture(deployFullStackV2);
      const { portfolioRegistry } = fixture;
      const { token } = await setupActiveAsset(fixture, []);

      expect(await token.portfolioRegistry()).to.equal(
        await portfolioRegistry.getAddress()
      );
    });

    it("deploying an asset increments the total assets counter", async function () {
      const fixture = await loadFixture(deployFullStackV2);
      const { factory } = fixture;

      expect(await factory.totalAssets()).to.equal(0n);
      await setupActiveAsset(fixture, []);
      expect(await factory.totalAssets()).to.equal(1n);
    });
  });

  // ── Section 4: AssetTreasury with Updated Fee Bridge ─────────────────
  describe("4. AssetTreasury — Revenue Split via MockFHEFeeManagerV2", function () {

    async function setupFundedTreasury() {
      const fixture = await loadFixture(deployFullStackV2);
      const { usdc, owner, investor1, platformWallet } = fixture;
      const { token, treasury, treasuryAddr } = await setupActiveAsset(fixture, [investor1]);

      // Mint to investor1
      await token.connect(owner).mint(investor1.address, TOKENS(1_000_000));
      // Fund owner with extra USDC
      await usdc.faucet(owner.address, USDC(100_000));

      return { ...fixture, token, treasury, treasuryAddr };
    }

    it("platform fee (2%) correctly deducted on revenue deposit", async function () {
      const { usdc, treasury, owner, platformWallet, treasuryAddr } =
        await setupFundedTreasury();

      const gross = USDC(10_000);
      await usdc.connect(owner).approve(treasuryAddr, gross);

      const platBefore = await usdc.balanceOf(platformWallet.address);
      await treasury.connect(owner).depositRevenue(gross);
      const platAfter = await usdc.balanceOf(platformWallet.address);

      expect(platAfter - platBefore).to.equal(USDC(200)); // 2%
    });

    it("maintenance reserve (1%) held in treasury after deposit", async function () {
      const { usdc, treasury, owner, treasuryAddr } = await setupFundedTreasury();

      const gross = USDC(10_000);
      await usdc.connect(owner).approve(treasuryAddr, gross);
      await treasury.connect(owner).depositRevenue(gross);

      expect(await treasury.maintenanceReserveBalance()).to.equal(USDC(100)); // 1%
    });

    it("net yield for redemptions is gross minus all fees", async function () {
      const { usdc, treasury, owner, treasuryAddr } = await setupFundedTreasury();

      const gross = USDC(10_000);
      await usdc.connect(owner).approve(treasuryAddr, gross);
      await treasury.connect(owner).depositRevenue(gross);

      // 2% platform (200) + 1% maintenance (100) = 300 total deducted
      const available = await treasury.availableForRedemption();
      expect(available).to.equal(USDC(9_700));
    });
  });
});
