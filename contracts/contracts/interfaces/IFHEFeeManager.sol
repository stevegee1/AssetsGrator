// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

interface IFHEFeeManager {
    function computePlatformCutPlaintext(uint256 gross) external returns (uint256);
    function computeMaintenanceCutPlaintext(uint256 gross) external returns (uint256);
    function computeExitFeePlaintext(uint256 gross) external returns (uint256);
    function computeMarketplaceFeePlaintext(uint256 gross) external returns (uint256);
}
