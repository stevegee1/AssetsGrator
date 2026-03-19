// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

import "@tokenysolutions/t-rex/contracts/compliance/modular/modules/AbstractModule.sol";
import "@tokenysolutions/t-rex/contracts/compliance/modular/IModularCompliance.sol";
import "@tokenysolutions/t-rex/contracts/token/IToken.sol";
import "@tokenysolutions/t-rex/contracts/registry/interface/IIdentityRegistry.sol";

/// @title KYCComplianceModule
/// @notice Compliance module that enforces KYC/AML verification on every transfer.
///         The actual KYC happens off-chain (via providers like Sumsub/Onfido).
///         The on-chain proof is a signed claim stored in the investor's ONCHAINID.
///
/// Flow:
///   1. Investor completes KYC off-chain with your KYC provider
///   2. Provider signs a claim and stores it in investor's ONCHAINID contract
///   3. IdentityRegistry.isVerified() checks that claim on every transfer
///   4. This module enforces additional KYC-level rules on top
contract KYCComplianceModule is AbstractModule {
    // ─── Events ───────────────────────────────────────────────────────────────

    event InvestorWhitelisted(
        address indexed compliance,
        address indexed investor
    );
    event InvestorBlacklisted(
        address indexed compliance,
        address indexed investor
    );
    event MaxInvestorsSet(address indexed compliance, uint256 maxInvestors);

    // ─── Storage ──────────────────────────────────────────────────────────────

    /// @dev compliance => investor => manually blacklisted (overrides identity check)
    mapping(address => mapping(address => bool)) private _blacklisted;

    /// @dev compliance => max number of unique token holders allowed (0 = unlimited)
    mapping(address => uint256) private _maxInvestors;

    /// @dev compliance => current holder count
    mapping(address => uint256) private _holderCount;

    /// @dev compliance => investor => currently holds tokens
    mapping(address => mapping(address => bool)) private _isHolder;

    // ─── Configuration (called via compliance.callModuleFunction) ─────────────

    /// @notice Set the maximum number of unique investors allowed to hold this token
    /// @param max 0 = no limit
    function setMaxInvestors(uint256 max) external onlyComplianceCall {
        _maxInvestors[msg.sender] = max;
        emit MaxInvestorsSet(msg.sender, max);
    }

    /// @notice Blacklist an investor address (blocks transfers regardless of KYC status)
    function blacklistInvestor(address investor) external onlyComplianceCall {
        _blacklisted[msg.sender][investor] = true;
        emit InvestorBlacklisted(msg.sender, investor);
    }

    /// @notice Remove an investor from the blacklist
    function removeFromBlacklist(address investor) external onlyComplianceCall {
        _blacklisted[msg.sender][investor] = false;
        emit InvestorWhitelisted(msg.sender, investor);
    }

    // ─── IModule Implementation ───────────────────────────────────────────────

    /// @notice Called on every transfer attempt — returns false to block
    /// @dev The primary KYC check (ONCHAINID claim verification) is done by
    ///      IdentityRegistry.isVerified() inside Token.sol BEFORE this is called.
    ///      This module adds: blacklist check + max investor cap.
    function moduleCheck(
        address _from,
        address _to,
        uint256 /*_value*/,
        address _compliance
    ) external view override returns (bool) {
        // 1. Block blacklisted senders or receivers
        if (_blacklisted[_compliance][_from]) return false;
        if (_blacklisted[_compliance][_to]) return false;

        // 2. Enforce max investor cap for new holders
        uint256 max = _maxInvestors[_compliance];
        if (max > 0 && !_isHolder[_compliance][_to]) {
            // _to would become a new holder — check if we're at cap
            if (_holderCount[_compliance] >= max) return false;
        }

        return true;
    }

    /// @notice Called after a successful transfer — update holder tracking
    function moduleTransferAction(
        address _from,
        address _to,
        uint256 _value
    ) external override onlyComplianceCall {
        _updateHolderCount(msg.sender, _from, _to, _value);
    }

    /// @notice Called after a mint
    function moduleMintAction(
        address _to,
        uint256 _value
    ) external override onlyComplianceCall {
        _updateHolderCount(msg.sender, address(0), _to, _value);
    }

    /// @notice Called after a burn
    function moduleBurnAction(
        address _from,
        uint256 _value
    ) external override onlyComplianceCall {
        address compliance = msg.sender;
        address token = IModularCompliance(compliance).getTokenBound();

        // Check if _from has no more tokens after burn
        uint256 remaining = IERC20(token).balanceOf(_from);
        if (remaining == 0 && _isHolder[compliance][_from]) {
            _isHolder[compliance][_from] = false;
            if (_holderCount[compliance] > 0) {
                _holderCount[compliance]--;
            }
        }
    }

    function name() external pure override returns (string memory) {
        return "KYCComplianceModule";
    }

    /// @inheritdoc IModule
    function isPlugAndPlay() external pure override returns (bool) {
        return true;
    }

    /// @inheritdoc IModule
    function canComplianceBind(
        address /*_compliance*/
    ) external view override returns (bool) {
        return true;
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    function isBlacklisted(
        address compliance,
        address investor
    ) external view returns (bool) {
        return _blacklisted[compliance][investor];
    }

    function getMaxInvestors(
        address compliance
    ) external view returns (uint256) {
        return _maxInvestors[compliance];
    }

    function getHolderCount(
        address compliance
    ) external view returns (uint256) {
        return _holderCount[compliance];
    }

    function isHolder(
        address compliance,
        address investor
    ) external view returns (bool) {
        return _isHolder[compliance][investor];
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    function _updateHolderCount(
        address compliance,
        address _from,
        address _to,
        uint256 _value
    ) internal {
        address token = IModularCompliance(compliance).getTokenBound();

        // Track new holder
        if (_to != address(0) && !_isHolder[compliance][_to] && _value > 0) {
            _isHolder[compliance][_to] = true;
            _holderCount[compliance]++;
        }

        // Track lost holder — check if _from emptied their balance
        if (_from != address(0)) {
            uint256 remaining = IERC20(token).balanceOf(_from);
            if (remaining == 0 && _isHolder[compliance][_from]) {
                _isHolder[compliance][_from] = false;
                if (_holderCount[compliance] > 0) {
                    _holderCount[compliance]--;
                }
            }
        }
    }
}
