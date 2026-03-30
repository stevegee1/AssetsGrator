/**
 * ConfidentialLoan — Full Lifecycle Test Suite
 *
 * Uses real AssetToken (ERC-3643 / T-REX) as collateral, with the loan contract
 * added as a T-REX Agent so it can call forcedTransfer to custody shares.
 *
 * Test setup reuses the full T-REX stack from RWAPlatform.test.js:
 *   AssetFactory → deploys AssetToken + AssetTreasury + Compliance + IdentityRegistry
 *   AssetToken   → activated (setStatus ACTIVE) so shares are minted and transferable
 *   Loan         → deployed with all FHE dependencies wired up
 *   Loan contract added as AssetToken agent (required for forcedTransfer)
 *
 * Mock signature format for FHE.publishDecryptResult:
 *   messageHash = keccak256(abi.encodePacked(ctHash, result))
 *   signer      = Wallet(MOCKS_DECRYPT_RESULT_SIGNER_PRIVATE_KEY)
 *   signature   = signer.signMessage(getBytes(messageHash))  ← Ethereum prefix applied
 */

const hre  = require("hardhat");
const { expect }     = require("chai");
const { ethers }     = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { time }        = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { Encryptable, FheTypes, MOCKS_DECRYPT_RESULT_SIGNER_PRIVATE_KEY } = require("@cofhe/sdk");

// ─── Helpers ─────────────────────────────────────────────────────────────────
const USDC   = (n) => BigInt(n) * 1_000_000n;
const TOKENS = (n) => hre.ethers.parseEther(String(n));

const ASSET_CATEGORY = { RENEWABLE_ENERGY: 0, REAL_ESTATE: 1 };
const ASSET_STATUS   = { PENDING: 0, ACTIVE: 1, PAUSED: 2, CLOSED: 3 };

/// Sign a mock FHE async decrypt result using the mock threshold network key.
/// MockTaskManager._verifyDecryptResult: keccak256(abi.encodePacked(ctHash, result))
async function signDecryptResult(ctHash, result) {
  const msgHash = ethers.solidityPackedKeccak256(["uint256","uint256"], [ctHash, result]);
  // MockTaskManager uses raw ECDSA.recover (no EIP-191 prefix) — must use raw signing
  const signingKey = new ethers.SigningKey(MOCKS_DECRYPT_RESULT_SIGNER_PRIVATE_KEY);
  const sig = signingKey.sign(msgHash);
  return ethers.Signature.from(sig).serialized;
}

// ─── Fixture ─────────────────────────────────────────────────────────────────
async function deployFullLoanStack() {
  const [owner, borrower, auditor, treasury, investor2] = await hre.ethers.getSigners();
  const cofheClient = await hre.cofhe.createClientWithBatteries(owner);

  // ── MockUSDC ────────────────────────────────────────────────────────────
  const USDCFactory = await hre.ethers.getContractFactory("contracts/mocks/MockUSDC.sol:MockUSDC");
  const usdc = await USDCFactory.deploy();
  await usdc.faucet(treasury.address, USDC(1_000_000));
  await usdc.faucet(borrower.address, USDC(100_000));

  // ── T-REX Infrastructure (init() pattern — matches proven RWAPlatform setup) ─
  const CTR = await hre.ethers.getContractFactory(
    "@tokenysolutions/t-rex/contracts/registry/implementation/ClaimTopicsRegistry.sol:ClaimTopicsRegistry"
  );
  const claimTopicsRegistry = await CTR.deploy();
  await claimTopicsRegistry.init();

  const TIR = await hre.ethers.getContractFactory(
    "@tokenysolutions/t-rex/contracts/registry/implementation/TrustedIssuersRegistry.sol:TrustedIssuersRegistry"
  );
  const trustedIssuersRegistry = await TIR.deploy();
  await trustedIssuersRegistry.init();

  const IRS = await hre.ethers.getContractFactory(
    "@tokenysolutions/t-rex/contracts/registry/implementation/IdentityRegistryStorage.sol:IdentityRegistryStorage"
  );
  const identityRegistryStorage = await IRS.deploy();
  await identityRegistryStorage.init();

  const IR = await hre.ethers.getContractFactory(
    "@tokenysolutions/t-rex/contracts/registry/implementation/IdentityRegistry.sol:IdentityRegistry"
  );
  const identityRegistry = await IR.deploy();
  await identityRegistry.init(
    await trustedIssuersRegistry.getAddress(),
    await claimTopicsRegistry.getAddress(),
    await identityRegistryStorage.getAddress()
  );
  await identityRegistryStorage.bindIdentityRegistry(await identityRegistry.getAddress());

  // ── Implementation contracts (clone templates) ───────────────────────────
  const AssetToken = await hre.ethers.getContractFactory("AssetToken");
  const tokenImpl  = await AssetToken.deploy();

  const ModularCompliance = await hre.ethers.getContractFactory(
    "@tokenysolutions/t-rex/contracts/compliance/modular/ModularCompliance.sol:ModularCompliance"
  );
  const complianceImpl = await ModularCompliance.deploy();

  const KYCModule     = await hre.ethers.getContractFactory("KYCComplianceModule");
  const kycModuleImpl = await KYCModule.deploy();

  // ── Mock FHE contracts for factory wiring ────────────────────────────────
  const MockFee = await hre.ethers.getContractFactory("contracts/mocks/MockFHEFeeManagerV2.sol:MockFHEFeeManagerV2");
  const mockFeeManager = await MockFee.deploy(200, 100, 150, 100, 500, 300, 500, 500);

  const MockPortfolio = await hre.ethers.getContractFactory("contracts/mocks/MockFHEPortfolioRegistry.sol:MockFHEPortfolioRegistry");
  const mockPortfolio = await MockPortfolio.deploy();

  // ── AssetFactory (via ERC1967 proxy — same as production) ───────────────
  const AssetFactory_  = await hre.ethers.getContractFactory("AssetFactory");
  const factoryImpl    = await AssetFactory_.deploy();

  const initData = factoryImpl.interface.encodeFunctionData("initialize", [
    await tokenImpl.getAddress(),
    await complianceImpl.getAddress(),
    await kycModuleImpl.getAddress(),
    await identityRegistry.getAddress(),
    await mockFeeManager.getAddress(),
    await mockPortfolio.getAddress(),
    await usdc.getAddress(),
    treasury.address,   // platformWallet
  ]);

  const ERC1967Proxy = await hre.ethers.getContractFactory(
    "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy"
  );
  const proxy   = await ERC1967Proxy.deploy(await factoryImpl.getAddress(), initData);
  const factory = AssetFactory_.attach(await proxy.getAddress());

  await identityRegistry.addAgent(await factory.getAddress());
  await identityRegistry.addAgent(owner.address);

  // ── Deploy an asset (Solar Farm) ─────────────────────────────────────────
  const assetTx = await factory.deployAsset({
    name: "Solar Farm Alpha", symbol: "SFA", ipfsCID: "QmTest",
    location: "Lagos", category: 0, assetSubType: "solar farm",
    totalSupply: TOKENS(1_000_000), pricePerUnit: USDC(1),
    valuationUSD: USDC(10_000_000), capacityKW: 5000, annualYieldMWh: 8760,
    ppaContractCID: "", ppaTermYears: 20, identityRegistry: hre.ethers.ZeroAddress,
  });
  await assetTx.wait();

  const tokenAddr     = (await factory.getAllAssets())[0];
  const treasuryAddr  = await factory.getTreasury(tokenAddr);
  const token         = await hre.ethers.getContractAt("AssetToken", tokenAddr);
  const assetTreasury = await hre.ethers.getContractAt("AssetTreasury", treasuryAddr);

  // Owner must be agent to call setStatus() and mint()
  await token.addAgent(owner.address);

  // Activate: setStatus(ACTIVE) only unpauses — does NOT mint
  await token.connect(owner).setStatus(1); // ACTIVE

  // Register borrower identity so they can receive tokens (T-REX compliance)
  const mockIdentity = hre.ethers.Wallet.createRandom().address;
  await identityRegistry.registerIdentity(borrower.address, mockIdentity, 566);

  // Mint shares directly to borrower (owner is agent, can bypass compliance
  // module only via mint — borrower IS registered so standard mint works)
  await token.connect(owner).mint(borrower.address, TOKENS(50_000));

  // ── FHE Contracts ────────────────────────────────────────────────────────
  const KYCRegFactory = await hre.ethers.getContractFactory("FHEKYCRegistry");
  const kycRegistry   = await KYCRegFactory.deploy();
  await kycRegistry.authoriseProvider(owner.address);

  const ValFactory   = await hre.ethers.getContractFactory("FHEAssetValuation");
  const fheValuation = await ValFactory.deploy();
  await fheValuation.authoriseValuator(owner.address);

  // Register asset valuation: $15M total, owner gets decrypt grant
  const [encInitVal] = await cofheClient
    .encryptInputs([Encryptable.uint64(USDC(15_000_000))])
    .execute();
  await fheValuation.registerAsset(tokenAddr, encInitVal, owner.address);

  const FeeFactory = await hre.ethers.getContractFactory("FHEFeeManager");
  const [ep, em, ee, emkt] = await cofheClient
    .encryptInputs([
      Encryptable.uint32(200n),
      Encryptable.uint32(100n),
      Encryptable.uint32(150n),
      Encryptable.uint32(100n),
    ])
    .execute();
  const feeManager = await FeeFactory.deploy(ep, em, ee, emkt, 500, 300, 500, 500, owner.address);
  // ── Seed FHEFeeManager plaintext cache ───────────────────────────────────
  // The real FHEFeeManager's plaintext cache starts at zero (bridge pattern).
  // updateX() calls now sync the cache immediately — use them to seed it.
  await feeManager.updatePlatformRevenueBps(200);     // 2%
  await feeManager.updateMaintenanceReserveBps(100);  // 1%
  await feeManager.updateExitFeeBps(150);             // 1.5%
  await feeManager.updateMarketplaceFeeBps(100);      // 1%

  // ── ConfidentialLoan ─────────────────────────────────────────────────────
  const LoanFactory = await hre.ethers.getContractFactory("ConfidentialLoan");
  const loan = await LoanFactory.deploy(
    await kycRegistry.getAddress(),
    await fheValuation.getAddress(),
    await feeManager.getAddress(),
    await usdc.getAddress(),
    treasury.address,
    8000,               // maxLtvBps
    365 * 24 * 60 * 60, // 1 year
    USDC(5_000),
    owner.address
  );

  const loanAddr = await loan.getAddress();

  // Loan contract must be T-REX Agent to call forcedTransfer for collateral custody
  await token.addAgent(loanAddr);
  // Loan contract reads KYC attrs as compliance address = address(this)
  await kycRegistry.authoriseProvider(loanAddr);
  // Loan contract calls getEncryptedValuation for LTV — needs valuator role
  await fheValuation.authoriseValuator(loanAddr);
  // Treasury approves loan contract to disburse USDC
  await usdc.connect(treasury).approve(loanAddr, USDC(1_000_000));

  // Register token-related addresses in IdentityRegistry so T-REX forcedTransfer
  // accepts them as recipients. forcedTransfer checks isVerified(_to) for ALL callers.
  const loanMockId    = hre.ethers.Wallet.createRandom().address;
  const treasuryMockId = hre.ethers.Wallet.createRandom().address;
  await identityRegistry.registerIdentity(loanAddr,          loanMockId,    0);
  await identityRegistry.registerIdentity(treasury.address,  treasuryMockId, 0);


  return {
    owner, borrower, auditor, treasury, investor2,
    cofheClient,
    usdc, token, assetTreasury, factory,
    kycRegistry, fheValuation, feeManager, loan,
    tokenAddr, treasuryAddr,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("ConfidentialLoan — Full Lifecycle (ERC-3643 Collateral)", function () {
  this.timeout(300_000);

  // ── 1. Setup & Treasury ──────────────────────────────────────────────────
  describe("Setup & Treasury", function () {
    it("treasury is funded and has approved loan contract", async function () {
      const { loan, usdc, treasury } = await loadFixture(deployFullLoanStack);
      const allowance = await usdc.allowance(treasury.address, await loan.getAddress());
      expect(allowance).to.equal(USDC(1_000_000));
    });

    it("isTreasuryReady returns true", async function () {
      const { loan } = await loadFixture(deployFullLoanStack);
      expect(await loan.isTreasuryReady()).to.be.true;
    });

    it("borrower has AssetToken shares", async function () {
      const { token, borrower } = await loadFixture(deployFullLoanStack);
      const bal = await token.balanceOf(borrower.address);
      expect(bal).to.equal(TOKENS(50_000));
    });

    it("loan contract is an AssetToken agent (required for forcedTransfer)", async function () {
      const { token, loan } = await loadFixture(deployFullLoanStack);
      expect(await token.isAgent(await loan.getAddress())).to.be.true;
    });
  });

  // ── 2. KYC Verification ──────────────────────────────────────────────────
  describe("KYC Verification (two-step)", function () {
    it("borrower is not KYC verified initially", async function () {
      const { loan, borrower } = await loadFixture(deployFullLoanStack);
      expect(await loan.kycVerifiedFor(borrower.address)).to.be.false;
    });

    it("Step 1 — set encrypted KYC attributes for borrower in FHEKYCRegistry", async function () {
      const { loan, kycRegistry, borrower, cofheClient } = await loadFixture(deployFullLoanStack);
      const ATTR_ACCREDITED = ethers.keccak256(ethers.toUtf8Bytes("IS_ACCREDITED"));
      const ATTR_AML        = ethers.keccak256(ethers.toUtf8Bytes("AML_CLEARED"));
      const loanAddr = await loan.getAddress();

      const [encAccred, encAml] = await cofheClient
        .encryptInputs([Encryptable.bool(true), Encryptable.bool(true)])
        .execute();

      await (await kycRegistry.setEncryptedKYCAttr(loanAddr, borrower.address, ATTR_ACCREDITED, encAccred, 0)).wait();
      await (await kycRegistry.setEncryptedKYCAttr(loanAddr, borrower.address, ATTR_AML, encAml, 0)).wait();

      // Verify attribute is stored
      const handle = await kycRegistry.getEncryptedKYCAttr(loanAddr, borrower.address, ATTR_ACCREDITED);
      expect(handle).to.not.equal("0x0000000000000000000000000000000000000000000000000000000000000000");
    });

    it("Step 1 — requestKYCVerification fires FHE.decrypt without reverting", async function () {
      const { loan, kycRegistry, borrower, cofheClient } = await loadFixture(deployFullLoanStack);
      const ATTR_ACCREDITED = ethers.keccak256(ethers.toUtf8Bytes("IS_ACCREDITED"));
      const ATTR_AML        = ethers.keccak256(ethers.toUtf8Bytes("AML_CLEARED"));
      const loanAddr = await loan.getAddress();

      const [encA, encB] = await cofheClient
        .encryptInputs([Encryptable.bool(true), Encryptable.bool(true)])
        .execute();
      await kycRegistry.setEncryptedKYCAttr(loanAddr, borrower.address, ATTR_ACCREDITED, encA, 0);
      await kycRegistry.setEncryptedKYCAttr(loanAddr, borrower.address, ATTR_AML, encB, 0);

      await expect(loan.connect(borrower).requestKYCVerification()).to.not.be.reverted;
    });

    it("Step 2 — publishKYCResult marks borrower as verified", async function () {
      const { loan, borrower, owner } = await loadFixture(deployFullLoanStack);
      await (await loan.publishKYCResult(borrower.address, 1n, "0x")).wait();
      expect(await loan.kycVerifiedFor(borrower.address)).to.be.true;
    });

    it("Rejected borrower cannot originate loan", async function () {
      const { loan, token, borrower } = await loadFixture(deployFullLoanStack);
      // borrower NOT KYC verified — encrypt with borrowerClient (caller = borrower)
      const borrowerClient = await hre.cofhe.createClientWithBatteries(borrower);
      const dueDate = (await time.latest()) + 30 * 24 * 60 * 60;
      const [encAmt, encRate, encLtv] = await borrowerClient
        .encryptInputs([
          Encryptable.uint64(USDC(10_000)),
          Encryptable.uint32(500n),
          Encryptable.uint64(6500n),
        ])
        .execute();

      await expect(
        loan.connect(borrower).originateLoan(
          await token.getAddress(), TOKENS(5_000), USDC(10_000), encAmt, encRate, encLtv, dueDate
        )
      ).to.be.revertedWith("ConfidentialLoan: KYC not verified");
    });
  });

  // ── 3. Origination ───────────────────────────────────────────────────────
  describe("Origination", function () {
    async function setupWithKYC() {
      const ctx = await deployFullLoanStack();
      const { loan, kycRegistry, borrower, cofheClient } = ctx;
      const ATTR_ACCREDITED = ethers.keccak256(ethers.toUtf8Bytes("IS_ACCREDITED"));
      const ATTR_AML        = ethers.keccak256(ethers.toUtf8Bytes("AML_CLEARED"));
      const loanAddr        = await loan.getAddress();

      const [encA, encB] = await cofheClient
        .encryptInputs([Encryptable.bool(true), Encryptable.bool(true)])
        .execute();
      await kycRegistry.setEncryptedKYCAttr(loanAddr, borrower.address, ATTR_ACCREDITED, encA, 0);
      await kycRegistry.setEncryptedKYCAttr(loanAddr, borrower.address, ATTR_AML, encB, 0);
      await loan.connect(borrower).requestKYCVerification();
      await loan.publishKYCResult(borrower.address, 1n, "0x");
      return ctx;
    }

    it("Borrower can originate loan — shares locked in loan contract", async function () {
      const { loan, token, borrower, tokenAddr } = await setupWithKYC();
      // MUST use borrowerClient: cofhe validates encryptor == msg.sender
      const borrowerClient = await hre.cofhe.createClientWithBatteries(borrower);
      const collateralAmt  = TOKENS(10_000);
      const dueDate = (await time.latest()) + 30 * 24 * 60 * 60;

      const [encAmt, encRate, encLtv] = await borrowerClient
        .encryptInputs([
          Encryptable.uint64(USDC(10_000)),
          Encryptable.uint32(500n),
          Encryptable.uint64(6500n),
        ])
        .execute();

      const balBefore = await token.balanceOf(borrower.address);
      await (await loan.connect(borrower).originateLoan(
        tokenAddr, collateralAmt, USDC(10_000), encAmt, encRate, encLtv, dueDate
      )).wait();

      const balAfter = await token.balanceOf(borrower.address);
      expect(balBefore - balAfter).to.equal(collateralAmt);
      expect(await token.balanceOf(await loan.getAddress())).to.equal(collateralAmt);

      const [, , , , status] = await loan.getLoanPublic(0);
      expect(status).to.equal(1);
    });

    it("Borrower can decrypt their own loan amount", async function () {
      const { loan, borrower, tokenAddr } = await setupWithKYC();
      const borrowerClient = await hre.cofhe.createClientWithBatteries(borrower);
      const dueDate = (await time.latest()) + 30 * 24 * 60 * 60;
      const [encAmt, encRate, encLtv] = await borrowerClient
        .encryptInputs([
          Encryptable.uint64(USDC(10_000)),
          Encryptable.uint32(500n),
          Encryptable.uint64(6500n),
        ])
        .execute();
      await loan.connect(borrower).originateLoan(tokenAddr, TOKENS(10_000), USDC(10_000), encAmt, encRate, encLtv, dueDate);

      const [encLoanAmt] = await loan.connect(borrower).getLoanEncrypted(0);
      const decrypted = await borrowerClient.decryptForView(encLoanAmt, FheTypes.Uint64).execute();
      expect(decrypted).to.equal(USDC(10_000));
    });

    it("Stranger cannot read encrypted loan fields", async function () {
      const { loan, borrower, investor2, tokenAddr } = await setupWithKYC();
      const borrowerClient = await hre.cofhe.createClientWithBatteries(borrower);
      const dueDate = (await time.latest()) + 30 * 24 * 60 * 60;
      const [encAmt, encRate, encLtv] = await borrowerClient
        .encryptInputs([
          Encryptable.uint64(USDC(10_000)),
          Encryptable.uint32(500n),
          Encryptable.uint64(6500n),
        ])
        .execute();
      await loan.connect(borrower).originateLoan(tokenAddr, TOKENS(10_000), USDC(10_000), encAmt, encRate, encLtv, dueDate);
      await expect(loan.connect(investor2).getLoanEncrypted(0))
        .to.be.revertedWith("ConfidentialLoan: not permitted");
    });
  });

  // ── 4. Disbursal ─────────────────────────────────────────────────────────
  describe("Disbursal (two-step)", function () {
    let sharedCtx;
    const LOAN_AMOUNT    = USDC(10_000);
    const COLLATERAL_AMT = TOKENS(10_000);

    before(async function () {
      sharedCtx = await deployFullLoanStack();
      const { loan, kycRegistry, borrower, cofheClient, tokenAddr } = sharedCtx;

      const ATTR_ACCREDITED = ethers.keccak256(ethers.toUtf8Bytes("IS_ACCREDITED"));
      const ATTR_AML        = ethers.keccak256(ethers.toUtf8Bytes("AML_CLEARED"));
      const loanAddr        = await loan.getAddress();

      const [encA, encB] = await cofheClient
        .encryptInputs([Encryptable.bool(true), Encryptable.bool(true)])
        .execute();
      await kycRegistry.setEncryptedKYCAttr(loanAddr, borrower.address, ATTR_ACCREDITED, encA, 0);
      await kycRegistry.setEncryptedKYCAttr(loanAddr, borrower.address, ATTR_AML, encB, 0);
      await loan.connect(borrower).requestKYCVerification();
      await loan.publishKYCResult(borrower.address, 1n, "0x");

      const dueDate = (await time.latest()) + 30 * 24 * 60 * 60;
      // borrower must encrypt their own inputs
      const borrowerClient = await hre.cofhe.createClientWithBatteries(borrower);
      const [encAmt, encRate, encLtv] = await borrowerClient
        .encryptInputs([
          Encryptable.uint64(LOAN_AMOUNT),
          Encryptable.uint32(500n),
          Encryptable.uint64(6500n),
        ])
        .execute();
      await loan.connect(borrower).originateLoan(tokenAddr, COLLATERAL_AMT, USDC(10_000), encAmt, encRate, encLtv, dueDate);
      sharedCtx.borrowerClient = borrowerClient; // save for later use
    });

    it("Step 1 — publishDisbursalAmount: signed net amount recorded on-chain", async function () {
      const { loan, cofheClient, borrower } = sharedCtx;
      // Net disbursement = 10,000 USDC - 2% = 9,800 USDC
      const netAmt = LOAN_AMOUNT - (LOAN_AMOUNT * 200n / 10_000n); // 9_800_000_000n (6 dec)

      // Get the encNetDisbursement handle from the loan
      const [,,,,encNet] = await loan.getLoanEncrypted(0);
      const ctHash = BigInt(encNet);
      const sig    = await signDecryptResult(ctHash, netAmt);

      await expect(
        loan.publishDisbursalAmount(0, netAmt, sig)
      ).to.not.be.reverted;
    });

    it("Step 2 — confirmDisbursal: treasury sends net USDC to borrower", async function () {
      const { loan, usdc, borrower, treasury } = sharedCtx;
      const netAmt = LOAN_AMOUNT - (LOAN_AMOUNT * 200n / 10_000n);

      const borrowerBalBefore  = await usdc.balanceOf(borrower.address);
      const treasuryBalBefore  = await usdc.balanceOf(treasury.address);

      await (await loan.confirmDisbursal(0)).wait();

      expect(await usdc.balanceOf(borrower.address) - borrowerBalBefore).to.equal(netAmt);
      expect(treasuryBalBefore - await usdc.balanceOf(treasury.address)).to.equal(netAmt);

      const [,,,,status] = await loan.getLoanPublic(0);
      expect(status).to.equal(2); // Active
    });

    it("Cannot disburse twice", async function () {
      const { loan } = sharedCtx;
      await expect(loan.confirmDisbursal(0))
        .to.be.revertedWith("ConfidentialLoan: not pending");
    });
  });

  // ── 5. Auditor Access ────────────────────────────────────────────────────
  describe("Auditor Access", function () {
    it("Owner can grant auditor access — auditor decrypts loan amount", async function () {
      const { loan, kycRegistry, cofheClient, borrower, auditor, tokenAddr } =
        await loadFixture(deployFullLoanStack);

      const loanAddr = await loan.getAddress();
      const ATTR_A   = ethers.keccak256(ethers.toUtf8Bytes("IS_ACCREDITED"));
      const ATTR_AML = ethers.keccak256(ethers.toUtf8Bytes("AML_CLEARED"));
      // KYC attrs encrypted by owner (owner calls setEncryptedKYCAttr)
      const [eA, eB] = await cofheClient.encryptInputs([Encryptable.bool(true), Encryptable.bool(true)]).execute();
      await kycRegistry.setEncryptedKYCAttr(loanAddr, borrower.address, ATTR_A, eA, 0);
      await kycRegistry.setEncryptedKYCAttr(loanAddr, borrower.address, ATTR_AML, eB, 0);
      await loan.connect(borrower).requestKYCVerification();
      await loan.publishKYCResult(borrower.address, 1n, "0x");

      // Borrower encrypts their own loan terms
      const borrowerClient = await hre.cofhe.createClientWithBatteries(borrower);
      const dueDate = (await time.latest()) + 30 * 24 * 60 * 60;
      const [encAmt, encRate, encLtv] = await borrowerClient.encryptInputs([
        Encryptable.uint64(USDC(10_000)), Encryptable.uint32(500n), Encryptable.uint64(6500n)
      ]).execute();
      await loan.connect(borrower).originateLoan(tokenAddr, TOKENS(10_000), USDC(10_000), encAmt, encRate, encLtv, dueDate);

      // Grant auditor access
      const expiresAt = (await time.latest()) + 90 * 24 * 60 * 60;
      await (await loan.grantAuditorAccess(0, auditor.address, expiresAt)).wait();
      expect(await loan.isLoanAuditor(0, auditor.address)).to.be.true;

      const [encLoanAmt] = await loan.connect(auditor).getLoanEncrypted(0);
      const auditorClient = await hre.cofhe.createClientWithBatteries(auditor);
      const decrypted = await auditorClient.decryptForView(encLoanAmt, FheTypes.Uint64).execute();
      expect(decrypted).to.equal(USDC(10_000));
    });
  });

  // ── 6. Repayment ─────────────────────────────────────────────────────────
  describe("Repayment (two-step)", function () {
    let ctx;
    const LOAN_AMOUNT    = USDC(10_000);
    const COLLATERAL_AMT = TOKENS(10_000);

    before(async function () {
      ctx = await deployFullLoanStack();
      const { loan, kycRegistry, usdc, borrower, cofheClient, tokenAddr } = ctx;

      // KYC
      const loanAddr = await loan.getAddress();
      const ATTR_A   = ethers.keccak256(ethers.toUtf8Bytes("IS_ACCREDITED"));
      const ATTR_AML = ethers.keccak256(ethers.toUtf8Bytes("AML_CLEARED"));
      const [eA, eB] = await cofheClient.encryptInputs([Encryptable.bool(true), Encryptable.bool(true)]).execute();
      await kycRegistry.setEncryptedKYCAttr(loanAddr, borrower.address, ATTR_A, eA, 0);
      await kycRegistry.setEncryptedKYCAttr(loanAddr, borrower.address, ATTR_AML, eB, 0);
      await loan.connect(borrower).requestKYCVerification();
      await loan.publishKYCResult(borrower.address, 1n, "0x");

      // Originate — borrower encrypts their own inputs
      const dueDate = (await time.latest()) + 30 * 24 * 60 * 60;
      const borrowerClient = await hre.cofhe.createClientWithBatteries(borrower);
      const [encAmt, encRate, encLtv] = await borrowerClient.encryptInputs([
        Encryptable.uint64(LOAN_AMOUNT), Encryptable.uint32(500n), Encryptable.uint64(6500n)
      ]).execute();
      await loan.connect(borrower).originateLoan(tokenAddr, COLLATERAL_AMT, USDC(10_000), encAmt, encRate, encLtv, dueDate);

      // Publish net and disburse
      const netAmt = LOAN_AMOUNT - (LOAN_AMOUNT * 200n / 10_000n);
      const [,,,,encNet] = await loan.getLoanEncrypted(0);
      const sig = await signDecryptResult(BigInt(encNet), netAmt);
      await loan.publishDisbursalAmount(0, netAmt, sig);
      await loan.confirmDisbursal(0);

      // Approve repayment
      await usdc.connect(borrower).approve(loanAddr, LOAN_AMOUNT * 2n);
      ctx.borrowerClient = borrowerClient;
    });

    it("Step 1 — borrower calls repayLoan with encrypted amount → status = Repaid", async function () {
      const { loan, borrower } = ctx;
      // borrower must encrypt their own repayment amount
      const borrowerClient = ctx.borrowerClient ||
        await hre.cofhe.createClientWithBatteries(borrower);
      const [encRepay] = await borrowerClient
        .encryptInputs([Encryptable.uint64(LOAN_AMOUNT)])
        .execute();

      await expect(loan.connect(borrower).repayLoan(0, encRepay)).to.not.be.reverted;

      const [,,,,status] = await loan.getLoanPublic(0);
      expect(status).to.equal(3); // Repaid
    });

    it("Collateral still locked in loan contract after repayLoan", async function () {
      const { loan, token } = ctx;
      expect(await token.balanceOf(await loan.getAddress())).to.equal(COLLATERAL_AMT);
    });

    it("Step 2 — collectRepayment pulls USDC and returns collateral shares", async function () {
      const { loan, token, usdc, borrower, treasury } = ctx;
      const treasuryBal  = await usdc.balanceOf(treasury.address);
      const borrowerBal  = await usdc.balanceOf(borrower.address);
      const borrowerTok  = await token.balanceOf(borrower.address);

      await (await loan.collectRepayment(0, LOAN_AMOUNT)).wait();

      // USDC: borrower → treasury
      expect(await usdc.balanceOf(treasury.address) - treasuryBal).to.equal(LOAN_AMOUNT);
      expect(borrowerBal - await usdc.balanceOf(borrower.address)).to.equal(LOAN_AMOUNT);

      // AssetToken shares returned to borrower
      expect(await token.balanceOf(borrower.address) - borrowerTok).to.equal(COLLATERAL_AMT);
      expect(await token.balanceOf(await loan.getAddress())).to.equal(0n);
    });
  });

  // ── 7. Liquidation ───────────────────────────────────────────────────────
  describe("Liquidation (two-step)", function () {
    let ctx;
    const COLLATERAL_AMT = TOKENS(10_000);
    const LOAN_AMOUNT    = USDC(10_000);

    before(async function () {
      ctx = await deployFullLoanStack();
      const { loan, kycRegistry, borrower, cofheClient, tokenAddr } = ctx;

      // KYC + originate + disburse
      const loanAddr = await loan.getAddress();
      const ATTR_A   = ethers.keccak256(ethers.toUtf8Bytes("IS_ACCREDITED"));
      const ATTR_AML = ethers.keccak256(ethers.toUtf8Bytes("AML_CLEARED"));
      const [eA, eB] = await cofheClient.encryptInputs([Encryptable.bool(true), Encryptable.bool(true)]).execute();
      await kycRegistry.setEncryptedKYCAttr(loanAddr, borrower.address, ATTR_A, eA, 0);
      await kycRegistry.setEncryptedKYCAttr(loanAddr, borrower.address, ATTR_AML, eB, 0);
      await loan.connect(borrower).requestKYCVerification();
      await loan.publishKYCResult(borrower.address, 1n, "0x");

      const dueDate = (await time.latest()) + 365 * 24 * 60 * 60;
      const borrowerClient = await hre.cofhe.createClientWithBatteries(borrower);
      const [encAmt, encRate, encLtv] = await borrowerClient.encryptInputs([
        Encryptable.uint64(LOAN_AMOUNT), Encryptable.uint32(500n), Encryptable.uint64(6500n)
      ]).execute();
      await loan.connect(borrower).originateLoan(tokenAddr, COLLATERAL_AMT, USDC(10_000), encAmt, encRate, encLtv, dueDate);

      const netAmt = LOAN_AMOUNT - (LOAN_AMOUNT * 200n / 10_000n);
      const [,,,,encNet] = await loan.getLoanEncrypted(0);
      const sig = await signDecryptResult(BigInt(encNet), netAmt);
      await loan.publishDisbursalAmount(0, netAmt, sig);
      await loan.confirmDisbursal(0);
    });

    it("Anyone can call checkAndLiquidate on an active loan", async function () {
      const { loan, auditor } = ctx;
      const [,,,,status] = await loan.getLoanPublic(0);
      expect(status).to.equal(2); // Active

      await expect(loan.connect(auditor).checkAndLiquidate(0)).to.not.be.reverted;
    });

    it("Owner confirms liquidation — shares transferred to treasury", async function () {
      const { loan, token, treasury } = ctx;
      const treasuryTokBefore = await token.balanceOf(treasury.address);

      await (await loan.confirmLiquidation(0)).wait();

      // Collateral sent to treasury
      expect(await token.balanceOf(treasury.address) - treasuryTokBefore).to.equal(COLLATERAL_AMT);
      expect(await token.balanceOf(await loan.getAddress())).to.equal(0n);

      const [,,,,status] = await loan.getLoanPublic(0);
      expect(status).to.equal(4); // Liquidated
    });

    it("Cannot liquidate an already-liquidated loan", async function () {
      const { loan } = ctx;
      await expect(loan.confirmLiquidation(0))
        .to.be.revertedWith("ConfidentialLoan: not active");
    });
  });

  // ── 8. Admin ─────────────────────────────────────────────────────────────
  describe("Admin", function () {
    it("Owner can update treasury", async function () {
      const { loan, investor2 } = await loadFixture(deployFullLoanStack);
      await (await loan.setTreasury(investor2.address)).wait();
      expect(await loan.treasury()).to.equal(investor2.address);
    });

    it("Non-owner cannot update treasury", async function () {
      const { loan, borrower } = await loadFixture(deployFullLoanStack);
      await expect(loan.connect(borrower).setTreasury(borrower.address))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});
