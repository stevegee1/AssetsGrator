// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

import "@tokenysolutions/t-rex/contracts/compliance/modular/modules/AbstractModule.sol";
import "@tokenysolutions/t-rex/contracts/compliance/modular/IModularCompliance.sol";
import "@tokenysolutions/t-rex/contracts/token/IToken.sol";
import "@tokenysolutions/t-rex/contracts/registry/interface/IIdentityRegistry.sol";

/// @title CountryRestrictModule
/// @notice Compliance module that blocks token transfers to/from investors
///         in specific countries. Required for:
///         - SEC Reg S / Reg D compliance (block US persons)
///         - EU MiCA jurisdictional controls
///         - Country-specific energy asset regulations
///
/// Works with the T-REX IdentityRegistry which stores investor country codes.
/// The platform operator configures which countries are restricted per token.
contract CountryRestrictModule is AbstractModule {

    // ─── Events ───────────────────────────────────────────────────────────────

    event CountryRestricted(address indexed compliance, uint16 countryCode);
    event CountryUnrestricted(address indexed compliance, uint16 countryCode);

    // ─── Storage ──────────────────────────────────────────────────────────────

    /// @dev compliance => country code => is restricted
    mapping(address => mapping(uint16 => bool)) private _restricted;

    // ─── Configuration (called via compliance.callModuleFunction) ─────────────

    /// @notice Restrict a country from holding tokens
    /// @param countryCode ISO 3166-1 numeric country code (e.g. 840 = US, 826 = UK)
    function restrictCountry(uint16 countryCode) external onlyComplianceCall {
        _restricted[msg.sender][countryCode] = true;
        emit CountryRestricted(msg.sender, countryCode);
    }

    /// @notice Remove restriction for a country
    function unrestrictCountry(uint16 countryCode) external onlyComplianceCall {
        _restricted[msg.sender][countryCode] = false;
        emit CountryUnrestricted(msg.sender, countryCode);
    }

    /// @notice Batch restrict multiple countries
    function restrictCountries(uint16[] calldata countryCodes) external onlyComplianceCall {
        for (uint256 i = 0; i < countryCodes.length; i++) {
            _restricted[msg.sender][countryCodes[i]] = true;
            emit CountryRestricted(msg.sender, countryCodes[i]);
        }
    }

    // ─── IModule Implementation ───────────────────────────────────────────────

    /// @notice Check if a transfer is allowed based on country restrictions
    function moduleCheck(
        address _from,
        address _to,
        uint256 /*_value*/,
        address _compliance
    ) external view override returns (bool) {
        // Get the identity registry from the bound token
        address token = IModularCompliance(_compliance).getTokenBound();
        IIdentityRegistry ir = IIdentityRegistry(IToken(token).identityRegistry());

        // Check sender country (skip for mint — from = address(0))
        if (_from != address(0)) {
            uint16 fromCountry = ir.investorCountry(_from);
            if (_restricted[_compliance][fromCountry]) return false;
        }

        // Check receiver country (skip for burn — to = address(0))
        if (_to != address(0)) {
            uint16 toCountry = ir.investorCountry(_to);
            if (_restricted[_compliance][toCountry]) return false;
        }

        return true;
    }

    function moduleTransferAction(
        address /*_from*/,
        address /*_to*/,
        uint256 /*_value*/
    ) external override onlyComplianceCall {
        // No state changes on transfer
    }

    function moduleMintAction(
        address /*_to*/,
        uint256 /*_value*/
    ) external override onlyComplianceCall {
        // No state changes on mint
    }

    function moduleBurnAction(
        address /*_from*/,
        uint256 /*_value*/
    ) external override onlyComplianceCall {
        // No state changes on burn
    }

    function name() external pure override returns (string memory) {
        return "CountryRestrictModule";
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

    function isCountryRestricted(
        address compliance,
        uint16 countryCode
    ) external view returns (bool) {
        return _restricted[compliance][countryCode];
    }
}
