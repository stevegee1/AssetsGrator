// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

import "@tokenysolutions/t-rex/contracts/token/Token.sol";
import "./interfaces/IAssetToken.sol";
import "./interfaces/IFHEPortfolioRegistry.sol";

/// @title AssetToken
/// @notice ERC-3643 compliant security token representing fractional ownership
///         of any real-world asset — property, land, renewable energy, infrastructure, etc.
contract AssetToken is Token, IAssetToken {
    // ─── State ────────────────────────────────────────────────────────────────

    AssetMetadata private _metadata;
    AssetStatus   private _status;
    address       public  portfolioRegistry;

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyOwnerOrAgent() {
        require(
            msg.sender == owner() || isAgent(msg.sender),
            "AssetToken: caller is not owner or agent"
        );
        _;
    }

    modifier onlyActive() {
        require(_status == AssetStatus.ACTIVE, "AssetToken: asset is not active");
        _;
    }

    // ─── Initializer ──────────────────────────────────────────────────────────

    function initializeAsset(
        address identityRegistry_,
        address compliance_,
        address portfolioRegistry_,
        AssetMetadata calldata metadata_
    ) external initializer {
        require(
            identityRegistry_ != address(0) && compliance_ != address(0),
            "AssetToken: zero address"
        );
        require(
            bytes(metadata_.name).length > 0 && bytes(metadata_.symbol).length > 0,
            "AssetToken: empty string"
        );

        __Ownable_init();

        _tokenName       = metadata_.name;
        _tokenSymbol     = metadata_.symbol;
        _tokenDecimals   = 18;
        _tokenOnchainID  = address(0);
        _tokenPaused     = true;

        setIdentityRegistry(identityRegistry_);
        setCompliance(compliance_);

        emit UpdatedTokenInformation(
            _tokenName,
            _tokenSymbol,
            _tokenDecimals,
            _TOKEN_VERSION,
            _tokenOnchainID
        );

        _metadata           = metadata_;
        _metadata.createdAt = block.timestamp;
        _status             = AssetStatus.PENDING;
        portfolioRegistry   = portfolioRegistry_;
    }

    // ─── IAssetToken Views ────────────────────────────────────────────────────

    function assetMetadata() external view override returns (AssetMetadata memory) {
        return _metadata;
    }

    function assetStatus() external view override returns (AssetStatus) {
        return _status;
    }

    function pricePerUnit() external view override returns (uint256) {
        return _metadata.pricePerUnit;
    }

    function valuationUSD() external view returns (uint256) {
        return _metadata.valuationUSD;
    }

    function availableUnits() external view override returns (uint256) {
        return balanceOf(owner());
    }

    function capacityKW() external view returns (uint256) {
        return _metadata.capacityKW;
    }

    function annualYieldMWh() external view returns (uint256) {
        return _metadata.annualYieldMWh;
    }

    function ipfsCID() external view returns (string memory) {
        return _metadata.ipfsCID;
    }

    function assetCategory() external view returns (AssetCategory) {
        return _metadata.category;
    }

    function assetSubType() external view returns (string memory) {
        return _metadata.assetSubType;
    }

    /// @notice Returns ownership percentage of an address (basis points, 100 = 1%)
    function ownershipBPS(address investor) external view returns (uint256) {
        uint256 supply = _totalSupply;
        if (supply == 0) return 0;
        return (balanceOf(investor) * 10_000) / supply;
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    function updateIPFSMetadata(string calldata newCID) external override onlyOwnerOrAgent {
        _metadata.ipfsCID = newCID;
        emit MetadataUpdated(newCID);
    }

    function updateValuation(
        uint256 newValuationUSD,
        uint256 newPricePerUnit
    ) external override onlyOwnerOrAgent {
        uint256 oldPrice = _metadata.pricePerUnit;
        _metadata.valuationUSD  = newValuationUSD;
        _metadata.pricePerUnit  = newPricePerUnit;
        emit ValuationUpdated(oldPrice, newPricePerUnit);
    }

    function setStatus(AssetStatus status) external override onlyOwnerOrAgent {
        AssetStatus old = _status;
        _status = status;
        emit StatusChanged(old, status);

        if (status == AssetStatus.PAUSED || status == AssetStatus.CLOSED) {
            if (!_tokenPaused) { _tokenPaused = true; emit Paused(msg.sender); }
        } else if (status == AssetStatus.ACTIVE) {
            if (_tokenPaused) { _tokenPaused = false; emit Unpaused(msg.sender); }
        }
    }

    // ─── Activate ─────────────────────────────────────────────────────────────

    function activate(address treasury) external onlyOwner {
        require(_status == AssetStatus.PENDING, "AssetToken: already activated");
        require(treasury != address(0), "AssetToken: zero treasury");

        _status = AssetStatus.ACTIVE;
        if (_tokenPaused) { _tokenPaused = false; emit Unpaused(msg.sender); }

        mint(treasury, _metadata.totalSupply * (10 ** 18));
        emit StatusChanged(AssetStatus.PENDING, AssetStatus.ACTIVE);
    }

    // ─── Shadow Sync Hooks ────────────────────────────────────────────────────

    /// @dev Internal hook to catch every transfer and update the FHE registry.
    function _transfer(address from, address to, uint256 amount) internal virtual override {
        super._transfer(from, to, amount);
        _sync(from);
        _sync(to);
    }

    /// @dev Internal hook to catch every mint and update the FHE registry.
    function _mint(address to, uint256 amount) internal virtual override {
        super._mint(to, amount);
        _sync(to);
    }

    /// @dev Internal hook to catch every burn and update the FHE registry.
    function _burn(address from, uint256 amount) internal virtual override {
        super._burn(from, amount);
        _sync(from);
    }

    function _sync(address investor) internal {
        if (portfolioRegistry != address(0) && investor != address(0)) {
            IFHEPortfolioRegistry(portfolioRegistry).syncBalance(investor, balanceOf(investor));
        }
    }
}
