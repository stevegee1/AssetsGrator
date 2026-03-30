// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.28;

interface IModularCompliance {
    function init() external;
    function bindToken(address _token) external;
    function addModule(address _module) external;
}

interface IIdentityRegistryTREX {
    function isVerified(address _userAddress) external view returns (bool);
}

interface ITokenTREX {
    function identityRegistry() external view returns (address);
    function transferFrom(address _from, address _to, uint256 _amount) external returns (bool);
}
