// "SPDX-License-Identifier: GNU General Public License v3.0"

pragma solidity 0.6.12;

import "./IERC20MintedBurnable.sol";
import "../IDerivativeSpecification.sol";

interface ITokenBuilder {
    function isTokenBuilder() external pure returns(bool);
    function buildTokens(IDerivativeSpecification derivative, uint settlement, address _collateralToken) external returns(IERC20MintedBurnable, IERC20MintedBurnable);
}
