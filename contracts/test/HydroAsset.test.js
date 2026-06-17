const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("HydroAsset Smart Contract", function () {
    let HydroAsset;
    let hydroAsset;
    let GBPPlatformToken;
    let paymentToken; // GBPT
    let MockIdentityRegistry;
    let identityRegistry;

    let owner;
    let platformWallet;
    let producer;
    let buyer1;
    let buyer2;
    let unverifiedUser;

    const INITIAL_SUPPLY = ethers.parseUnits("1000000", 6); // 1M GBPT (6 decimals)
    const TRANSFER_FEE = ethers.parseUnits("2", 6); // 2 GBPT

    beforeEach(async function () {
        [owner, platformWallet, producer, buyer1, buyer2, unverifiedUser] = await ethers.getSigners();

        // Deploy Mock GBPT payment token
        GBPPlatformToken = await ethers.getContractFactory("GBPPlatformToken");
        paymentToken = await GBPPlatformToken.deploy(owner.address);
        await paymentToken.waitForDeployment();

        // Deploy Mock IdentityRegistry
        MockIdentityRegistry = await ethers.getContractFactory("MockIdentityRegistry");
        identityRegistry = await MockIdentityRegistry.deploy();
        await identityRegistry.waitForDeployment();

        // Mint payment tokens to buyers/unverified
        await paymentToken.mint(buyer1.address, ethers.parseUnits("10000", 6));
        await paymentToken.mint(buyer2.address, ethers.parseUnits("10000", 6));
        await paymentToken.mint(unverifiedUser.address, ethers.parseUnits("10000", 6));

        // Deploy HydroAsset with IdentityRegistry parameter
        HydroAsset = await ethers.getContractFactory("HydroAsset");
        hydroAsset = await HydroAsset.deploy(
            await paymentToken.getAddress(),
            platformWallet.address,
            await identityRegistry.getAddress(),
            "https://api.platform.com/metadata/{id}.json"
        );
        await hydroAsset.waitForDeployment();

        // Set up KYC statuses
        await identityRegistry.setVerified(owner.address, true);
        await identityRegistry.setVerified(platformWallet.address, true);
        await identityRegistry.setVerified(producer.address, true);
        await identityRegistry.setVerified(buyer1.address, true);
        await identityRegistry.setVerified(buyer2.address, true);
        await identityRegistry.setVerified(unverifiedUser.address, false);

        // Setup transfer fee
        await hydroAsset.setTransferFee(TRANSFER_FEE);

        // Authorize producer
        await hydroAsset.setProducerStatus(producer.address, true);

        // Approve paymentToken to hydroAsset
        await paymentToken.connect(buyer1).approve(await hydroAsset.getAddress(), ethers.MaxUint256);
        await paymentToken.connect(buyer2).approve(await hydroAsset.getAddress(), ethers.MaxUint256);
        await paymentToken.connect(unverifiedUser).approve(await hydroAsset.getAddress(), ethers.MaxUint256);
    });

    describe("Initialization", function () {
        it("Should set the correct payment token, platform wallet, identity registry, and initial settings", async function () {
            expect(await hydroAsset.paymentToken()).to.equal(await paymentToken.getAddress());
            expect(await hydroAsset.platformWallet()).to.equal(platformWallet.address);
            expect(await hydroAsset.identityRegistry()).to.equal(await identityRegistry.getAddress());
            expect(await hydroAsset.transferFee()).to.equal(TRANSFER_FEE);
            expect(await hydroAsset.isProducer(producer.address)).to.be.true;
            expect(await hydroAsset.isProducer(buyer1.address)).to.be.false;
        });
    });

    describe("Batch Creation", function () {
        it("Should allow whitelisted producers to commit future production", async function () {
            const now = await time.latest();
            const purchaseDeadline = now + 3600; // 1 hour
            const deliveryEstimate = now + 7200; // 2 hours
            const redemptionWindow = 86400; // 1 day
            const storageFee = ethers.parseUnits("0.5", 6); // 0.5 GBPT per kg per day

            const tx = await hydroAsset.connect(producer).commitProduction(
                1000, // 1,000 kg
                ethers.parseUnits("5", 6), // pricePerKg (5 GBPT)
                ethers.parseUnits("6", 6), // salePricePerKg (6 GBPT)
                purchaseDeadline,
                deliveryEstimate,
                redemptionWindow,
                storageFee
            );

            await expect(tx).to.emit(hydroAsset, "ProductionCommitted")
                .withArgs(1, producer.address, 1000, ethers.parseUnits("5", 6), ethers.parseUnits("6", 6));

            const batch = await hydroAsset.batches(1);
            expect(batch.producer).to.equal(producer.address);
            expect(batch.totalKg).to.equal(1000);
            expect(batch.pricePerKg).to.equal(ethers.parseUnits("5", 6));
            expect(batch.salePricePerKg).to.equal(ethers.parseUnits("6", 6));
            expect(batch.purchaseDeadline).to.equal(purchaseDeadline);
            expect(batch.deliveryEstimate).to.equal(deliveryEstimate);
            expect(batch.redemptionWindow).to.equal(redemptionWindow);
            expect(batch.storageFeePerKgPerDay).to.equal(storageFee);
            expect(batch.isCompleted).to.be.false;
        });
    });

    describe("Pre-Purchase & KYC Restrictions", function () {
        let deadline;

        beforeEach(async function () {
            const now = await time.latest();
            deadline = now + 3600;
            await hydroAsset.connect(producer).commitProduction(
                1000,
                ethers.parseUnits("5", 6),
                ethers.parseUnits("6", 6),
                deadline,
                now + 7200,
                86400,
                ethers.parseUnits("1", 6)
            );
        });

        it("Should allow verified buyers to purchase allocations", async function () {
            const purchaseAmount = 200;
            await expect(hydroAsset.connect(buyer1).purchaseAllocation(1, purchaseAmount))
                .to.emit(hydroAsset, "AllocationPurchased")
                .withArgs(1, buyer1.address, purchaseAmount);
        });

        it("Should revert purchases from unverified buyers", async function () {
            await expect(hydroAsset.connect(unverifiedUser).purchaseAllocation(1, 200))
                .to.be.revertedWith("HydroAsset: buyer is not KYC verified");
        });
    });

    describe("Delivery, Redemption & KYC Gates", function () {
        let deadline;
        let delivery;
        const purchaseAmount = 200;

        beforeEach(async function () {
            const now = await time.latest();
            deadline = now + 3600;
            delivery = now + 7200;
            await hydroAsset.connect(producer).commitProduction(
                1000,
                ethers.parseUnits("5", 6),
                ethers.parseUnits("6", 6),
                deadline,
                delivery,
                86400,
                ethers.parseUnits("1", 6)
            );

            await hydroAsset.connect(buyer1).purchaseAllocation(1, purchaseAmount);
            await hydroAsset.connect(producer).completeProduction(1);
        });

        it("Should allow verified buyer to redeem", async function () {
            await expect(hydroAsset.connect(buyer1).redeemAllocation(1, purchaseAmount))
                .to.emit(hydroAsset, "AllocationRedeemed");
        });

        it("Should revert redemption if caller is unverified", async function () {
            // Transfer to unverified user bypassing validation first (by temporarily verifying them, transferring, and unverifying)
            await identityRegistry.setVerified(unverifiedUser.address, true);
            await hydroAsset.connect(buyer1).safeTransferFrom(buyer1.address, unverifiedUser.address, 1, purchaseAmount, "0x");
            await identityRegistry.setVerified(unverifiedUser.address, false);

            await expect(hydroAsset.connect(unverifiedUser).redeemAllocation(1, purchaseAmount))
                .to.be.revertedWith("HydroAsset: redeemer is not KYC verified");
        });

        it("Should charge storage fees for overdue redemptions", async function () {
            const completion = await time.latest();
            const overstayDeadline = completion + 86400;
            await time.increaseTo(overstayDeadline + 172800); // 2 days overdue

            const initialPlatformBal = await paymentToken.balanceOf(platformWallet.address);
            const initialBuyerBal = await paymentToken.balanceOf(buyer1.address);
            const expectedStorageFee = ethers.parseUnits("400", 6);

            const tx = await hydroAsset.connect(buyer1).redeemAllocation(1, purchaseAmount);
            const receipt = await tx.wait();

            const event = receipt.logs
                .map(log => {
                    try { return hydroAsset.interface.parseLog(log); } catch (e) { return null; }
                })
                .find(x => x && x.name === "AllocationRedeemed");

            expect(event).to.not.be.undefined;
            const actualStorageFee = event.args.storageFee;
            expect(actualStorageFee).to.be.closeTo(expectedStorageFee, ethers.parseUnits("0.05", 6));
        });
    });

    describe("Transfer & KYC Transfer Restrictions", function () {
        beforeEach(async function () {
            const now = await time.latest();
            await hydroAsset.connect(producer).commitProduction(
                1000,
                ethers.parseUnits("5", 6),
                ethers.parseUnits("6", 6),
                now + 3600,
                now + 7200,
                86400,
                ethers.parseUnits("1", 6)
            );
            await hydroAsset.connect(buyer1).purchaseAllocation(1, 300);
        });

        it("Should allow transfer to verified recipient and charge fee", async function () {
            const initialBuyer1Bal = await paymentToken.balanceOf(buyer1.address);
            await hydroAsset.connect(buyer1).safeTransferFrom(buyer1.address, buyer2.address, 1, 100, "0x");

            expect(await hydroAsset.balanceOf(buyer2.address, 1)).to.equal(100);
            expect(await paymentToken.balanceOf(buyer1.address)).to.equal(initialBuyer1Bal - TRANSFER_FEE);
        });

        it("Should revert transfer if recipient is not verified", async function () {
            await expect(
                hydroAsset.connect(buyer1).safeTransferFrom(buyer1.address, unverifiedUser.address, 1, 100, "0x")
            ).to.be.revertedWith("HydroAsset: recipient is not KYC verified");
        });
    });

    describe("Refunds & Delayed Delivery", function () {
        let estimate;

        beforeEach(async function () {
            const now = await time.latest();
            estimate = now + 7200;
            await hydroAsset.connect(producer).commitProduction(
                1000,
                ethers.parseUnits("5", 6),
                ethers.parseUnits("6", 6),
                now + 3600,
                estimate,
                86400,
                ethers.parseUnits("1", 6)
            );
            await hydroAsset.connect(buyer1).purchaseAllocation(1, 200);
        });

        it("Should refund verified buyer if delayed", async function () {
            await time.increaseTo(estimate + (60 * 86400) + 1);
            await expect(hydroAsset.connect(buyer1).requestRefund(1, 100))
                .to.emit(hydroAsset, "AllocationRefunded");
        });

        it("Should revert refund if buyer is unverified", async function () {
            await time.increaseTo(estimate + (60 * 86400) + 1);

            // Bypass transfer gate to place tokens in unverified hands first
            await identityRegistry.setVerified(unverifiedUser.address, true);
            await hydroAsset.connect(buyer1).safeTransferFrom(buyer1.address, unverifiedUser.address, 1, 100, "0x");
            await identityRegistry.setVerified(unverifiedUser.address, false);

            await expect(hydroAsset.connect(unverifiedUser).requestRefund(1, 100))
                .to.be.revertedWith("HydroAsset: caller is not KYC verified");
        });
    });
});
