// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract MockIdentityRegistry {
    mapping(address => bool) private _verified;

    function setVerified(address user, bool status) external {
        _verified[user] = status;
    }

    function isVerified(address userAddress) external view returns (bool) {
        return _verified[userAddress];
    }
}
