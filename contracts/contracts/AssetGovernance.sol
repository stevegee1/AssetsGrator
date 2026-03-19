// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./AssetToken.sol";
import "./AssetFactory.sol";

/// @title AssetGovernance
/// @notice Token-weighted governance for all tokenised assets on the platform.
///
///   Flow:
///     1. Any holder with >= proposalThresholdBps ownership creates a proposal
///     2. Voting period opens (votingPeriod blocks, default ~7 days)
///     3. Token holders vote FOR or AGAINST, weighted by balance at snapshot
///     4. If quorum (30%) is reached and majority votes FOR → proposal passes
///     5. Time-lock delay before execution (executionDelay, default 48h)
///     6. Anyone can trigger execution after time-lock expires
///
///   Proposal types — the contract is generic; the target + calldata
///   determine what gets executed. Examples:
///     - AssetToken.updateValuation(...)    — property revaluation
///     - AssetToken.setStatus(PAUSED)       — emergency pause
///     - AssetTreasury.setPlatformWallet()   — change fee recipient
///     - EnergyRevenueDistributor.setPlatformFeeBps() — change energy fees
contract AssetGovernance is Ownable, ReentrancyGuard {

    // ─── Types ────────────────────────────────────────────────────────────────

    enum ProposalStatus {
        PENDING,    // created, voting not yet started (snapshot delay)
        ACTIVE,     // voting is open
        PASSED,     // quorum met, majority FOR
        REJECTED,   // quorum not met or majority AGAINST
        EXECUTED,   // successfully executed
        EXPIRED,    // passed but not executed within grace period
        CANCELLED   // cancelled by proposer
    }

    struct Proposal {
        uint256 id;
        address proposer;
        address assetToken;         // which asset this proposal governs
        address targetContract;     // contract to call if approved
        bytes   callData;           // encoded function call
        string  descriptionCID;     // IPFS CID for proposal details
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 snapshotBlock;      // block at which balances are frozen for voting
        uint256 startBlock;         // voting opens
        uint256 endBlock;           // voting closes
        uint256 executionTime;      // earliest execution timestamp (after time-lock)
        uint256 gracePeriodEnd;     // latest execution timestamp
        ProposalStatus status;
    }

    // ─── State ────────────────────────────────────────────────────────────────

    AssetFactory public factory;

    uint256 private _nextProposalId;
    mapping(uint256 => Proposal) public proposals;

    /// @dev proposal ID => voter => has voted
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    /// @dev proposal ID => voter => vote weight (for transparency)
    mapping(uint256 => mapping(address => uint256)) public voteWeight;

    /// @dev asset token => active proposal ID (0 = none)
    mapping(address => uint256) public activeProposal;

    // ─── Config ───────────────────────────────────────────────────────────────

    /// @notice Minimum ownership in basis points to create a proposal (100 = 1%)
    uint256 public proposalThresholdBps;

    /// @notice Quorum: minimum % of circulating supply that must vote (in bps, 3000 = 30%)
    uint256 public quorumBps;

    /// @notice Voting period in blocks (~7 days at 2s/block on Polygon ≈ 302,400)
    uint256 public votingPeriod;

    /// @notice Time-lock delay after vote passes before execution (seconds)
    uint256 public executionDelay;

    /// @notice Grace period after time-lock for execution (seconds, default 7 days)
    uint256 public gracePeriod;

    // ─── Events ───────────────────────────────────────────────────────────────

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        address indexed assetToken,
        address targetContract,
        string descriptionCID
    );

    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 weight
    );

    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCancelled(uint256 indexed proposalId);
    event ProposalExpired(uint256 indexed proposalId);

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(
        address factory_,
        uint256 proposalThresholdBps_,
        uint256 quorumBps_,
        uint256 votingPeriod_,
        uint256 executionDelay_,
        uint256 gracePeriod_
    ) {
        require(factory_ != address(0), "Governance: zero factory");
        require(proposalThresholdBps_ <= 1_000, "Governance: threshold too high"); // max 10%
        require(quorumBps_ <= 10_000, "Governance: quorum too high");
        require(votingPeriod_ > 0, "Governance: zero voting period");

        factory = AssetFactory(factory_);
        proposalThresholdBps = proposalThresholdBps_;
        quorumBps = quorumBps_;
        votingPeriod = votingPeriod_;
        executionDelay = executionDelay_;
        gracePeriod = gracePeriod_;
    }

    // ─── Create proposal ──────────────────────────────────────────────────────

    /// @notice Create a governance proposal for a specific asset
    /// @param assetToken       The asset this proposal governs
    /// @param targetContract   Contract to call if proposal passes
    /// @param callData         Encoded function call to execute
    /// @param descriptionCID   IPFS CID with proposal details
    function createProposal(
        address assetToken,
        address targetContract,
        bytes calldata callData,
        string calldata descriptionCID
    ) external nonReentrant returns (uint256 proposalId) {
        require(
            factory.isRegisteredAsset(assetToken),
            "Governance: unknown asset"
        );
        require(targetContract != address(0), "Governance: zero target");
        require(bytes(descriptionCID).length > 0, "Governance: empty description");

        // Check proposer meets threshold
        AssetToken at = AssetToken(assetToken);
        uint256 ownershipBps = at.ownershipBPS(msg.sender);
        require(
            ownershipBps >= proposalThresholdBps,
            "Governance: below proposal threshold"
        );

        // Only one active proposal per asset
        require(
            activeProposal[assetToken] == 0,
            "Governance: asset has active proposal"
        );

        proposalId = ++_nextProposalId; // start from 1

        uint256 startBlock_ = block.number + 1; // voting starts next block
        uint256 endBlock_ = startBlock_ + votingPeriod;

        proposals[proposalId] = Proposal({
            id: proposalId,
            proposer: msg.sender,
            assetToken: assetToken,
            targetContract: targetContract,
            callData: callData,
            descriptionCID: descriptionCID,
            votesFor: 0,
            votesAgainst: 0,
            snapshotBlock: block.number,
            startBlock: startBlock_,
            endBlock: endBlock_,
            executionTime: 0,
            gracePeriodEnd: 0,
            status: ProposalStatus.ACTIVE
        });

        activeProposal[assetToken] = proposalId;

        emit ProposalCreated(
            proposalId,
            msg.sender,
            assetToken,
            targetContract,
            descriptionCID
        );
    }

    // ─── Vote ─────────────────────────────────────────────────────────────────

    /// @notice Cast a vote on an active proposal
    /// @param proposalId  ID of the proposal
    /// @param support     true = FOR, false = AGAINST
    function vote(uint256 proposalId, bool support) external nonReentrant {
        Proposal storage p = proposals[proposalId];
        require(p.status == ProposalStatus.ACTIVE, "Governance: not active");
        require(block.number >= p.startBlock, "Governance: voting not started");
        require(block.number <= p.endBlock, "Governance: voting ended");
        require(!hasVoted[proposalId][msg.sender], "Governance: already voted");

        // Weight = balance at snapshot block
        // NOTE: For full snapshot support, the token would need ERC20Snapshot.
        // For now we use current balance as a simpler approach.
        uint256 weight = IERC20(p.assetToken).balanceOf(msg.sender);
        require(weight > 0, "Governance: no voting power");

        hasVoted[proposalId][msg.sender] = true;
        voteWeight[proposalId][msg.sender] = weight;

        if (support) {
            p.votesFor += weight;
        } else {
            p.votesAgainst += weight;
        }

        emit VoteCast(proposalId, msg.sender, support, weight);
    }

    // ─── Finalize ─────────────────────────────────────────────────────────────

    /// @notice Finalize a proposal after voting period ends
    function finalizeProposal(uint256 proposalId) external {
        Proposal storage p = proposals[proposalId];
        require(p.status == ProposalStatus.ACTIVE, "Governance: not active");
        require(block.number > p.endBlock, "Governance: voting still open");

        uint256 totalVotes = p.votesFor + p.votesAgainst;
        uint256 supply = IERC20(p.assetToken).totalSupply();
        uint256 quorumRequired = (supply * quorumBps) / 10_000;

        if (totalVotes >= quorumRequired && p.votesFor > p.votesAgainst) {
            p.status = ProposalStatus.PASSED;
            p.executionTime = block.timestamp + executionDelay;
            p.gracePeriodEnd = p.executionTime + gracePeriod;
        } else {
            p.status = ProposalStatus.REJECTED;
            activeProposal[p.assetToken] = 0;
        }
    }

    // ─── Execute ──────────────────────────────────────────────────────────────

    /// @notice Execute a passed proposal after time-lock
    function executeProposal(uint256 proposalId) external nonReentrant {
        Proposal storage p = proposals[proposalId];
        require(p.status == ProposalStatus.PASSED, "Governance: not passed");
        require(
            block.timestamp >= p.executionTime,
            "Governance: time-lock active"
        );

        if (block.timestamp > p.gracePeriodEnd) {
            p.status = ProposalStatus.EXPIRED;
            activeProposal[p.assetToken] = 0;
            emit ProposalExpired(proposalId);
            return;
        }

        p.status = ProposalStatus.EXECUTED;
        activeProposal[p.assetToken] = 0;

        // Execute the proposal's call
        (bool success, ) = p.targetContract.call(p.callData);
        require(success, "Governance: execution failed");

        emit ProposalExecuted(proposalId);
    }

    // ─── Cancel ───────────────────────────────────────────────────────────────

    /// @notice Cancel a proposal (only proposer or platform owner)
    function cancelProposal(uint256 proposalId) external {
        Proposal storage p = proposals[proposalId];
        require(
            p.status == ProposalStatus.ACTIVE || p.status == ProposalStatus.PASSED,
            "Governance: cannot cancel"
        );
        require(
            msg.sender == p.proposer || msg.sender == owner(),
            "Governance: not authorized"
        );

        p.status = ProposalStatus.CANCELLED;
        activeProposal[p.assetToken] = 0;

        emit ProposalCancelled(proposalId);
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    function getProposal(uint256 proposalId) external view returns (Proposal memory) {
        return proposals[proposalId];
    }

    function getActiveProposalForAsset(address assetToken) external view returns (uint256) {
        return activeProposal[assetToken];
    }

    function getProposalStatus(uint256 proposalId) external view returns (ProposalStatus) {
        return proposals[proposalId].status;
    }

    function getVoteResults(uint256 proposalId) external view returns (
        uint256 votesFor,
        uint256 votesAgainst,
        uint256 totalVotes,
        bool quorumReached
    ) {
        Proposal storage p = proposals[proposalId];
        votesFor = p.votesFor;
        votesAgainst = p.votesAgainst;
        totalVotes = votesFor + votesAgainst;

        uint256 supply = IERC20(p.assetToken).totalSupply();
        uint256 quorumRequired = (supply * quorumBps) / 10_000;
        quorumReached = totalVotes >= quorumRequired;
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    function setProposalThresholdBps(uint256 bps) external onlyOwner {
        require(bps <= 1_000, "Governance: threshold too high");
        proposalThresholdBps = bps;
    }

    function setQuorumBps(uint256 bps) external onlyOwner {
        require(bps <= 10_000, "Governance: quorum too high");
        quorumBps = bps;
    }

    function setVotingPeriod(uint256 blocks) external onlyOwner {
        require(blocks > 0, "Governance: zero period");
        votingPeriod = blocks;
    }

    function setExecutionDelay(uint256 seconds_) external onlyOwner {
        executionDelay = seconds_;
    }

    function setGracePeriod(uint256 seconds_) external onlyOwner {
        gracePeriod = seconds_;
    }
}
