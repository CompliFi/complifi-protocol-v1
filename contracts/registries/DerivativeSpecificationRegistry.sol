// "SPDX-License-Identifier: GNU General Public License v3.0"

pragma solidity 0.6.12;

import "./AddressRegistryParent.sol";
import "../IDerivativeSpecification.sol";

contract DerivativeSpecificationRegistry is AddressRegistryParent {
    mapping(bytes32 => bool) internal _uniqueFieldsHashMap;

    function generateKey(address _value) public override view returns(bytes32 _key){
        return keccak256(abi.encodePacked(IDerivativeSpecification(_value).symbol()));
    }

    function _check(bytes32 _key, address _value) internal virtual override{
        super._check(_key, _value);
        IDerivativeSpecification derivative = IDerivativeSpecification(_value);
        require(derivative.isDerivativeSpecification(), "Should be derivative specification");

        bytes32 uniqueFieldsHash =
            keccak256(
                abi.encode(
                    derivative.oracleSymbols(),
                    derivative.oracleIteratorSymbols(),
                    derivative.collateralTokenSymbol(),
                    derivative.collateralSplitSymbol(),
                    derivative.mintingPeriod(),
                    derivative.livePeriod(),
                    derivative.primaryNominalValue(),
                    derivative.complementNominalValue(),
                    derivative.authorFee()
                )
            );

        require(!_uniqueFieldsHashMap[uniqueFieldsHash], "Same spec params");

        _uniqueFieldsHashMap[uniqueFieldsHash] = true;
    }
}
