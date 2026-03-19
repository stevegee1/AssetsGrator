// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

interface IAssetMarketplace {
    struct Listing {
        address seller;
        address token;
        uint256 units;
        uint256 pricePerUnit;
        bool    active;
        uint256 listedAt;
    }

    event UnitsPurchasedFromIssuance(
        address indexed buyer,
        address indexed token,
        uint256 units,
        uint256 totalCost
    );

    event ListingCreated(
        uint256 indexed listingId,
        address indexed seller,
        address indexed token,
        uint256 units,
        uint256 pricePerUnit
    );

    event ListingFilled(
        uint256 indexed listingId,
        address indexed buyer,
        uint256 units,
        uint256 totalCost
    );

    event ListingCancelled(
        uint256 indexed listingId,
        address indexed seller
    );

    function buyFromIssuance(address token, uint256 units) external payable;
    function createListing(address token, uint256 units, uint256 pricePerUnit_) external returns (uint256 listingId);
    function fillListing(uint256 listingId, uint256 units) external payable;
    function cancelListing(uint256 listingId) external;
    function getListing(uint256 listingId) external view returns (Listing memory);
    function getActiveListings(address token) external view returns (uint256[] memory);
}
