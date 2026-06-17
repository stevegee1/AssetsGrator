// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

interface IFeeManager {
    function computePlatformCutPlaintext(uint256 grossAmount) external view returns (uint256);
    function computeMaintenanceCutPlaintext(uint256 grossAmount) external view returns (uint256);
    function computeExitFeePlaintext(uint256 grossAmount) external view returns (uint256);
    function computeMarketplaceFeePlaintext(uint256 grossAmount) external view returns (uint256);
}
