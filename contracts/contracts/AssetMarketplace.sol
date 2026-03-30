// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "@tokenysolutions/t-rex/contracts/token/IToken.sol";

import "./AssetToken.sol";
import "./interfaces/IAssetMarketplace.sol";
import "./interfaces/IAssetToken.sol";
import "./AssetFactory.sol";
import "./interfaces/IFHEFeeManager.sol";

/// @title AssetMarketplace
/// @notice Handles two markets for any tokenised real-world asset:
///
///   PRIMARY MARKET  — investors buy directly from issuance supply.
///   SECONDARY MARKET — holders list units for peer-to-peer sale.
///
///   ERC-3643 transfer hooks enforce KYC on every move.
contract AssetMarketplace is
    IAssetMarketplace,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable
{
    using SafeERC20 for IERC20;

    // ─── State ────────────────────────────────────────────────────────────────

    AssetFactory public factory;
    address public paymentToken;
    address public feeRecipient;
    address public fheFeeManager;

    // ─── Secondary market listings ────────────────────────────────────────────

    uint256 private _nextListingId;
    mapping(uint256 => Listing) private _listings;
    mapping(address => uint256[]) private _activeListingsByToken;

    // ─── Constants ────────────────────────────────────────────────────────────

    uint256 public constant MAX_FEE_BPS = 500; // 5% max fee

    // ─── Initializer ──────────────────────────────────────────────────────────

    function initialize(
        address factory_,
        address paymentToken_,
        address feeRecipient_,
        address fheFeeManager_
    ) external initializer {
        __Ownable_init();
        __ReentrancyGuard_init();

        require(factory_ != address(0), "Marketplace: zero factory");
        require(feeRecipient_ != address(0), "Marketplace: zero fee recipient");
        require(fheFeeManager_ != address(0), "Marketplace: zero fee manager");

        factory = AssetFactory(factory_);
        paymentToken = paymentToken_;
        feeRecipient = feeRecipient_;
        fheFeeManager = fheFeeManager_;
    }

    // ─── Primary Market ───────────────────────────────────────────────────────

    /// @notice Buy fractional units directly from issuance supply
    function buyFromIssuance(
        address token,
        uint256 units
    ) external payable override nonReentrant {
        require(
            factory.isRegisteredAsset(token),
            "Marketplace: unknown asset"
        );

        address treasury = factory.getTreasury(token);
        require(treasury != address(0), "Marketplace: treasury not deployed");

        AssetToken at = AssetToken(token);
        require(
            at.assetStatus() == IAssetToken.AssetStatus.ACTIVE,
            "Marketplace: asset not active"
        );

        uint256 amount = units * (10 ** 18);
        uint256 totalCost = _calculateCost(token, units);

        require(totalCost > 0, "Marketplace: zero cost");

        uint256 fee = IFHEFeeManager(fheFeeManager).computeMarketplaceFeePlaintext(totalCost);
        uint256 proceeds = totalCost - fee;

        _collectPayment(msg.sender, totalCost);
        _sendPayment(feeRecipient, fee);
        _sendPayment(treasury, proceeds);

        IToken(token).transferFrom(treasury, msg.sender, amount);

        emit UnitsPurchasedFromIssuance(msg.sender, token, units, totalCost);
    }

    // ─── Secondary Market ─────────────────────────────────────────────────────

    function createListing(
        address token,
        uint256 units,
        uint256 pricePerUnit_
    ) external override nonReentrant returns (uint256 listingId) {
        require(
            factory.isRegisteredAsset(token),
            "Marketplace: unknown asset"
        );
        require(units > 0, "Marketplace: zero units");
        require(pricePerUnit_ > 0, "Marketplace: zero price");

        uint256 amount = units * (10 ** 18);
        require(
            IERC20(token).balanceOf(msg.sender) >= amount,
            "Marketplace: insufficient balance"
        );

        listingId = _nextListingId++;

        _listings[listingId] = Listing({
            seller: msg.sender,
            token: token,
            units: units,
            pricePerUnit: pricePerUnit_,
            active: true,
            listedAt: block.timestamp
        });

        _activeListingsByToken[token].push(listingId);

        emit ListingCreated(listingId, msg.sender, token, units, pricePerUnit_);
    }

    function fillListing(
        uint256 listingId,
        uint256 units
    ) external payable override nonReentrant {
        Listing storage listing = _listings[listingId];
        require(listing.active, "Marketplace: listing not active");
        require(
            units > 0 && units <= listing.units,
            "Marketplace: invalid units"
        );
        require(
            listing.seller != msg.sender,
            "Marketplace: cannot buy own listing"
        );

        uint256 totalCost = units * listing.pricePerUnit;
        uint256 fee = IFHEFeeManager(fheFeeManager).computeMarketplaceFeePlaintext(totalCost);
        uint256 proceeds = totalCost - fee;
        uint256 amount = units * (10 ** 18);

        listing.units -= units;
        if (listing.units == 0) {
            listing.active = false;
            _removeActiveListing(listing.token, listingId);
        }

        _collectPayment(msg.sender, totalCost);
        _sendPayment(feeRecipient, fee);
        _sendPayment(listing.seller, proceeds);

        IToken(listing.token).transferFrom(listing.seller, msg.sender, amount);

        emit ListingFilled(listingId, msg.sender, units, totalCost);
    }

    function cancelListing(uint256 listingId) external override nonReentrant {
        Listing storage listing = _listings[listingId];
        require(listing.active, "Marketplace: listing not active");
        require(listing.seller == msg.sender, "Marketplace: not your listing");

        listing.active = false;
        _removeActiveListing(listing.token, listingId);

        emit ListingCancelled(listingId, msg.sender);
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    function getListing(
        uint256 listingId
    ) external view override returns (Listing memory) {
        return _listings[listingId];
    }

    function getActiveListings(
        address token
    ) external view override returns (uint256[] memory) {
        return _activeListingsByToken[token];
    }

    function calculatePrimaryPurchaseCost(
        address token,
        uint256 units
    )
        external
        returns (uint256 totalCost, uint256 fee, uint256 netToTreasury)
    {
        totalCost = _calculateCost(token, units);
        fee = IFHEFeeManager(fheFeeManager).computeMarketplaceFeePlaintext(totalCost);
        netToTreasury = totalCost - fee;
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    function setFeeRecipient(address recipient) external onlyOwner {
        require(recipient != address(0), "Marketplace: zero address");
        feeRecipient = recipient;
    }

    function setFHEFeeManager(address fm) external onlyOwner {
        require(fm != address(0), "Marketplace: zero address");
        fheFeeManager = fm;
    }

    function setPaymentToken(address token) external onlyOwner {
        paymentToken = token;
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    function _calculateCost(
        address token,
        uint256 units
    ) internal view returns (uint256) {
        uint256 unitPrice = AssetToken(token).pricePerUnit();
        return units * unitPrice;
    }

    function _collectPayment(address from, uint256 amount) internal {
        if (paymentToken == address(0)) {
            require(msg.value >= amount, "Marketplace: insufficient ETH");
            if (msg.value > amount) {
                (bool ok, ) = payable(from).call{value: msg.value - amount}("");
                require(ok, "Marketplace: ETH refund failed");
            }
        } else {
            IERC20(paymentToken).safeTransferFrom(from, address(this), amount);
        }
    }

    function _sendPayment(address to, uint256 amount) internal {
        if (amount == 0) return;
        if (paymentToken == address(0)) {
            (bool ok, ) = payable(to).call{value: amount}("");
            require(ok, "Marketplace: ETH transfer failed");
        } else {
            IERC20(paymentToken).safeTransfer(to, amount);
        }
    }

    function _removeActiveListing(address token, uint256 listingId) internal {
        uint256[] storage ids = _activeListingsByToken[token];
        for (uint256 i = 0; i < ids.length; i++) {
            if (ids[i] == listingId) {
                ids[i] = ids[ids.length - 1];
                ids.pop();
                break;
            }
        }
    }

    receive() external payable {}
}
