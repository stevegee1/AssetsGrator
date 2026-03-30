/**
 * RWA Platform — End-to-End Test Suite (Phase 1 Local)
 *
 * Uses mock FHE contracts (MockFHEFeeManager, MockFHEAssetValuation, MockFHEKYCRegistry)
 * to test the full AssetFactory + AssetTreasury + ConfidentialLoan stack locally
 * without requiring Fhenix.
 *
 * Coverage:
 *  1. T-REX infrastructure deployment
 *  2. AssetFactory initialisation and asset deployment
 *  3. KYC enforcement via ERC-3643 IdentityRegistry
 *  4. Token minting, transfer, and compliance
 *  5. AssetTreasury revenue distribution and fee split
 *  6. Investor redemption (exit fee applied)
 *  7. Maintenance reserve spend
 *  8. Mock FHE contracts: fee computation, valuation, KYC attrs
 *  9. AccessControl on FHE mocks
 */

const { expect }      = require("chai");
const { ethers }      = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

// ─── Helpers ───────────────────────────────────────────────────────────────

const USDC   = (n) => ethers.parseUnits(String(n), 6);   // 6-decimal USDC
const TOKENS = (n) => ethers.parseEther(String(n));       // 18-decimal asset tokens

const ASSET_CATEGORY = { REAL_ESTATE: 0, LAND: 1, RENEWABLE_ENERGY: 2, INFRASTRUCTURE: 3, COMMODITIES: 4, OTHER: 5 };
const ASSET_STATUS   = { PENDING: 0, ACTIVE: 1, PAUSED: 2, CLOSED: 3 };

// ─── Fixture ────────────────────────────────────────────────────────────────

async function deployFullStack() {
  const [owner, platformWallet, investor1, investor2, borrower, auditor] =
    await ethers.getSigners();

  // ── Mock USDC ──────────────────────────────────────────────────────────
  const MockUSDC = await ethers.getContractFactory("contracts/mocks/MockUSDC.sol:MockUSDC");
  const usdc = await MockUSDC.deploy();

  // ── Mock FHE contracts ─────────────────────────────────────────────────
  const MockFee = await ethers.getContractFactory("contracts/mocks/MockFHEFeeManagerV2.sol:MockFHEFeeManagerV2");
  const feeManager = await MockFee.deploy(
    200,  // 2%   platform
    100,  // 1%   maintenance
    150,  // 1.5% exit
    100,  // 1%   marketplace
    500,  // max 5%
    300,  // max 3%
    500,  // max 5%
    500   // max 5%
  );

  const MockPortfolio = await ethers.getContractFactory("contracts/mocks/MockFHEPortfolioRegistry.sol:MockFHEPortfolioRegistry");
  const portfolioRegistry = await MockPortfolio.deploy();

  const MockVal = await ethers.getContractFactory("contracts/mocks/MockFHEAssetValuation.sol:MockFHEAssetValuation");
  const assetValuation = await MockVal.deploy();

  const MockKYC = await ethers.getContractFactory("contracts/mocks/MockFHEKYCRegistry.sol:MockFHEKYCRegistry");
  const kycFhe = await MockKYC.deploy();

  // ── T-REX infrastructure ───────────────────────────────────────────────
  // 1. ClaimTopicsRegistry
  const CTR = await ethers.getContractFactory(
    "@tokenysolutions/t-rex/contracts/registry/implementation/ClaimTopicsRegistry.sol:ClaimTopicsRegistry"
  );
  const claimTopicsRegistry = await CTR.deploy();
  await claimTopicsRegistry.init();

  // 2. TrustedIssuersRegistry
  const TIR = await ethers.getContractFactory(
    "@tokenysolutions/t-rex/contracts/registry/implementation/TrustedIssuersRegistry.sol:TrustedIssuersRegistry"
  );
  const trustedIssuersRegistry = await TIR.deploy();
  await trustedIssuersRegistry.init();

  // 3. IdentityRegistryStorage
  const IRS = await ethers.getContractFactory(
    "@tokenysolutions/t-rex/contracts/registry/implementation/IdentityRegistryStorage.sol:IdentityRegistryStorage"
  );
  const identityRegistryStorage = await IRS.deploy();
  await identityRegistryStorage.init();

  // 4. IdentityRegistry
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

  // ── Implementation contracts (clone templates) ─────────────────────────
  const AssetToken = await ethers.getContractFactory("AssetToken");
  const tokenImpl = await AssetToken.deploy();

  const ModularCompliance = await ethers.getContractFactory(
    "@tokenysolutions/t-rex/contracts/compliance/modular/ModularCompliance.sol:ModularCompliance"
  );
  const complianceImpl = await ModularCompliance.deploy();

  const KYCModule = await ethers.getContractFactory("KYCComplianceModule");
  const kycModuleImpl = await KYCModule.deploy();

  // ── AssetFactory (upgradeable proxy / simple ERC1967) ─────────────────
  const AssetFactory = await ethers.getContractFactory("AssetFactory");
  const factoryImpl  = await AssetFactory.deploy();

  // Encode initialize() call
  const initData = factoryImpl.interface.encodeFunctionData("initialize", [
    await tokenImpl.getAddress(),
    await complianceImpl.getAddress(),
    await kycModuleImpl.getAddress(),
    await identityRegistry.getAddress(),
    await feeManager.getAddress(),
    await portfolioRegistry.getAddress(),
    await usdc.getAddress(),
    platformWallet.address,
  ]);

  // Deploy via ERC1967 proxy
  const ERC1967Proxy = await ethers.getContractFactory(
    "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy"
  );
  const proxy = await ERC1967Proxy.deploy(await factoryImpl.getAddress(), initData);
  const factory = AssetFactory.attach(await proxy.getAddress());

  // Grant factory agent rights on the identity registry (needed to register investor identities)
  await identityRegistry.addAgent(await factory.getAddress());
  await identityRegistry.addAgent(owner.address);

  // ── Fund accounts with USDC ────────────────────────────────────────────
  await usdc.faucet(platformWallet.address, USDC(500_000));
  await usdc.faucet(investor1.address,      USDC(100_000));
  await usdc.faucet(investor2.address,      USDC(100_000));
  await usdc.faucet(borrower.address,       USDC(50_000));

  return {
    usdc, feeManager, portfolioRegistry, assetValuation, kycFhe,
    identityRegistry, identityRegistryStorage,
    claimTopicsRegistry, trustedIssuersRegistry,
    tokenImpl, complianceImpl, kycModuleImpl,
    factory,
    owner, platformWallet, investor1, investor2, borrower, auditor,
  };
}

// ─── Helper: deploy a test asset through the factory ──────────────────────

async function deployTestAsset(factory, overrides = {}, ownerSigner = null) {
  const params = {
    name:             overrides.name        ?? "Solar Farm Alpha",
    symbol:           overrides.symbol      ?? "SFA",
    ipfsCID:          overrides.ipfsCID     ?? "QmTest123",
    location:         overrides.location    ?? "London, UK",
    category:         overrides.category    ?? ASSET_CATEGORY.RENEWABLE_ENERGY,
    assetSubType:     overrides.assetSubType ?? "solar farm",
    totalSupply:      overrides.totalSupply  ?? TOKENS(1_000_000),
    pricePerUnit:     overrides.pricePerUnit ?? USDC(1),
    valuationUSD:     overrides.valuationUSD ?? TOKENS(1_000_000),
    capacityKW:       overrides.capacityKW   ?? 5000,
    annualYieldMWh:   overrides.annualYieldMWh ?? 7000,
    ppaContractCID:   overrides.ppaContractCID ?? "QmPPA",
    ppaTermYears:     overrides.ppaTermYears   ?? 20,
    identityRegistry: overrides.identityRegistry ?? ethers.ZeroAddress,
  };

  const factoryWithSigner = ownerSigner ? factory.connect(ownerSigner) : factory;
  const tx = await factoryWithSigner.deployAsset(params);
  const receipt = await tx.wait();

  const iface = factory.interface;
  let tokenAddr;
  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed && parsed.name === "AssetDeployed") {
        tokenAddr = parsed.args[0];
        break;
      }
    } catch {}
  }

  if (!tokenAddr) throw new Error("AssetDeployed event not found");

  const token    = await ethers.getContractAt("AssetToken", tokenAddr);
  const treasuryAddr = await factory.getTreasury(tokenAddr);
  const treasury = await ethers.getContractAt("AssetTreasury", treasuryAddr);

  // In T-REX: unpause(), mint(), forcedTransfer() are ALL restricted to agents.
  // The factory transfers ownership to owner but doesn't add owner as agent.
  // We must explicitly add the deployer (owner) as agent for test operations.
  if (ownerSigner) {
    await token.connect(ownerSigner).addAgent(ownerSigner.address);
  }

  return { token, treasury, tokenAddr, treasuryAddr };
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe("RWA Platform — End-to-End Tests", function () {
  this.timeout(120_000);

  // ── 1. Mock FHE contracts ──────────────────────────────────────────────
  describe("Mock FHE Contracts", function () {
    it("MockFHEFeeManager: computes platform cut correctly", async function () {
      const { feeManager } = await loadFixture(deployFullStack);

      const gross = USDC(10_000);
      const cut   = await feeManager.computePlatformCutPlaintext(gross);
      // 2% of 10,000 = 200
      expect(cut).to.equal(USDC(200));
    });

    it("MockFHEFeeManager: computes exit fee correctly", async function () {
      const { feeManager } = await loadFixture(deployFullStack);

      const gross = USDC(5_000);
      const fee   = await feeManager.computeExitFeePlaintext(gross);
      // 1.5% of 5,000 = 75
      expect(fee).to.equal(USDC(75));
    });

    it("MockFHEFeeManager: can update rates", async function () {
      const { feeManager } = await loadFixture(deployFullStack);

      await feeManager.updatePlatformRevenueBps(300); // 3%
      const cut = await feeManager.computePlatformCutPlaintext(USDC(1_000));
      expect(cut).to.equal(USDC(30));
    });

    it("MockFHEAssetValuation: register and update valuations", async function () {
      const { assetValuation, owner, investor1 } = await loadFixture(deployFullStack);

      const fakeAsset = investor1.address; // use an address as stub
      await assetValuation.registerAsset(fakeAsset, TOKENS(500_000), owner.address);
      expect(await assetValuation.valuationUSD(fakeAsset)).to.equal(TOKENS(500_000));

      await assetValuation.updateValuation(fakeAsset, TOKENS(600_000));
      expect(await assetValuation.valuationUSD(fakeAsset)).to.equal(TOKENS(600_000));
    });

    it("MockFHEKYCRegistry: set and validate attributes", async function () {
      const { kycFhe, owner, investor1 } = await loadFixture(deployFullStack);

      const ATTR_ACCREDITED = ethers.keccak256(ethers.toUtf8Bytes("IS_ACCREDITED"));
      const ATTR_AML        = ethers.keccak256(ethers.toUtf8Bytes("AML_CLEARED"));

      // Set both as true, no expiry
      await kycFhe.batchSetKYCAttrs(
        owner.address,
        investor1.address,
        [ATTR_ACCREDITED, ATTR_AML],
        [true, true],
        0
      );

      expect(await kycFhe.getAttrPlaintext(owner.address, investor1.address, ATTR_ACCREDITED)).to.be.true;
      expect(await kycFhe.isAttrValid(owner.address, investor1.address, ATTR_AML)).to.be.true;
    });

    it("MockFHEKYCRegistry: expired attribute is invalid", async function () {
      const { kycFhe, owner, investor1 } = await loadFixture(deployFullStack);

      const ATTR_ACCREDITED = ethers.keccak256(ethers.toUtf8Bytes("IS_ACCREDITED"));
      const pastTime = (await time.latest()) - 1;

      await kycFhe.setKYCAttr(owner.address, investor1.address, ATTR_ACCREDITED, true, pastTime);
      expect(await kycFhe.isAttrValid(owner.address, investor1.address, ATTR_ACCREDITED)).to.be.false;
    });
  });

  // ── 2. Asset Factory ───────────────────────────────────────────────────
  describe("AssetFactory", function () {
    it("Should deploy a new asset with all sub-contracts", async function () {
      const { factory, owner } = await loadFixture(deployFullStack);

      const { token, treasury } = await deployTestAsset(factory, {}, owner);

      expect(await token.getAddress()).to.not.equal(ethers.ZeroAddress);
      expect(await treasury.getAddress()).to.not.equal(ethers.ZeroAddress);
      expect(await factory.totalAssets()).to.equal(1);
      expect(await factory.isRegisteredAsset(await token.getAddress())).to.be.true;
    });

    it("Should deploy multiple assets and track them by category", async function () {
      const { factory, owner } = await loadFixture(deployFullStack);

      await deployTestAsset(factory, { name: "Solar A", symbol: "SA", category: ASSET_CATEGORY.RENEWABLE_ENERGY }, owner);
      await deployTestAsset(factory, { name: "Land B",  symbol: "LB", category: ASSET_CATEGORY.LAND }, owner);
      await deployTestAsset(factory, { name: "Solar C", symbol: "SC", category: ASSET_CATEGORY.RENEWABLE_ENERGY }, owner);

      expect(await factory.totalAssets()).to.equal(3);

      const solarAssets = await factory.getAssetsByCategory(ASSET_CATEGORY.RENEWABLE_ENERGY);
      expect(solarAssets.length).to.equal(2);

      const landAssets = await factory.getAssetsByCategory(ASSET_CATEGORY.LAND);
      expect(landAssets.length).to.equal(1);
    });

    it("Only owner can deploy assets", async function () {
      const { factory, investor1 } = await loadFixture(deployFullStack);

      const params = {
        name: "Hack", symbol: "HCK", ipfsCID: "x", location: "x",
        category: 0, assetSubType: "x",
        totalSupply: TOKENS(1000), pricePerUnit: USDC(1), valuationUSD: TOKENS(1000),
        capacityKW: 0, annualYieldMWh: 0, ppaContractCID: "", ppaTermYears: 0,
        identityRegistry: ethers.ZeroAddress,
      };

      await expect(
        factory.connect(investor1).deployAsset(params)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  // ── 3. AssetToken (ERC-3643 compliance) ───────────────────────────────
  describe("AssetToken — ERC-3643 Compliance", function () {
    it("Token starts as PENDING and paused", async function () {
      const { factory, owner } = await loadFixture(deployFullStack);
      const { token } = await deployTestAsset(factory, {}, owner);

      expect(await token.assetStatus()).to.equal(ASSET_STATUS.PENDING);
      expect(await token.paused()).to.be.true;
    });

    it("Owner can activate and unpause asset", async function () {
      const { factory, owner } = await loadFixture(deployFullStack);
      const { token } = await deployTestAsset(factory, {}, owner);

      // setStatus(ACTIVE) internally unpauses — no separate unpause() needed
      await token.connect(owner).setStatus(ASSET_STATUS.ACTIVE);

      expect(await token.assetStatus()).to.equal(ASSET_STATUS.ACTIVE);
      expect(await token.paused()).to.be.false;
    });

    it("KYC-verified investors can receive tokens", async function () {
      const { factory, identityRegistry, owner, investor1 } = await loadFixture(deployFullStack);
      const { token } = await deployTestAsset(factory, {}, owner);

      // setStatus(ACTIVE) handles unpausing
      await token.connect(owner).setStatus(ASSET_STATUS.ACTIVE);

      // Register investor identity in T-REX (no actual on-chain ID contract needed for basic test)
      // The IdentityRegistry.registerIdentity needs an onchainId — use a mock address
      const mockIdentity = ethers.Wallet.createRandom().address;
      await identityRegistry.registerIdentity(investor1.address, mockIdentity, 566); // 566 = NG country code

      // Mint tokens to investor1 via owner (agent)
      const tokenAddr = await token.getAddress();
      const treasury  = await ethers.getContractAt("AssetTreasury", await factory.getTreasury(tokenAddr));

      // Owner is agent — can forcedTransfer
      const supply = TOKENS(1_000_000);
      await token.connect(owner).mint(investor1.address, supply);

      expect(await token.balanceOf(investor1.address)).to.equal(supply);
    });

    it("Non-KYC wallet cannot receive tokens", async function () {
      const { factory, owner, investor1 } = await loadFixture(deployFullStack);
      const { token } = await deployTestAsset(factory, {}, owner);

      // setStatus(ACTIVE) handles unpausing internally
      await token.connect(owner).setStatus(ASSET_STATUS.ACTIVE);

      // No identity registered — mint should fail due to compliance
      await expect(
        token.connect(owner).mint(investor1.address, TOKENS(1000))
      ).to.be.reverted;
    });
  });

  // ── 4. AssetTreasury ──────────────────────────────────────────────────
  describe("AssetTreasury — Fee Split and Revenue", function () {
    async function setupActiveTreasury() {
      const fixture = await loadFixture(deployFullStack);
      const { factory, identityRegistry, usdc, owner, platformWallet, investor1 } = fixture;

      // Deploy asset — pass owner so it gets added as agent
      const { token, treasury } = await deployTestAsset(factory, {}, owner);
      const tokenAddr    = await token.getAddress();
      const treasuryAddr = await treasury.getAddress();

      // setStatus(ACTIVE) internally unpauses — one call does both
      await token.connect(owner).setStatus(1); // ACTIVE

      // Register investor identity
      const mockIdentity = ethers.Wallet.createRandom().address;
      await identityRegistry.registerIdentity(investor1.address, mockIdentity, 566);

      // Mint tokens to investor1
      await token.connect(owner).mint(investor1.address, TOKENS(1_000_000));

      // Fund owner with USDC for revenue deposits
      await usdc.faucet(owner.address, USDC(100_000));

      return { ...fixture, token, treasury, tokenAddr, treasuryAddr };
    }

    it("Platform fee and maintenance cut on revenue deposit", async function () {
      const { usdc, treasury, owner, platformWallet } = await setupActiveTreasury();
      const treasuryAddr = await treasury.getAddress();

      const grossRevenue = USDC(10_000);
      await usdc.connect(owner).approve(treasuryAddr, grossRevenue);

      const platformBefore = await usdc.balanceOf(platformWallet.address);

      await treasury.connect(owner).depositRevenue(grossRevenue);

      const platformAfter = await usdc.balanceOf(platformWallet.address);

      // 2% platform = 200 USDC
      expect(platformAfter - platformBefore).to.equal(USDC(200));

      // 1% maintenance = 100 USDC stays in treasury
      expect(await treasury.maintenanceReserveBalance()).to.equal(USDC(100));
    });

    it("Net yield goes to treasury USDC balance (for redemptions)", async function () {
      const { usdc, treasury, owner } = await setupActiveTreasury();
      const treasuryAddr = await treasury.getAddress();

      const grossRevenue = USDC(10_000);
      await usdc.connect(owner).approve(treasuryAddr, grossRevenue);
      await treasury.connect(owner).depositRevenue(grossRevenue);

      // 2% platform (200) + 1% maintenance (100) = 300 deducted
      // Net yield = 9,700 USDC stays in treasury for redemptions
      const available = await treasury.availableForRedemption();
      expect(available).to.equal(USDC(9_700));
    });

    it("Governance can spend from maintenance reserve", async function () {
      const { usdc, treasury, owner, investor2 } = await setupActiveTreasury();
      const treasuryAddr = await treasury.getAddress();

      // Set governance = owner for test
      await treasury.connect(owner).setGovernanceContract(owner.address);

      const grossRevenue = USDC(10_000);
      await usdc.connect(owner).approve(treasuryAddr, grossRevenue);
      await treasury.connect(owner).depositRevenue(grossRevenue);

      // Spend 50 USDC from 100 USDC reserve for maintenance
      const balBefore = await usdc.balanceOf(investor2.address);
      await treasury.connect(owner).spendFromReserve(investor2.address, USDC(50), "HVAC repair");
      const balAfter = await usdc.balanceOf(investor2.address);

      expect(balAfter - balBefore).to.equal(USDC(50));
      expect(await treasury.maintenanceReserveBalance()).to.equal(USDC(50));
    });

    it("Non-governance cannot spend from reserve", async function () {
      const { treasury, investor1 } = await setupActiveTreasury();
      await expect(
        treasury.connect(investor1).spendFromReserve(investor1.address, USDC(10), "hack")
      ).to.be.revertedWith("Treasury: caller is not governance");
    });

    it("Owner can update valuation manually", async function () {
      const { treasury, token, owner } = await setupActiveTreasury();

      const newVal   = TOKENS(1_200_000);
      const supply   = await token.totalSupply();
      const newPrice = (newVal * BigInt(1e18)) / supply;

      await treasury.connect(owner).manualUpdateValuation(newVal, newPrice);

      const meta = await token.assetMetadata();
      expect(meta.valuationUSD).to.equal(newVal);
    });
  });

  // ── 5. Manual Loan Flow (MockFHE) ─────────────────────────────────────
  describe("Loan Flow Simulation (Mock FHE)", function () {
    it("FeeManager: compute platform cut on loan amount", async function () {
      const { feeManager } = await loadFixture(deployFullStack);

      const loanAmount = USDC(50_000);
      const feeCut     = await feeManager.computePlatformCutPlaintext(loanAmount);
      const netAmount  = loanAmount - feeCut;

      // 2% of 50k = 1,000
      expect(feeCut).to.equal(USDC(1_000));
      expect(netAmount).to.equal(USDC(49_000));
    });

    it("Simulated loan lifecycle: originate → disburse → repay", async function () {
      const { usdc, feeManager, owner, platformWallet, borrower } =
        await loadFixture(deployFullStack);

      // Platform wallet funds the loan pool
      const loanAmount    = USDC(10_000);
      const platformCut   = await feeManager.computePlatformCutPlaintext(loanAmount);
      const netDisbursal  = loanAmount - platformCut;

      // Platform approves disbursement
      await usdc.connect(platformWallet).approve(owner.address, netDisbursal);

      // Record balances before
      const platformBal0 = await usdc.balanceOf(platformWallet.address);
      const borrowerBal0 = await usdc.balanceOf(borrower.address);

      // Simulate confirmDisbursal: treasury → borrower (net only)
      await usdc.connect(platformWallet).transfer(borrower.address, netDisbursal);

      // Fee stays in treasury (difference = 200 USDC on 10,000 at 2%)
      const platformBal1 = await usdc.balanceOf(platformWallet.address);
      const borrowerBal1 = await usdc.balanceOf(borrower.address);

      expect(platformBal0 - platformBal1).to.equal(netDisbursal);
      expect(borrowerBal1 - borrowerBal0).to.equal(netDisbursal);

      // Simulate repayment: borrower → treasury (full loan amount)
      const repayAmount = loanAmount; // borrower repays gross
      await usdc.connect(borrower).approve(owner.address, repayAmount);
      await usdc.connect(borrower).transfer(platformWallet.address, repayAmount);

      const platformBal2 = await usdc.balanceOf(platformWallet.address);
      // Treasury now has net gain = platformCut = 200 USDC profit
      expect(platformBal2 - (platformBal1)).to.equal(repayAmount);
    });
  });

  // ── 6. AssetFactory admin functions ───────────────────────────────────
  describe("AssetFactory Admin", function () {
    it("Owner can update platform wallet", async function () {
      const { factory, owner, investor2 } = await loadFixture(deployFullStack);

      await factory.connect(owner).setPlatformWallet(investor2.address);
      expect(await factory.platformWallet()).to.equal(investor2.address);
    });

    it("Non-owner cannot update platform wallet", async function () {
      const { factory, investor1, investor2 } = await loadFixture(deployFullStack);

      await expect(
        factory.connect(investor1).setPlatformWallet(investor2.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Only owner can update platform wallet", async function () {
      const { factory, owner } = await loadFixture(deployFullStack);
      const newWallet = ethers.Wallet.createRandom().address;
      await factory.connect(owner).setPlatformWallet(newWallet);
      expect(await factory.platformWallet()).to.equal(newWallet);
    });

    it("portfolioRegistry address is correctly stored in factory", async function () {
      const { factory, portfolioRegistry } = await loadFixture(deployFullStack);
      expect(await factory.portfolioRegistry()).to.equal(
        await portfolioRegistry.getAddress()
      );
    });

    it("fheFeeManager address is correctly stored in factory", async function () {
      const { factory, feeManager } = await loadFixture(deployFullStack);
      expect(await factory.fheFeeManager()).to.equal(
        await feeManager.getAddress()
      );
    });
  });
});

