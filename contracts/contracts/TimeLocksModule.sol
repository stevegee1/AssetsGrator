// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

import "@tokenysolutions/t-rex/contracts/compliance/modular/modules/AbstractModule.sol";
import "@tokenysolutions/t-rex/contracts/compliance/modular/IModularCompliance.sol";
import "@tokenysolutions/t-rex/contracts/token/IToken.sol";

/// @title TimeLocksModule
/// @notice Compliance module that enforces minimum holding periods on token transfers.
///         Critical for:
///         - PPA-backed energy assets (15-30 year contracts) with lock-up requirements
///         - Early investor lock-ups (prevent immediate dump after issuance)
///         - Regulatory holding period requirements
///
/// Lock-up is tracked per-investor from the time they first receive tokens.
/// Transfers OUT are blocked until the lock-up expires.
/// Transfers IN are always allowed (receiving tokens is not restricted).
contract TimeLocksModule is AbstractModule {

    // ─── Events ───────────────────────────────────────────────────────────────

    event LockPeriodSet(address indexed compliance, uint256 lockDuration);
    event InvestorLockRecorded(
        address indexed compliance,
        address indexed investor,
        uint256 lockUntil
    );
    event LockExemptionSet(
        address indexed compliance,
        address indexed investor,
        bool exempt
    );

    // ─── Storage ──────────────────────────────────────────────────────────────

    /// @dev compliance => lock duration in seconds
    mapping(address => uint256) private _lockDuration;

    /// @dev compliance => investor => timestamp when lock expires
    mapping(address => mapping(address => uint256)) private _lockUntil;

    /// @dev compliance => investor => exempt from lock (e.g. treasury, protocol contracts)
    mapping(address => mapping(address => bool)) private _exempt;

    // ─── Configuration (called via compliance.callModuleFunction) ─────────────

    /// @notice Set the lock-up duration for this token
    /// @param duration Lock-up period in seconds (e.g. 31536000 = 1 year)
    function setLockDuration(uint256 duration) external onlyComplianceCall {
        _lockDuration[msg.sender] = duration;
        emit LockPeriodSet(msg.sender, duration);
    }

    /// @notice Exempt an address from lock-up (e.g. treasury, marketplace)
    function setExemption(
        address investor,
        bool exempt
    ) external onlyComplianceCall {
        _exempt[msg.sender][investor] = exempt;
        emit LockExemptionSet(msg.sender, investor, exempt);
    }

    /// @notice Batch exempt multiple addresses
    function setExemptions(
        address[] calldata investors,
        bool exempt
    ) external onlyComplianceCall {
        for (uint256 i = 0; i < investors.length; i++) {
            _exempt[msg.sender][investors[i]] = exempt;
            emit LockExemptionSet(msg.sender, investors[i], exempt);
        }
    }

    // ─── IModule Implementation ───────────────────────────────────────────────

    /// @notice Check if sender's lock period has expired
    function moduleCheck(
        address _from,
        address /*_to*/,
        uint256 /*_value*/,
        address _compliance
    ) external view override returns (bool) {
        // Skip check for mints (from = 0) and exempt addresses
        if (_from == address(0)) return true;
        if (_exempt[_compliance][_from]) return true;

        // If no lock is set, allow
        if (_lockDuration[_compliance] == 0) return true;

        // If lock hasn't been recorded yet (shouldn't happen), allow
        if (_lockUntil[_compliance][_from] == 0) return true;

        // Block if lock hasn't expired
        return block.timestamp >= _lockUntil[_compliance][_from];
    }

    /// @notice Record lock timestamp when tokens are received
    function moduleTransferAction(
        address /*_from*/,
        address _to,
        uint256 /*_value*/
    ) external override onlyComplianceCall {
        _recordLock(msg.sender, _to);
    }

    /// @notice Record lock timestamp when tokens are minted
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
        // No action needed on burn
    }

    function name() external pure override returns (string memory) {
        return "TimeLocksModule";
    }

    function isPlugAndPlay() external pure override returns (bool) {
        return true;
    }

    function canComplianceBind(
        address /*_compliance*/
    ) external view override returns (bool) {
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

    function isLocked(
        address compliance,
        address investor
    ) external view returns (bool) {
        if (_exempt[compliance][investor]) return false;
        if (_lockUntil[compliance][investor] == 0) return false;
        return block.timestamp < _lockUntil[compliance][investor];
    }

    function isExempt(
        address compliance,
        address investor
    ) external view returns (bool) {
        return _exempt[compliance][investor];
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    /// @dev Record lock-up start for an investor (only if they don't already have one)
    function _recordLock(address compliance, address investor) internal {
        if (investor == address(0)) return;
        if (_exempt[compliance][investor]) return;
        if (_lockDuration[compliance] == 0) return;

        // Only set lock if not already set (first-receive lock)
        if (_lockUntil[compliance][investor] == 0) {
            uint256 lockExpiry = block.timestamp + _lockDuration[compliance];
            _lockUntil[compliance][investor] = lockExpiry;
            emit InvestorLockRecorded(compliance, investor, lockExpiry);
        }
    }
}
