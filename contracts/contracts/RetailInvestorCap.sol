// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

import "@tokenysolutions/t-rex/contracts/compliance/modular/modules/AbstractModule.sol";
import "@tokenysolutions/t-rex/contracts/compliance/modular/IModularCompliance.sol";
import "@tokenysolutions/t-rex/contracts/token/IToken.sol";
import "@tokenysolutions/t-rex/contracts/registry/interface/IIdentityRegistry.sol";

/// @title RetailInvestorCap
/// @notice Compliance module enforcing the FCA Article 1(4)(b) private placement
///         exemption — the "150-person rule".
///
/// Under UK Prospectus Regulation Article 1(4)(b), an offer of securities does
/// NOT require an FCA-approved prospectus if addressed to fewer than 150 natural
/// or legal persons per jurisdiction (excluding qualified investors).
///
/// Architecture:
///   1. Identity enforcement (KYC) is upstream — T-REX Token._transfer() calls
///      identityRegistry.isVerified() before any moduleCheck runs. Not our concern.
///   2. Investor type (retail vs. qualified) is managed here via setQualifiedInvestor().
///      Qualified status is keyed at ONCHAINID level — one call covers all wallets.
///   3. Person counting is keyed on ONCHAINID (legal identity), NOT wallet address.
///      One investor with N wallets counts as 1 person toward the 150 cap.
///   4. _isKnownWallet is NEVER reset after a wallet is seen. This avoids repeated
///      identity lookups and event noise when an investor exits and re-enters.
///   5. Exit cleanup requires an admin call to removeRetailIdentity() since on-chain
///      wallet enumeration per ONCHAINID is not possible in O(1).
///   6. syncHolder(s) intentionally bypasses the cap check — they are for correcting
///      counts on existing holders when the module is bound late.
///
/// @dev State keyed by compliance address — one module instance serves all tokens (Clones).
contract RetailInvestorCap is AbstractModule {

    // ─── Constants ────────────────────────────────────────────────────────────

    /// @notice Default retail cap — 149 leaves a 1-investor safety buffer.
    uint256 public constant DEFAULT_RETAIL_CAP = 149;

    /// @notice Maximum addresses per batch call (gas DoS protection).
    uint256 public constant MAX_BATCH_SIZE = 50;

    // ─── Events ───────────────────────────────────────────────────────────────

    /// @notice investor = wallet, identity = ONCHAINID contract address.
    event QualifiedInvestorSet(
        address indexed compliance,
        address indexed investor,
        address indexed identity,
        bool            qualified
    );
    event RetailCapSet(address indexed compliance, uint256 cap);

    /// @notice identity = ONCHAINID (legal person), wallet = the specific wallet that triggered counting.
    event RetailInvestorAdded(
        address indexed compliance,
        address indexed identity,
        address indexed wallet,
        uint256         newCount
    );
    event RetailInvestorRemoved(
        address indexed compliance,
        address indexed identity,
        uint256         newCount
    );
    event CapStatusChanged(address indexed compliance, bool enabled);

    // ─── Storage (per compliance contract) ───────────────────────────────────

    /// @dev compliance => wallet => qualified at wallet level (fast-path check)
    mapping(address => mapping(address => bool)) private _isQualifiedWallet;

    /// @dev compliance => ONCHAINID => qualified at identity level (covers all wallets)
    ///      Set alongside wallet-level in setQualifiedInvestor() when identity resolves.
    mapping(address => mapping(address => bool)) private _isQualifiedIdentity;

    /// @dev compliance => wallet => has ever been processed by this module.
    ///      NEVER reset after being set — prevents repeated identity lookups and
    ///      event noise when an investor exits and re-enters (Issue 4).
    ///      A wallet that is "known" but has zero balance is still correctly excluded
    ///      from moduleCheck's new-wallet cap enforcement path.
    mapping(address => mapping(address => bool)) private _isKnownWallet;

    /// @dev compliance => ONCHAINID => counted as a unique retail legal person.
    mapping(address => mapping(address => bool)) private _isRetailIdentity;

    /// @dev compliance => count of unique retail legal persons (ONDCHAINIDs).
    mapping(address => uint256) private _retailCount;

    /// @dev compliance => configured retail cap (0 = use DEFAULT_RETAIL_CAP).
    mapping(address => uint256) private _retailCap;

    /// @dev compliance => cap disabled flag (true = no restriction, e.g. post-FCA approval).
    mapping(address => bool) private _capDisabled;

    // ─── Configuration ────────────────────────────────────────────────────────

    /// @notice Mark or unmark an investor as qualified (bypasses the 150 cap).
    ///         Qualified status is set at ONCHAINID (legal identity) level, covering
    ///         ALL wallets of that investor automatically.
    ///         Also sets the wallet-level flag for a fast-path check in moduleCheck.
    /// @param investor  Any wallet address of the investor
    /// @param qualified true = qualified (no cap), false = retail (counted toward cap)
    function setQualifiedInvestor(
        address investor,
        bool    qualified
    ) external onlyComplianceCall {
        address compliance = msg.sender;
        require(investor != address(0), "RetailInvestorCap: zero address");

        _isQualifiedWallet[compliance][investor] = qualified;

        // Resolve ONCHAINID and set identity-level flag (covers all wallets of this person)
        address identity = _getIdentity(compliance, investor);
        if (identity != address(0)) {
            _isQualifiedIdentity[compliance][identity] = qualified;

            // Promoting retail → qualified: free the identity slot if counted
            if (qualified && _isRetailIdentity[compliance][identity]) {
                _isRetailIdentity[compliance][identity] = false;
                if (_retailCount[compliance] > 0) _retailCount[compliance]--;
                emit RetailInvestorRemoved(compliance, identity, _retailCount[compliance]);
            }
        }

        emit QualifiedInvestorSet(compliance, investor, identity, qualified);
    }

    /// @notice Override the default 149-person cap for this token.
    function setRetailCap(uint256 cap) external onlyComplianceCall {
        require(cap <= DEFAULT_RETAIL_CAP, "RetailInvestorCap: cap exceeds 149");
        _retailCap[msg.sender] = cap;
        emit RetailCapSet(msg.sender, cap);
    }

    /// @notice Disable the 150-person cap once full FCA authorisation is received.
    ///         The module stays bound but never blocks transfers.
    ///         Alternative: call compliance.removeModule(retailCapAddr) to unbind entirely.
    function disableCap() external onlyComplianceCall {
        _capDisabled[msg.sender] = true;
        emit CapStatusChanged(msg.sender, false);
    }

    /// @notice Re-enable the cap (e.g. if FCA authorisation lapses).
    function enableCap() external onlyComplianceCall {
        _capDisabled[msg.sender] = false;
        emit CapStatusChanged(msg.sender, true);
    }

    /// @notice Remove a retail identity from the count.
    ///         Call after verifying off-chain that the ONCHAINID holds zero balance
    ///         across ALL its wallets. Cannot be automated on-chain (O(N) wallet enumeration).
    function removeRetailIdentity(address identity) external onlyComplianceCall {
        address compliance = msg.sender;
        require(identity != address(0), "RetailInvestorCap: zero identity");
        require(_isRetailIdentity[compliance][identity], "RetailInvestorCap: not a retail identity");
        _isRetailIdentity[compliance][identity] = false;
        if (_retailCount[compliance] > 0) _retailCount[compliance]--;
        emit RetailInvestorRemoved(compliance, identity, _retailCount[compliance]);
    }

    /// @notice Sync a single pre-existing holder after late-binding this module.
    ///         Intentionally bypasses the retail cap — the investor already holds tokens.
    function syncHolder(address investor) external onlyComplianceCall {
        address compliance = msg.sender;
        if (investor == address(0)) return;
        if (_isQualifiedCheck(compliance, investor)) return;
        if (_isKnownWallet[compliance][investor]) return;
        address token = IModularCompliance(compliance).getTokenBound();
        if (IToken(token).balanceOf(investor) == 0) return;
        _syncNewHolder(compliance, investor); // cap-bypass path
    }

    /// @notice Batch-sync pre-existing holders after late-binding this module.
    ///         Capped at MAX_BATCH_SIZE (50) per call to prevent gas exhaustion.
    function syncHolders(address[] calldata investors) external onlyComplianceCall {
        require(investors.length <= MAX_BATCH_SIZE, "RetailInvestorCap: batch too large");
        address compliance = msg.sender;
        address token      = IModularCompliance(compliance).getTokenBound();
        for (uint256 i = 0; i < investors.length; i++) {
            address investor = investors[i];
            if (investor == address(0)) continue;
            if (_isQualifiedCheck(compliance, investor)) continue;
            if (_isKnownWallet[compliance][investor]) continue;
            if (IToken(token).balanceOf(investor) == 0) continue;
            _syncNewHolder(compliance, investor); // cap-bypass path
        }
    }

    // ─── IModule Implementation ───────────────────────────────────────────────

    /// @notice Checked before every transfer.
    ///         T-REX Token._transfer() has already called identityRegistry.isVerified(_to).
    ///         This module only enforces the 150-person cap on top.
    function moduleCheck(
        address /*_from*/,
        address _to,
        uint256 /*_value*/,
        address _compliance
    ) external view override returns (bool) {
        // Cap disabled (post-FCA approval) — no restriction
        if (_capDisabled[_compliance]) return true;

        // Fast-path: wallet-level qualified flag
        if (_isQualifiedWallet[_compliance][_to]) return true;

        // Fast-path: known wallet (already processed, identity counted or confirmed same person)
        if (_isKnownWallet[_compliance][_to]) return true;

        // New wallet — check if cap would be exceeded
        uint256 cap = _effectiveCap(_compliance);
        if (_retailCount[_compliance] >= cap) {
            // Cap is full — allow only if this wallet belongs to an already-counted identity
            // (multi-wallet investor) or to a qualified identity
            address identity = _getIdentity(_compliance, _to);
            if (identity == address(0)) return false; // identity unresolvable at cap — block (fail-safe)
            if (_isQualifiedIdentity[_compliance][identity]) return true;
            if (_isRetailIdentity[_compliance][identity]) return true; // same person, already counted
            return false; // genuinely new person at cap — block
        }

        return true;
    }

    function moduleTransferAction(
        address _from,
        address _to,
        uint256 /*_value*/
    ) external override onlyComplianceCall {
        _handleNewHolder(msg.sender, _to);
        // _from: no wallet exit cleanup — _isKnownWallet is never reset (Issue 4)
    }

    function moduleMintAction(
        address _to,
        uint256 /*_value*/
    ) external override onlyComplianceCall {
        _handleNewHolder(msg.sender, _to);
    }

    function moduleBurnAction(
        address /*_from*/,
        uint256 /*_value*/
    ) external override onlyComplianceCall {
        // No-op: _isKnownWallet is never reset. Admin calls removeRetailIdentity()
        // after confirming full exit across all wallets of an ONCHAINID.
    }

    function name() external pure override returns (string memory) {
        return "RetailInvestorCap";
    }

    function isPlugAndPlay() external pure override returns (bool) {
        return true;
    }

    function canComplianceBind(address /*_compliance*/) external pure override returns (bool) {
        return true;
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    function getRetailCount(address compliance) external view returns (uint256) {
        return _retailCount[compliance];
    }

    function getRemainingRetailSlots(address compliance) external view returns (uint256) {
        if (_capDisabled[compliance]) return type(uint256).max;
        uint256 cap   = _effectiveCap(compliance);
        uint256 count = _retailCount[compliance];
        return count >= cap ? 0 : cap - count;
    }

    function getRetailCap(address compliance) external view returns (uint256) {
        return _effectiveCap(compliance);
    }

    function isQualifiedInvestor(address compliance, address investor) external view returns (bool) {
        return _isQualifiedCheck(compliance, investor);
    }

    function isKnownWallet(address compliance, address investor) external view returns (bool) {
        return _isKnownWallet[compliance][investor];
    }

    function isRetailIdentity(address compliance, address identity) external view returns (bool) {
        return _isRetailIdentity[compliance][identity];
    }

    function isCapEnabled(address compliance) external view returns (bool) {
        return !_capDisabled[compliance];
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    function _effectiveCap(address compliance) internal view returns (uint256) {
        uint256 configured = _retailCap[compliance];
        return configured > 0 ? configured : DEFAULT_RETAIL_CAP;
    }

    /// @dev Combined qualified check: wallet-level fast-path OR identity-level fallback.
    function _isQualifiedCheck(address compliance, address investor) internal view returns (bool) {
        if (_isQualifiedWallet[compliance][investor]) return true;
        address identity = _getIdentity(compliance, investor);
        return identity != address(0) && _isQualifiedIdentity[compliance][identity];
    }

    /// @dev Resolve ONCHAINID for a wallet via the T-REX IdentityRegistry.
    ///      Returns address(0) on failure — callers must handle this defensively.
    function _getIdentity(address compliance, address investor) internal view returns (address) {
        try IToken(
            IModularCompliance(compliance).getTokenBound()
        ).identityRegistry().identity(investor) returns (IIdentity id) {
            return address(id);
        } catch {
            return address(0);
        }
    }

    /// @dev Cap-ENFORCED new holder path (normal transfers / mints).
    ///      Issue 1 fix: _isKnownWallet set ONLY after successful identity resolution.
    ///      Issue 5 fix: revert if cap would be exceeded (TOCTOU guard).
    function _handleNewHolder(address compliance, address investor) internal {
        if (investor == address(0)) return;
        if (_isQualifiedCheck(compliance, investor)) return;
        if (_isKnownWallet[compliance][investor]) return; // Issue 4: never re-process

        address identity = _getIdentity(compliance, investor);

        // Issue 1 fix: if identity unresolvable, do NOT mark wallet known.
        // Next transfer will retry. Transfer itself was allowed by moduleCheck
        // (cap not full path), so this is a transient state, not a bypass.
        if (identity == address(0)) return;

        // Mark wallet known only after identity resolved (Issue 1)
        _isKnownWallet[compliance][investor] = true;

        if (!_isRetailIdentity[compliance][identity]) {
            // Issue 5: enforce cap invariant — should match moduleCheck decision
            require(
                _retailCount[compliance] < _effectiveCap(compliance),
                "RetailInvestorCap: cap exceeded"
            );
            _isRetailIdentity[compliance][identity] = true;
            _retailCount[compliance]++;
            emit RetailInvestorAdded(compliance, identity, investor, _retailCount[compliance]);
        }
        // else: same legal person, different wallet — known, no double count
    }

    /// @dev Cap-BYPASSED new holder path (syncHolder / syncHolders only).
    ///      Used when the module is bound after tokens are already distributed.
    ///      Existing holders must be counted accurately even if count exceeds cap.
    function _syncNewHolder(address compliance, address investor) internal {
        address identity = _getIdentity(compliance, investor);
        if (identity == address(0)) return; // unregistered — skip silently

        _isKnownWallet[compliance][investor] = true;

        if (!_isRetailIdentity[compliance][identity]) {
            _isRetailIdentity[compliance][identity] = true;
            _retailCount[compliance]++;
            emit RetailInvestorAdded(compliance, identity, investor, _retailCount[compliance]);
        }
    }
}
