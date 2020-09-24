// "SPDX-License-Identifier: GNU General Public License v3.0"

pragma solidity >=0.4.21 <0.7.0;

import "./AddressRegistryParent.sol";
import "../IDerivativeSpecification.sol";

contract DerivativeSpecificationRegistry is AddressRegistryParent {
    function _check(bytes32 _key, address _value) internal virtual override{
        super._check(_key, _value);
        IDerivativeSpecification derivative = IDerivativeSpecification(_value);
        require(derivative.isDerivativeSpecification(), "Should be derivative specification");

        require(_key == keccak256(abi.encodePacked(derivative.symbol())), "Incorrect hash");

        for (uint i = 0; i < _keys.length; i++) {
            bytes32 key = _keys[i];
            IDerivativeSpecification value = IDerivativeSpecification(_registry[key]);
            if( keccak256(abi.encodePacked(derivative.oracleSymbols())) == keccak256(abi.encodePacked(value.oracleSymbols())) &&
                keccak256(abi.encodePacked(derivative.oracleIteratorSymbols())) == keccak256(abi.encodePacked(value.oracleIteratorSymbols())) &&
                derivative.collateralTokenSymbol() == value.collateralTokenSymbol() &&
                derivative.collateralSplitSymbol() == value.collateralSplitSymbol() &&
                derivative.mintingPeriod() == value.mintingPeriod() &&
                derivative.livePeriod() == value.livePeriod() &&
                derivative.primaryNominalValue() == value.primaryNominalValue() &&
                derivative.complementNominalValue() == value.complementNominalValue() &&
                derivative.authorFee() == value.authorFee() ) {

                revert("Same spec params");
            }
        }
    }
}
