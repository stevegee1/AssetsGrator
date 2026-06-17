// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@tokenysolutions/t-rex/contracts/registry/interface/IIdentityRegistry.sol";

/**
 * @title HydroAsset
 * @notice Trusted commercial layer for pre-purchasing hydrogen production allocations.
 *         Standardizes future production batches into ERC1155 tokens (representing kg).
 *         Tracks delivery deadlines, overstay storage fees, and allows transfer/redemption.
 *         Enforces ERC-3643 KYC compliance to ensure tokens are always in verified hands.
 */
contract HydroAsset is ERC1155, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ─── Structs ──────────────────────────────────────────────────────────────

    struct ProductionBatch {
        address producer;
        uint256 totalKg;
        uint256 pricePerKg;             // Price platform pays producer (in GBPT, 6 decimals)
        uint256 salePricePerKg;         // Price buyers pay (in GBPT, 6 decimals)
        uint256 purchaseDeadline;       // Last timestamp for buyers to purchase allocation
        uint256 deliveryEstimate;       // Estimated production completion date
        uint256 completionTime;         // Actual completion timestamp (0 if pending)
        uint256 redemptionWindow;       // Seconds from completion before storage fees apply (e.g. 30 days)
        uint256 storageFeePerKgPerDay;  // Overstay fee (in GBPT, 6 decimals)
        uint256 totalSold;              // Total kg purchased
        uint256 totalRedeemed;          // Total kg redeemed
        bool isCompleted;               // Whether production is marked complete
        bool isCancelled;               // Whether production was cancelled
    }

    // ─── State Variables ──────────────────────────────────────────────────────

    IERC20 public immutable paymentToken; // GBPT / USDC (6 decimals)
    address public platformWallet;
    uint256 public transferFee;           // Flat fee per transfer (in GBPT, 6 decimals)
    uint256 public nextBatchId;
    IIdentityRegistry public immutable identityRegistry; // ERC-3643 KYC registry

    mapping(uint256 => ProductionBatch) public batches;
    mapping(address => bool) public isProducer;

    // ─── Events ───────────────────────────────────────────────────────────────

    event ProductionCommitted(
        uint256 indexed batchId,
        address indexed producer,
        uint256 totalKg,
        uint256 pricePerKg,
        uint256 salePricePerKg
    );
    event AllocationPurchased(uint256 indexed batchId, address indexed buyer, uint256 quantity);
    event ProductionCompleted(uint256 indexed batchId, uint256 completionTime);
    event AllocationRedeemed(uint256 indexed batchId, address indexed buyer, uint256 quantity, uint256 storageFee);
    event AllocationRefunded(uint256 indexed batchId, address indexed buyer, uint256 quantity);
    event UnsoldAllocationCancelled(uint256 indexed batchId, uint256 quantityCancelled);
    event BatchCancelled(uint256 indexed batchId);
    
    event PlatformWalletUpdated(address indexed oldWallet, address indexed newWallet);
    event TransferFeeUpdated(uint256 oldFee, uint256 newFee);
    event ProducerStatusUpdated(address indexed producer, bool status);

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyProducer() {
        require(isProducer[msg.sender], "HydroAsset: caller is not a whitelisted producer");
        _;
    }

    modifier onlyBatchProducer(uint256 batchId) {
        require(batches[batchId].producer == msg.sender, "HydroAsset: caller is not the producer of this batch");
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(
        address paymentToken_,
        address platformWallet_,
        address identityRegistry_,
        string memory uri_
    ) ERC1155(uri_) {
        require(paymentToken_ != address(0), "HydroAsset: zero payment token");
        require(platformWallet_ != address(0), "HydroAsset: zero platform wallet");
        require(identityRegistry_ != address(0), "HydroAsset: zero identity registry");

        paymentToken = IERC20(paymentToken_);
        platformWallet = platformWallet_;
        identityRegistry = IIdentityRegistry(identityRegistry_);
        nextBatchId = 1;
    }

    // ─── Producer Interface ───────────────────────────────────────────────────

    /**
     * @notice Allows a whitelisted producer to commit a future production batch.
     */
    function commitProduction(
        uint256 totalKg,
        uint256 pricePerKg,
        uint256 salePricePerKg,
        uint256 purchaseDeadline,
        uint256 deliveryEstimate,
        uint256 redemptionWindow,
        uint256 storageFeePerKgPerDay
    ) external onlyProducer returns (uint256 batchId) {
        require(totalKg > 0, "HydroAsset: totalKg must be greater than zero");
        require(pricePerKg > 0, "HydroAsset: pricePerKg must be greater than zero");
        require(salePricePerKg >= pricePerKg, "HydroAsset: salePrice must be >= pricePerKg");
        require(purchaseDeadline > block.timestamp, "HydroAsset: purchase deadline must be future");
        require(deliveryEstimate > purchaseDeadline, "HydroAsset: delivery estimate must be after purchase deadline");
        require(redemptionWindow > 0, "HydroAsset: redemptionWindow must be greater than zero");

        batchId = nextBatchId++;
        batches[batchId] = ProductionBatch({
            producer: msg.sender,
            totalKg: totalKg,
            pricePerKg: pricePerKg,
            salePricePerKg: salePricePerKg,
            purchaseDeadline: purchaseDeadline,
            deliveryEstimate: deliveryEstimate,
            completionTime: 0,
            redemptionWindow: redemptionWindow,
            storageFeePerKgPerDay: storageFeePerKgPerDay,
            totalSold: 0,
            totalRedeemed: 0,
            isCompleted: false,
            isCancelled: false
        });

        emit ProductionCommitted(batchId, msg.sender, totalKg, pricePerKg, salePricePerKg);
    }

    /**
     * @notice Marks production complete for a given batch. Begins redemption window clock.
     */
    function completeProduction(uint256 batchId) external nonReentrant {
        ProductionBatch storage batch = batches[batchId];
        require(msg.sender == batch.producer || msg.sender == owner(), "HydroAsset: unauthorized");
        require(!batch.isCompleted, "HydroAsset: batch already completed");
        require(!batch.isCancelled, "HydroAsset: batch is cancelled");

        batch.isCompleted = true;
        batch.completionTime = block.timestamp;

        emit ProductionCompleted(batchId, block.timestamp);
    }

    /**
     * @notice Retracts unsold allocation capacity after the purchase deadline has passed.
     */
    function cancelUnsoldAllocation(uint256 batchId) external onlyBatchProducer(batchId) nonReentrant {
        ProductionBatch storage batch = batches[batchId];
        require(block.timestamp > batch.purchaseDeadline, "HydroAsset: purchase deadline has not passed");
        uint256 unsold = batch.totalKg - batch.totalSold;
        require(unsold > 0, "HydroAsset: no unsold allocation left to cancel");

        batch.totalKg = batch.totalSold;

        emit UnsoldAllocationCancelled(batchId, unsold);
    }

    /**
     * @notice Cancels a pending production batch due to delay or force majeure.
     */
    function cancelBatch(uint256 batchId) external nonReentrant {
        ProductionBatch storage batch = batches[batchId];
        require(msg.sender == batch.producer || msg.sender == owner(), "HydroAsset: unauthorized");
        require(!batch.isCompleted, "HydroAsset: cannot cancel completed batch");
        require(!batch.isCancelled, "HydroAsset: batch already cancelled");

        batch.isCancelled = true;

        emit BatchCancelled(batchId);
    }

    // ─── Buyer Interface ──────────────────────────────────────────────────────

    /**
     * @notice Purchase future hydrogen allocation units from a batch.
     */
    function purchaseAllocation(uint256 batchId, uint256 quantity) external nonReentrant {
        require(identityRegistry.isVerified(msg.sender), "HydroAsset: buyer is not KYC verified");
        ProductionBatch storage batch = batches[batchId];
        require(block.timestamp <= batch.purchaseDeadline, "HydroAsset: purchase deadline passed");
        require(batch.totalSold + quantity <= batch.totalKg, "HydroAsset: exceeds total batch capacity");
        require(!batch.isCancelled, "HydroAsset: batch was cancelled");

        uint256 cost = quantity * batch.salePricePerKg;
        paymentToken.safeTransferFrom(msg.sender, address(this), cost);

        batch.totalSold += quantity;
        _mint(msg.sender, batchId, quantity, "");

        emit AllocationPurchased(batchId, msg.sender, quantity);
    }

    /**
     * @notice Redeems completed hydrogen allocation units. Calculates and collects overstay fees if applicable.
     */
    function redeemAllocation(uint256 batchId, uint256 quantity) external nonReentrant {
        require(identityRegistry.isVerified(msg.sender), "HydroAsset: redeemer is not KYC verified");
        ProductionBatch storage batch = batches[batchId];
        require(batch.isCompleted, "HydroAsset: production not yet complete");
        require(!batch.isCancelled, "HydroAsset: batch is cancelled");
        require(balanceOf(msg.sender, batchId) >= quantity, "HydroAsset: insufficient balance");

        _burn(msg.sender, batchId, quantity);

        uint256 storageFee = 0;
        uint256 overstayDeadline = batch.completionTime + batch.redemptionWindow;
        if (block.timestamp > overstayDeadline) {
            uint256 overdueSeconds = block.timestamp - overstayDeadline;
            storageFee = (quantity * batch.storageFeePerKgPerDay * overdueSeconds) / 1 days;
            
            if (storageFee > 0) {
                paymentToken.safeTransferFrom(msg.sender, platformWallet, storageFee);
            }
        }

        // Split funds: producer gets cost share, platform gets margin
        uint256 producerShare = quantity * batch.pricePerKg;
        paymentToken.safeTransfer(batch.producer, producerShare);

        uint256 platformMargin = quantity * (batch.salePricePerKg - batch.pricePerKg);
        if (platformMargin > 0) {
            paymentToken.safeTransfer(platformWallet, platformMargin);
        }

        batch.totalRedeemed += quantity;

        emit AllocationRedeemed(batchId, msg.sender, quantity, storageFee);
    }

    /**
     * @notice Request refund if a batch is cancelled or delivery is delayed by >60 days.
     */
    function requestRefund(uint256 batchId, uint256 quantity) external nonReentrant {
        require(identityRegistry.isVerified(msg.sender), "HydroAsset: caller is not KYC verified");
        ProductionBatch storage batch = batches[batchId];
        require(!batch.isCompleted, "HydroAsset: cannot refund a completed batch");
        require(
            batch.isCancelled || block.timestamp > batch.deliveryEstimate + 60 days,
            "HydroAsset: refund conditions not met"
        );
        require(balanceOf(msg.sender, batchId) >= quantity, "HydroAsset: insufficient balance");

        _burn(msg.sender, batchId, quantity);

        uint256 refundAmount = quantity * batch.salePricePerKg;
        paymentToken.safeTransfer(msg.sender, refundAmount);

        // Reduce totalSold since this amount was refunded
        batch.totalSold -= quantity;

        emit AllocationRefunded(batchId, msg.sender, quantity);
    }

    // ─── Custom ERC1155 Overrides for Transfer Fees & KYC Verification ────────

    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public override {
        _chargeTransferFee(from, to, amount);
        super.safeTransferFrom(from, to, id, amount, data);
    }

    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public override {
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        _chargeTransferFee(from, to, totalAmount);
        super.safeBatchTransferFrom(from, to, ids, amounts, data);
    }

    function _chargeTransferFee(address from, address to, uint256 amount) internal {
        // KYC compliance check: recipient must be verified (must always be in a verified hand)
        if (to != address(0)) {
            require(identityRegistry.isVerified(to), "HydroAsset: recipient is not KYC verified");
        }
        // Only charge transfer fees on actual transfers between user wallets
        if (transferFee > 0 && from != address(0) && to != address(0) && amount > 0) {
            paymentToken.safeTransferFrom(msg.sender, platformWallet, transferFee);
        }
    }

    // ─── Admin settings ───────────────────────────────────────────────────────

    function setProducerStatus(address producer, bool status) external onlyOwner {
        isProducer[producer] = status;
        emit ProducerStatusUpdated(producer, status);
    }

    function setPlatformWallet(address wallet) external onlyOwner {
        require(wallet != address(0), "HydroAsset: zero wallet address");
        emit PlatformWalletUpdated(platformWallet, wallet);
        platformWallet = wallet;
    }

    function setTransferFee(uint256 fee) external onlyOwner {
        emit TransferFeeUpdated(transferFee, fee);
        transferFee = fee;
    }

    // Custom helper to retrieve token identity registry (required for ERC3643 interoperability)
    function identityRegistryContract() external view returns (address) {
        return address(identityRegistry);
    }

    function setURI(string memory newuri) external onlyOwner {
        _setURI(newuri);
    }
}
