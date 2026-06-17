// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/// @title RECToken (Renewable Energy Certificates)
/// @notice ERC-1155 multi-token representing verified renewable energy generation.
///         Each token ID = a generation period (YYYYMMDD). Each unit = 1 MWh verified.
///
/// Why ERC-1155, not ERC-3643:
///   RECs are commodity compliance instruments (UK REGO, US REC markets), NOT securities.
///   ERC-3643 is for FCA/SEC-regulated investment securities that require investor KYC.
///   RECs need: multiple simultaneous IDs (one per period), fungibility within a period,
///   and a retirement mechanism — all of which ERC-1155 handles natively.
///   Transfer restrictions here are market-participant approval, not investor KYC.
contract RECToken is ERC1155, AccessControl, ReentrancyGuard, Pausable {

    // ─── Roles ────────────────────────────────────────────────────────────────

    bytes32 public constant REC_ISSUER_ROLE      = keccak256("REC_ISSUER_ROLE");
    bytes32 public constant TRANSFER_MANAGER_ROLE = keccak256("TRANSFER_MANAGER_ROLE");

    // ─── Constants ────────────────────────────────────────────────────────────

    /// @notice Period IDs must be YYYYMMDD between year 2000 and 2099 (Issue 3).
    uint256 public constant MIN_PERIOD_ID  = 20_000_101;
    uint256 public constant MAX_PERIOD_ID  = 20_991_231;

    /// @notice Batch size cap to prevent block gas exhaustion (Issue 7).
    uint256 public constant MAX_BATCH_SIZE = 50;

    // ─── State ────────────────────────────────────────────────────────────────

    struct RECMetadata {
        string  assetName;         // e.g. "Greenfield Solar Farm"
        address assetToken;        // linked AssetToken — only field updatable post-deploy
        string  sourceType;        // "solar", "wind", "hydro", "geothermal"
        string  gridRegion;        // e.g. "UK-REGO", "US-PJM"
        string  certificationBody; // e.g. "Ofgem", "ERCOT"
    }

    RECMetadata public recMetadata;

    /// @dev period ID => MWh generated for that period
    mapping(uint256 => uint256) public periodGeneration;

    /// @dev period ID => has been finalised (no more minting)
    mapping(uint256 => bool) public periodFinalised;

    /// @dev Total MWh retired across all periods
    uint256 public totalRetiredMWh;

    /// @dev account => period ID => MWh retired
    mapping(address => mapping(uint256 => uint256)) public retiredByPeriod;

    /// @dev account => total MWh retired
    mapping(address => uint256) public totalRetiredByAccount;

    /// @dev Approved market participants allowed to send/receive RECs (Issue — Transfer Restrictions).
    ///      Mints bypass this check (issuer explicitly selects recipient).
    ///      Burns (retirements) bypass this check (always allowed).
    ///      Secondary transfers require BOTH parties to be approved.
    mapping(address => bool) public approvedParticipant;

    // ─── Events ───────────────────────────────────────────────────────────────

    event RECsMinted(uint256 indexed periodId, address indexed to, uint256 mwh);

    /// @notice Summary event for batch mints — easier subgraph indexing (Issue 8).
    event RECsBatchMinted(address indexed to, uint256[] periodIds, uint256[] mwhAmounts);

    event PeriodFinalised(uint256 indexed periodId, uint256 totalMWh);
    event RECsRetired(
        address indexed account,
        uint256 indexed periodId,
        uint256         mwh,
        string          reason
    );
    event ParticipantApproved(address indexed participant, bool approved);
    event AssetTokenUpdated(address indexed oldToken, address indexed newToken);

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(
        string memory uri_,
        string memory assetName_,
        address assetToken_,
        string memory sourceType_,
        string memory gridRegion_,
        string memory certificationBody_,
        address admin_
    ) ERC1155(uri_) {
        require(admin_ != address(0), "REC: zero admin");

        recMetadata = RECMetadata({
            assetName:         assetName_,
            assetToken:        assetToken_,
            sourceType:        sourceType_,
            gridRegion:        gridRegion_,
            certificationBody: certificationBody_
        });

        _grantRole(DEFAULT_ADMIN_ROLE,    admin_);
        _grantRole(REC_ISSUER_ROLE,       admin_);
        _grantRole(TRANSFER_MANAGER_ROLE, admin_);

        // Admin is an approved participant by default
        approvedParticipant[admin_] = true;
    }

    // ─── Mint ─────────────────────────────────────────────────────────────────

    /// @notice Mint RECs for a single verified generation period.
    ///         nonReentrant guards against malicious onERC1155Received callbacks (Issue 1).
    function mint(
        address to,
        uint256 periodId,
        uint256 mwh
    ) external onlyRole(REC_ISSUER_ROLE) nonReentrant whenNotPaused {
        require(to  != address(0), "REC: zero recipient");
        require(mwh  > 0,          "REC: zero mwh");
        _validatePeriodId(periodId);
        require(!periodFinalised[periodId], "REC: period finalised");

        periodGeneration[periodId] += mwh;
        _mint(to, periodId, mwh, "");

        emit RECsMinted(periodId, to, mwh);
    }

    /// @notice Batch mint RECs across multiple periods.
    ///         Capped at MAX_BATCH_SIZE to prevent block gas exhaustion (Issue 7).
    function mintBatch(
        address            to,
        uint256[] calldata periodIds,
        uint256[] calldata mwhAmounts
    ) external onlyRole(REC_ISSUER_ROLE) nonReentrant whenNotPaused {
        require(to != address(0),                            "REC: zero recipient");
        require(periodIds.length == mwhAmounts.length,       "REC: length mismatch");
        require(periodIds.length <= MAX_BATCH_SIZE,          "REC: batch too large");
        require(periodIds.length  > 0,                       "REC: empty batch");

        for (uint256 i = 0; i < periodIds.length; i++) {
            require(mwhAmounts[i] > 0, "REC: zero mwh in batch");
            _validatePeriodId(periodIds[i]);
            require(!periodFinalised[periodIds[i]], "REC: period finalised");
            periodGeneration[periodIds[i]] += mwhAmounts[i];
        }

        _mintBatch(to, periodIds, mwhAmounts, "");

        // Summary event for subgraph indexing (Issue 8)
        emit RECsBatchMinted(to, periodIds, mwhAmounts);

        // Per-period events for individual period listeners
        for (uint256 i = 0; i < periodIds.length; i++) {
            emit RECsMinted(periodIds[i], to, mwhAmounts[i]);
        }
    }

    /// @notice Finalise a period — no more RECs can be minted for it.
    ///         Requires at least 1 MWh minted (prevents finalising empty periods).
    function finalisePeriod(uint256 periodId) external onlyRole(REC_ISSUER_ROLE) {
        _validatePeriodId(periodId);
        require(!periodFinalised[periodId],       "REC: already finalised");
        require(periodGeneration[periodId] > 0,   "REC: nothing minted for period");

        periodFinalised[periodId] = true;
        emit PeriodFinalised(periodId, periodGeneration[periodId]);
    }

    // ─── Retire ───────────────────────────────────────────────────────────────

    /// @notice Permanently retire RECs for compliance.
    ///         Period must be finalised — you cannot retire unverified generation (Issue 4).
    function retire(
        uint256        periodId,
        uint256        mwh,
        string calldata reason
    ) external nonReentrant whenNotPaused {
        require(mwh > 0, "REC: zero mwh");
        _validatePeriodId(periodId);
        require(periodFinalised[periodId],                "REC: period not finalised");
        require(balanceOf(msg.sender, periodId) >= mwh,  "REC: insufficient balance");

        _burn(msg.sender, periodId, mwh);

        totalRetiredMWh                          += mwh;
        retiredByPeriod[msg.sender][periodId]    += mwh;
        totalRetiredByAccount[msg.sender]        += mwh;

        emit RECsRetired(msg.sender, periodId, mwh, reason);
    }

    // ─── Transfer Restrictions ────────────────────────────────────────────────

    /// @notice Approve or revoke a market participant's ability to send/receive RECs.
    function approveParticipant(
        address participant,
        bool    approved
    ) external onlyRole(TRANSFER_MANAGER_ROLE) {
        require(participant != address(0), "REC: zero address");
        approvedParticipant[participant] = approved;
        emit ParticipantApproved(participant, approved);
    }

    /// @notice Batch-approve market participants. Capped at MAX_BATCH_SIZE.
    function approveParticipants(
        address[] calldata participants,
        bool               approved
    ) external onlyRole(TRANSFER_MANAGER_ROLE) {
        require(participants.length <= MAX_BATCH_SIZE, "REC: batch too large");
        for (uint256 i = 0; i < participants.length; i++) {
            require(participants[i] != address(0), "REC: zero address in batch");
            approvedParticipant[participants[i]] = approved;
            emit ParticipantApproved(participants[i], approved);
        }
    }

    // ─── Pause ────────────────────────────────────────────────────────────────

    /// @notice Pause all mints, transfers, and retirements (Issue 6).
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    // ─── Metadata Admin ───────────────────────────────────────────────────────

    /// @notice Update the linked AssetToken address only (Issue 5).
    ///         assetName, sourceType, gridRegion, certificationBody are immutable
    ///         business facts set at deployment — only the contract link may change.
    function updateAssetToken(address newToken) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newToken != address(0), "REC: zero token");
        address old = recMetadata.assetToken;
        recMetadata.assetToken = newToken;
        emit AssetTokenUpdated(old, newToken);
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    function getPeriodGeneration(uint256 periodId) external view returns (uint256) {
        return periodGeneration[periodId];
    }

    function isPeriodFinalised(uint256 periodId) external view returns (bool) {
        return periodFinalised[periodId];
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    /// @dev Validate that a period ID is in YYYYMMDD format within year 2000-2099 (Issue 3).
    function _validatePeriodId(uint256 periodId) internal pure {
        require(
            periodId >= MIN_PERIOD_ID && periodId <= MAX_PERIOD_ID,
            "REC: invalid period ID, use YYYYMMDD format (2000-2099)"
        );
    }

    /// @dev Enforce pause + transfer restrictions on every token movement.
    ///      Mints (from=0): issuer explicitly chose recipient — no whitelist check.
    ///      Burns (to=0):   retirements are always allowed.
    ///      Transfers:      both parties must be approved market participants.
    function _beforeTokenTransfer(
        address          operator,
        address          from,
        address          to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory     data
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);

        bool isMint = (from == address(0));
        bool isBurn = (to   == address(0));

        if (!isMint && !isBurn) {
            require(
                approvedParticipant[from] && approvedParticipant[to],
                "REC: transfer requires approved participants"
            );
        }
    }

    // ─── Required Overrides ───────────────────────────────────────────────────

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
