/**
 * RWA Platform — End-to-End Test Suite
 *
 * Tests the full platform stack locally without any Fhenix/FHE dependencies.
 * Uses the plaintext FeeManager for all fee computation.
 *
 * Coverage:
 *  1. T-REX infrastructure deployment
 *  2. AssetFactory initialisation and asset deployment
 *  3. KYC enforcement via ERC-3643 IdentityRegistry
 *  4. Token minting, transfer, and compliance
 *  5. AssetTreasury revenue distribution and fee split
 *  6. Investor redemption (exit fee applied)
 *  7. Maintenance reserve spend
 *  8. FeeManager: fee computation and rate updates
 *  9. AssetFactory admin functions
 */

const { expect }      = require("chai");
const { ethers }      = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

// ─── Helpers ───────────────────────────────────────────────────────────────

const USDC   = (n) => ethers.parseUnits(String(n), 6);   // 6-decimal USDC
const TOKENS = (n) => ethers.parseEther(String(n));       // 18-decimal asset tokens

const ASSET_CATEGORY = { REAL_ESTATE: 0, LAND: 1, RENEWABLE_ENERGY: 2, INFRASTRUCTURE: 3, COMMODITIES: 4, OTHER: 5 };
const ASSET_STATUS   = { PENDING: 0, ACTIVE: 1, PAUSED: 2, CLOSED: 3 };

// ─── Fixture ────────────────────────────────────────────────────────────────

async function deployFullStack() {
  const [owner, platformWallet, investor1, investor2, borrower, auditor] =
    await ethers.getSigners();

  // ── GBPPlatformToken ───────────────────────────────────────────────────
  const GBPPlatformToken = await ethers.getContractFactory("GBPPlatformToken");
  const usdc = await GBPPlatformToken.deploy(owner.address);

  // ── FeeManager (plaintext) ─────────────────────────────────────────────
  const FeeManager = await ethers.getContractFactory("FeeManager");
  const feeManager = await FeeManager.deploy(
    200,   // 2%   platform revenue
    100,   // 1%   maintenance reserve
    150,   // 1.5% exit fee
    100,   // 1%   marketplace fee
    1000,  // cap: 10%
    500,   // cap: 5%
    500,   // cap: 5%
    500,   // cap: 5%
    owner.address
  );

  // ── AssetValuation (public oracle) ────────────────────────────────────
  const ValFactory     = await ethers.getContractFactory("AssetValuation");
  const assetValuation = await ValFactory.deploy();

  // ── T-REX infrastructure ───────────────────────────────────────────────
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

  // ── Compliance + module implementations ────────────────────────────────
  const AssetToken = await ethers.getContractFactory("AssetToken");
  const tokenImpl  = await AssetToken.deploy();

  const ModularCompliance = await ethers.getContractFactory(
    "@tokenysolutions/t-rex/contracts/compliance/modular/ModularCompliance.sol:ModularCompliance"
  );
  const complianceImpl = await ModularCompliance.deploy();

  const KYCModule     = await ethers.getContractFactory("KYCComplianceModule");
  const kycModuleImpl = await KYCModule.deploy();

  const RetailCap        = await ethers.getContractFactory("RetailInvestorCap");
  const retailCapImpl    = await RetailCap.deploy();

  // ── AssetFactory (ERC1967 proxy) ───────────────────────────────────────
  const AssetFactory = await ethers.getContractFactory("AssetFactory");
  const factoryImpl  = await AssetFactory.deploy();

  const initData = factoryImpl.interface.encodeFunctionData("initialize", [
    await tokenImpl.getAddress(),
    await complianceImpl.getAddress(),
    await kycModuleImpl.getAddress(),
    await retailCapImpl.getAddress(),
    await identityRegistry.getAddress(),
    await feeManager.getAddress(),
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

  // ── Fund accounts with GBP ────────────────────────────────────────────
  await usdc.connect(owner).mint(platformWallet.address, USDC(500_000));
  await usdc.connect(owner).mint(investor1.address,      USDC(100_000));
  await usdc.connect(owner).mint(investor2.address,      USDC(100_000));
  await usdc.connect(owner).mint(borrower.address,       USDC(50_000));

  return {
    usdc, feeManager, assetValuation,
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
    name:             overrides.name          ?? "Solar Farm Alpha",
    symbol:           overrides.symbol        ?? "SFA",
    ipfsCID:          overrides.ipfsCID       ?? "QmTest123",
    location:         overrides.location      ?? "London, UK",
    category:         overrides.category      ?? ASSET_CATEGORY.RENEWABLE_ENERGY,
    assetSubType:     overrides.assetSubType  ?? "solar farm",
    totalSupply:      overrides.totalSupply   ?? TOKENS(1_000_000),
    pricePerUnit:     overrides.pricePerUnit  ?? USDC(1),
    valuationUSD:     overrides.valuationUSD  ?? TOKENS(1_000_000),
    capacityKW:       overrides.capacityKW    ?? 5000,
    annualYieldMWh:   overrides.annualYieldMWh ?? 7000,
    ppaContractCID:   overrides.ppaContractCID ?? "QmPPA",
    ppaTermYears:     overrides.ppaTermYears   ?? 20,
    identityRegistry: overrides.identityRegistry ?? ethers.ZeroAddress,
  };

  const factoryWithSigner = ownerSigner ? factory.connect(ownerSigner) : factory;
  const tx      = await factoryWithSigner.deployAsset(params);
  const receipt = await tx.wait();

  const iface = factory.interface;
  let tokenAddr;
  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed && parsed.name === "AssetDeployed") { tokenAddr = parsed.args[0]; break; }
    } catch {}
  }
  if (!tokenAddr) throw new Error("AssetDeployed event not found");

  const token    = await ethers.getContractAt("AssetToken", tokenAddr);
  const treasuryAddr = await factory.getTreasury(tokenAddr);
  const treasury = await ethers.getContractAt("AssetTreasury", treasuryAddr);

  if (ownerSigner) await token.connect(ownerSigner).addAgent(ownerSigner.address);

  return { token, treasury, tokenAddr, treasuryAddr };
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe("RWA Platform — End-to-End Tests", function () {
  this.timeout(120_000);

  // ── 1. FeeManager ─────────────────────────────────────────────────────
  describe("FeeManager", function () {
    it("computes platform cut correctly (2% of 10,000 USDC = 200)", async function () {
      const { feeManager } = await loadFixture(deployFullStack);
      const cut = await feeManager.computePlatformCutPlaintext(USDC(10_000));
      expect(cut).to.equal(USDC(200));
    });

    it("computes maintenance cut correctly (1% of 10,000 USDC = 100)", async function () {
      const { feeManager } = await loadFixture(deployFullStack);
      const cut = await feeManager.computeMaintenanceCutPlaintext(USDC(10_000));
      expect(cut).to.equal(USDC(100));
    });

    it("computes exit fee correctly (1.5% of 5,000 USDC = 75)", async function () {
      const { feeManager } = await loadFixture(deployFullStack);
      const fee = await feeManager.computeExitFeePlaintext(USDC(5_000));
      expect(fee).to.equal(USDC(75));
    });

    it("computes marketplace fee correctly (1% of 2,000 USDC = 20)", async function () {
      const { feeManager } = await loadFixture(deployFullStack);
      const fee = await feeManager.computeMarketplaceFeePlaintext(USDC(2_000));
      expect(fee).to.equal(USDC(20));
    });

    it("owner can update platform revenue rate", async function () {
      const { feeManager } = await loadFixture(deployFullStack);
      await feeManager.updatePlatformRevenueBps(300); // 3%
      const cut = await feeManager.computePlatformCutPlaintext(USDC(1_000));
      expect(cut).to.equal(USDC(30));
    });

    it("rejects rate above hard cap", async function () {
      const { feeManager } = await loadFixture(deployFullStack);
      await expect(feeManager.updatePlatformRevenueBps(1001)).to.be.revertedWith("FeeManager: exceeds cap");
    });

    it("non-owner cannot update rates", async function () {
      const { feeManager, investor1 } = await loadFixture(deployFullStack);
      await expect(
        feeManager.connect(investor1).updatePlatformRevenueBps(500)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  // ── 2. AssetValuation oracle ───────────────────────────────────────────
  describe("AssetValuation Oracle", function () {
    it("register and update valuations", async function () {
      const { assetValuation } = await loadFixture(deployFullStack);
      const fakeAsset = ethers.Wallet.createRandom().address;
      await assetValuation.registerAsset(fakeAsset, USDC(500_000));
      expect(await assetValuation.valuationUSD(fakeAsset)).to.equal(USDC(500_000));

      await assetValuation.updateValuation(fakeAsset, USDC(600_000));
      expect(await assetValuation.valuationUSD(fakeAsset)).to.equal(USDC(600_000));
    });
  });

  // ── 3. Asset Factory ───────────────────────────────────────────────────
  describe("AssetFactory", function () {
    it("deploys a new asset with all sub-contracts", async function () {
      const { factory, owner } = await loadFixture(deployFullStack);
      const { token, treasury } = await deployTestAsset(factory, {}, owner);

      expect(await token.getAddress()).to.not.equal(ethers.ZeroAddress);
      expect(await treasury.getAddress()).to.not.equal(ethers.ZeroAddress);
      expect(await factory.totalAssets()).to.equal(1);
      expect(await factory.isRegisteredAsset(await token.getAddress())).to.be.true;
    });

    it("tracks assets by category", async function () {
      const { factory, owner } = await loadFixture(deployFullStack);

      await deployTestAsset(factory, { name: "Solar A", symbol: "SA", category: ASSET_CATEGORY.RENEWABLE_ENERGY }, owner);
      await deployTestAsset(factory, { name: "Land B",  symbol: "LB", category: ASSET_CATEGORY.LAND }, owner);
      await deployTestAsset(factory, { name: "Solar C", symbol: "SC", category: ASSET_CATEGORY.RENEWABLE_ENERGY }, owner);

      expect(await factory.totalAssets()).to.equal(3);
      expect((await factory.getAssetsByCategory(ASSET_CATEGORY.RENEWABLE_ENERGY)).length).to.equal(2);
      expect((await factory.getAssetsByCategory(ASSET_CATEGORY.LAND)).length).to.equal(1);
    });

    it("only owner can deploy assets", async function () {
      const { factory, investor1 } = await loadFixture(deployFullStack);
      const params = {
        name: "Hack", symbol: "HCK", ipfsCID: "x", location: "x",
        category: 0, assetSubType: "x",
        totalSupply: TOKENS(1000), pricePerUnit: USDC(1), valuationUSD: TOKENS(1000),
        capacityKW: 0, annualYieldMWh: 0, ppaContractCID: "", ppaTermYears: 0,
        identityRegistry: ethers.ZeroAddress,
      };
      await expect(factory.connect(investor1).deployAsset(params))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("feeManager address is correctly stored in factory", async function () {
      const { factory, feeManager } = await loadFixture(deployFullStack);
      expect(await factory.feeManager()).to.equal(await feeManager.getAddress());
    });
  });

  // ── 4. AssetToken (ERC-3643 compliance) ───────────────────────────────
  describe("AssetToken — ERC-3643 Compliance", function () {
    it("token starts as PENDING and paused", async function () {
      const { factory, owner } = await loadFixture(deployFullStack);
      const { token } = await deployTestAsset(factory, {}, owner);
      expect(await token.assetStatus()).to.equal(ASSET_STATUS.PENDING);
      expect(await token.paused()).to.be.true;
    });

    it("owner can activate and unpause asset", async function () {
      const { factory, owner } = await loadFixture(deployFullStack);
      const { token } = await deployTestAsset(factory, {}, owner);
      await token.connect(owner).setStatus(ASSET_STATUS.ACTIVE);
      expect(await token.assetStatus()).to.equal(ASSET_STATUS.ACTIVE);
      expect(await token.paused()).to.be.false;
    });

    it("KYC-verified investors can receive tokens", async function () {
      const { factory, identityRegistry, owner, investor1 } = await loadFixture(deployFullStack);
      const { token } = await deployTestAsset(factory, {}, owner);
      await token.connect(owner).setStatus(ASSET_STATUS.ACTIVE);

      const mockIdentity = ethers.Wallet.createRandom().address;
      await identityRegistry.registerIdentity(investor1.address, mockIdentity, 566);
      await token.connect(owner).mint(investor1.address, TOKENS(1_000_000));

      expect(await token.balanceOf(investor1.address)).to.equal(TOKENS(1_000_000));
    });

    it("non-KYC wallet cannot receive tokens", async function () {
      const { factory, owner, investor1 } = await loadFixture(deployFullStack);
      const { token } = await deployTestAsset(factory, {}, owner);
      await token.connect(owner).setStatus(ASSET_STATUS.ACTIVE);
      await expect(token.connect(owner).mint(investor1.address, TOKENS(1000))).to.be.reverted;
    });
  });

  // ── 5. AssetTreasury ──────────────────────────────────────────────────
  describe("AssetTreasury — Fee Split and Revenue", function () {
    async function setupActiveTreasury() {
      const fixture = await loadFixture(deployFullStack);
      const { factory, identityRegistry, usdc, owner, investor1 } = fixture;

      const { token, treasury } = await deployTestAsset(factory, {}, owner);
      await token.connect(owner).setStatus(1); // ACTIVE

      const mockIdentity = ethers.Wallet.createRandom().address;
      await identityRegistry.registerIdentity(investor1.address, mockIdentity, 566);
      await token.connect(owner).mint(investor1.address, TOKENS(1_000_000));

      await usdc.connect(owner).mint(owner.address, USDC(100_000));
      return { ...fixture, token, treasury };
    }

    it("platform fee and maintenance cut on revenue deposit", async function () {
      const { usdc, treasury, owner, platformWallet } = await setupActiveTreasury();
      const treasuryAddr  = await treasury.getAddress();
      const grossRevenue  = USDC(10_000);

      await usdc.connect(owner).approve(treasuryAddr, grossRevenue);
      const platformBefore = await usdc.balanceOf(platformWallet.address);
      await treasury.connect(owner).depositRevenue(grossRevenue);
      const platformAfter  = await usdc.balanceOf(platformWallet.address);

      expect(platformAfter - platformBefore).to.equal(USDC(200));           // 2% platform
      expect(await treasury.maintenanceReserveBalance()).to.equal(USDC(100)); // 1% maintenance
    });

    it("net yield stays in treasury for redemptions", async function () {
      const { usdc, treasury, owner } = await setupActiveTreasury();
      const treasuryAddr = await treasury.getAddress();
      await usdc.connect(owner).approve(treasuryAddr, USDC(10_000));
      await treasury.connect(owner).depositRevenue(USDC(10_000));
      expect(await treasury.availableForRedemption()).to.equal(USDC(9_700)); // 97% net
    });

    it("governance can spend from maintenance reserve", async function () {
      const { usdc, treasury, owner, investor2 } = await setupActiveTreasury();
      const treasuryAddr = await treasury.getAddress();
      await treasury.connect(owner).setGovernanceContract(owner.address);
      await usdc.connect(owner).approve(treasuryAddr, USDC(10_000));
      await treasury.connect(owner).depositRevenue(USDC(10_000));

      const balBefore = await usdc.balanceOf(investor2.address);
      await treasury.connect(owner).spendFromReserve(investor2.address, USDC(50), "HVAC repair");
      expect(await usdc.balanceOf(investor2.address) - balBefore).to.equal(USDC(50));
      expect(await treasury.maintenanceReserveBalance()).to.equal(USDC(50));
    });

    it("non-governance cannot spend from reserve", async function () {
      const { treasury, investor1 } = await setupActiveTreasury();
      await expect(
        treasury.connect(investor1).spendFromReserve(investor1.address, USDC(10), "hack")
      ).to.be.revertedWith("Treasury: caller is not governance");
    });

    it("owner can update valuation manually", async function () {
      const { treasury, token, owner } = await setupActiveTreasury();
      const newVal   = TOKENS(1_200_000);
      const supply   = await token.totalSupply();
      const newPrice = (newVal * BigInt(1e18)) / supply;
      await treasury.connect(owner).manualUpdateValuation(newVal, newPrice);
      expect((await token.assetMetadata()).valuationUSD).to.equal(newVal);
    });
  });



  // ── 7. AssetFactory admin ──────────────────────────────────────────────
  describe("AssetFactory Admin", function () {
    it("owner can update platform wallet", async function () {
      const { factory, owner, investor2 } = await loadFixture(deployFullStack);
      await factory.connect(owner).setPlatformWallet(investor2.address);
      expect(await factory.platformWallet()).to.equal(investor2.address);
    });

    it("non-owner cannot update platform wallet", async function () {
      const { factory, investor1, investor2 } = await loadFixture(deployFullStack);
      await expect(
        factory.connect(investor1).setPlatformWallet(investor2.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("owner can update fee manager", async function () {
      const { factory, owner, feeManager } = await loadFixture(deployFullStack);
      const newFeeManager = await (await ethers.getContractFactory("FeeManager")).deploy(
        100, 50, 75, 50, 1000, 500, 500, 500, owner.address
      );
      await factory.connect(owner).setFeeManager(await newFeeManager.getAddress());
      expect(await factory.feeManager()).to.equal(await newFeeManager.getAddress());
    });
  });

  // ── 8. Asset Governance ─────────────────────────────────────────────────
  describe("Asset Governance — Per-Asset OpenZeppelin Governor & Timelock", function () {
    async function setupGovernance() {
      const fixture = await loadFixture(deployFullStack);
      const { factory, identityRegistry, usdc, owner, investor1, investor2 } = fixture;

      // Configure short voting period on factory before deploying asset for fast tests
      await factory.connect(owner).setGovernanceParams(
        1,   // votingDelay: 1 block
        5,   // votingPeriod: 5 blocks
        0,   // proposalThreshold: 0 tokens
        30   // quorumNumerator: 30%
      );

      const { token, treasury, tokenAddr, treasuryAddr } = await deployTestAsset(factory, {}, owner);
      await token.connect(owner).setStatus(1); // ACTIVE

      // Whitelist and mint tokens to investor1
      const mockIdentity = ethers.Wallet.createRandom().address;
      await identityRegistry.registerIdentity(investor1.address, mockIdentity, 566);
      await token.connect(owner).mint(investor1.address, TOKENS(10_000));

      const govAddr = await factory.assetGovernor(tokenAddr);
      const timelockAddr = await factory.assetTimelock(tokenAddr);

      const governor = await ethers.getContractAt("AssetGovernor", govAddr);
      const timelock = await ethers.getContractAt("TimelockController", timelockAddr);

      // Deposit gross revenue to fund the maintenance reserve
      const grossRevenue = USDC(10_000);
      await usdc.connect(investor1).approve(treasuryAddr, grossRevenue);
      await treasury.connect(investor1).depositRevenue(grossRevenue);

      return { ...fixture, token, treasury, governor, timelock, tokenAddr, treasuryAddr };
    }

    it("deploys dedicated governor and timelock per asset clone", async function () {
      const { governor, timelock, treasury } = await setupGovernance();
      expect(await governor.getAddress()).to.not.equal(ethers.ZeroAddress);
      expect(await timelock.getAddress()).to.not.equal(ethers.ZeroAddress);
      expect(await treasury.governanceContract()).to.equal(await timelock.getAddress());
    });

    it("verifies implicit self-delegation tracks votes", async function () {
      const { token, investor1 } = await setupGovernance();
      // Investor1 balance is 10,000. Without manual delegation, they should have 10,000 votes.
      expect(await token.getVotes(investor1.address)).to.equal(TOKENS(10_000));
    });

    it("executes a spendFromReserve action through the governance proposal lifecycle", async function () {
      const { usdc, treasury, governor, owner, investor1, investor2, treasuryAddr } = await setupGovernance();

      // Propose: spend 50 USDC from reserve to investor2
      const target = treasuryAddr;
      const value = 0;
      const calldata = treasury.interface.encodeFunctionData("spendFromReserve", [
        investor2.address,
        USDC(50),
        "Leak repair"
      ]);
      const description = "Spend 50 USDC for Leak repair";

      const proposeTx = await governor.connect(investor1).propose([target], [value], [calldata], description);
      const receipt = await proposeTx.wait();

      // Parse proposalId from logs
      let proposalId;
      const govIface = governor.interface;
      for (const log of receipt.logs) {
        try {
          const parsed = govIface.parseLog(log);
          if (parsed && parsed.name === "ProposalCreated") {
            proposalId = parsed.args[0];
            break;
          }
        } catch {}
      }
      expect(proposalId).to.not.be.undefined;

      // Proposal state should be Pending (since votingDelay = 1 block)
      expect(await governor.state(proposalId)).to.equal(0); // 0 = Pending

      // Mine 1 block to open voting
      await ethers.provider.send("evm_mine", []);
      expect(await governor.state(proposalId)).to.equal(1); // 1 = Active

      // Cast vote FOR (support = 1)
      await governor.connect(investor1).castVote(proposalId, 1);

      // Mine 5 blocks to close voting (votingPeriod = 5)
      for (let i = 0; i < 5; i++) {
        await ethers.provider.send("evm_mine", []);
      }
      expect(await governor.state(proposalId)).to.equal(4); // 4 = Succeeded

      // Queue the proposal in the Timelock
      const descHash = ethers.id(description);
      await governor.connect(investor1).queue([target], [value], [calldata], descHash);
      expect(await governor.state(proposalId)).to.equal(5); // 5 = Queued

      // Advance time by 2 days (172800 seconds) for timelock delay
      await ethers.provider.send("evm_increaseTime", [2 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);

      // Execute the proposal
      const balBefore = await usdc.balanceOf(investor2.address);
      await governor.connect(investor1).execute([target], [value], [calldata], descHash);

      const balAfter = await usdc.balanceOf(investor2.address);
      expect(balAfter - balBefore).to.equal(USDC(50));
      expect(await treasury.maintenanceReserveBalance()).to.equal(USDC(50)); // original 100 - 50 spent
    });
  });
});
