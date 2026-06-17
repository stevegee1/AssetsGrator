// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

import "@tokenysolutions/t-rex/contracts/compliance/modular/modules/AbstractModule.sol";
import "@tokenysolutions/t-rex/contracts/compliance/modular/IModularCompliance.sol";
import "@tokenysolutions/t-rex/contracts/token/IToken.sol";

/// @title TimeLocksModule
/// @notice Compliance module that enforces minimum holding periods on token transfers.
///         Critical for:
///         - PPA-backed energy assets (15-30 year contracts) with lock-up requirements
///         - Early investor lock-up (prevent immediate dump after issuance)
///         - Regulatory holding period requirements (FCA, SEC Rule 144)
///
/// Behaviour:
///   - Receiving tokens extends the lock forward (max of existing, now + duration).
///     This prevents circumvention by fragmenting: receive more tokens → lock resets.
///   - Transfers OUT are blocked until the lock expires.
///   - Transfers IN are always allowed.
///   - Fail-SAFE: if a lock duration is configured and no lock is recorded for a sender,
///     the transfer is blocked (not allowed). An unrecorded state indicates something
///     unexpected happened — refusing is safer than permitting.
///
/// @dev State keyed by compliance address — one module instance serves all tokens (Clones).
contract TimeLocksModule is AbstractModule {

    // ─── Constants ────────────────────────────────────────────────────────────

    /// @notice Maximum addresses per batch exemption call (gas DoS protection).
    uint256 public constant MAX_BATCH_SIZE = 50;

    // ─── Events ───────────────────────────────────────────────────────────────

    /// @notice Emitted when the lock duration changes.
    ///         oldDuration = 0 means it was first set; newDuration = 0 means lock removed.
    event LockPeriodSet(
        address indexed compliance,
        uint256         oldDuration,
        uint256         newDuration
    );

    /// @notice Emitted each time an investor's lock expiry is created or extended.
    event InvestorLockRecorded(
        address indexed compliance,
        address indexed investor,
        uint256         lockUntil
    );

    /// @notice Emitted when an admin resets an investor's lock to zero.
    event LockReset(
        address indexed compliance,
        address indexed investor,
        uint256         previousLockUntil
    );

    event LockExemptionSet(
        address indexed compliance,
        address indexed investor,
        bool            exempt
    );

    // ─── Storage ──────────────────────────────────────────────────────────────

    /// @dev compliance => lock duration in seconds
    mapping(address => uint256) private _lockDuration;

    /// @dev compliance => investor => timestamp when lock expires (0 = not recorded)
    mapping(address => mapping(address => uint256)) private _lockUntil;

    /// @dev compliance => investor => exempt from lock (e.g. treasury, marketplace)
    mapping(address => mapping(address => bool)) private _exempt;

    // ─── Configuration ────────────────────────────────────────────────────────

    /// @notice Set the lock-up duration for this token.
    ///         Setting to 0 disables the lock entirely.
    ///         Emits old and new values so off-chain systems can recalculate impact.
    /// @param duration Lock-up period in seconds (e.g. 31_536_000 = 1 year)
    function setLockDuration(uint256 duration) external onlyComplianceCall {
        uint256 old = _lockDuration[msg.sender];
        _lockDuration[msg.sender] = duration;
        emit LockPeriodSet(msg.sender, old, duration);
    }

    /// @notice Exempt a single address from the lock-up (e.g. treasury, DEX adapter).
    function setExemption(
        address investor,
        bool    exempt
    ) external onlyComplianceCall {
        _exempt[msg.sender][investor] = exempt;
        emit LockExemptionSet(msg.sender, investor, exempt);
    }

    /// @notice Batch-exempt multiple addresses.
    ///         Capped at MAX_BATCH_SIZE (50) to prevent block gas exhaustion.
    function setExemptions(
        address[] calldata investors,
        bool               exempt
    ) external onlyComplianceCall {
        require(
            investors.length <= MAX_BATCH_SIZE,
            "TimeLocksModule: batch too large (max 50)"
        );
        for (uint256 i = 0; i < investors.length; i++) {
            _exempt[msg.sender][investors[i]] = exempt;
            emit LockExemptionSet(msg.sender, investors[i], exempt);
        }
    }

    /// @notice Admin-reset an investor's lock to zero.
    ///         Use when a lock was set in error or compliance requires manual override.
    ///         After reset the investor has no lock — subsequent receives will re-apply
    ///         the current duration.
    function resetLock(address investor) external onlyComplianceCall {
        require(investor != address(0), "TimeLocksModule: zero address");
        uint256 prev = _lockUntil[msg.sender][investor];
        _lockUntil[msg.sender][investor] = 0;
        emit LockReset(msg.sender, investor, prev);
    }

    // ─── IModule Implementation ───────────────────────────────────────────────

    /// @notice Checked before every transfer. Blocks _from until their lock expires.
    ///
    ///   Fail-SAFE logic:
    ///     - If lock duration is 0 → no lock configured → allow
    ///     - If _from is exempt    → allow
    ///     - If _lockUntil == 0 AND lock duration > 0 → BLOCK (unrecorded = suspicious)
    ///     - Otherwise: allow only if block.timestamp >= lockUntil
    function moduleCheck(
        address _from,
        address /*_to*/,
        uint256 /*_value*/,
        address _compliance
    ) external view override returns (bool) {
        // Mints (from = 0) are never blocked
        if (_from == address(0)) return true;

        // Exempt addresses always pass
        if (_exempt[_compliance][_from]) return true;

        // No lock configured — allow
        if (_lockDuration[_compliance] == 0) return true;

        // FAIL-SAFE: lock is configured but not yet recorded for this sender.
        // This should not happen under normal operation (every receive sets the lock).
        // Refusing is safer than allowing — prevents any edge-case circumvention.
        if (_lockUntil[_compliance][_from] == 0) return false;

        // Allow only once the lock has expired
        return block.timestamp >= _lockUntil[_compliance][_from];
    }

    /// @notice Called after every successful transfer — extend lock for the receiver.
    function moduleTransferAction(
        address /*_from*/,
        address _to,
        uint256 /*_value*/
    ) external override onlyComplianceCall {
        _recordLock(msg.sender, _to);
    }

    /// @notice Called after a mint — set lock for the new holder.
    function moduleMintAction(
        address _to,
        uint256 /*_value*/
    ) external override onlyComplianceCall {
        _recordLock(msg.sender, _to);
    }

    function moduleBurnAction(
        address /*_from*/,
        uint256 /*_value*/
    ) external override onlyComplianceCall {
        // Burning does not affect lock state
    }

    function name() external pure override returns (string memory) {
        return "TimeLocksModule";
    }

    function isPlugAndPlay() external pure override returns (bool) {
        return true;
    }

    function canComplianceBind(address /*_compliance*/) external pure override returns (bool) {
        return true;
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    function getLockDuration(address compliance) external view returns (uint256) {
        return _lockDuration[compliance];
    }

    function getLockUntil(
        address compliance,
        address investor
    ) external view returns (uint256) {
        return _lockUntil[compliance][investor];
    }

    /// @notice True if the investor's lock is active (consistent with moduleCheck fail-safe).
    function isLocked(
        address compliance,
        address investor
    ) external view returns (bool) {
        if (_exempt[compliance][investor]) return false;
        if (_lockDuration[compliance] == 0) return false;
        if (_lockUntil[compliance][investor] == 0) return true; // fail-safe: unrecorded = locked
        return block.timestamp < _lockUntil[compliance][investor];
    }

    function isExempt(
        address compliance,
        address investor
    ) external view returns (bool) {
        return _exempt[compliance][investor];
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    /// @dev Set or EXTEND an investor's lock (Option B — extend only forward).
    ///      Never shortens: if an existing lock expires later than now + duration, keep it.
    ///      This prevents the attack: receive tiny amount near expiry → lock shortened.
    function _recordLock(address compliance, address investor) internal {
        if (investor == address(0)) return;
        if (_exempt[compliance][investor]) return;

        uint256 duration = _lockDuration[compliance];
        if (duration == 0) return;

        uint256 newExpiry      = block.timestamp + duration;
        uint256 existingExpiry = _lockUntil[compliance][investor];

        // Only update if it moves the expiry forward
        if (newExpiry > existingExpiry) {
            _lockUntil[compliance][investor] = newExpiry;
            emit InvestorLockRecorded(compliance, investor, newExpiry);
        }
    }
}
