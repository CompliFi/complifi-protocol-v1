// "SPDX-License-Identifier: GNU General Public License v3.0"

pragma solidity >=0.4.21 <0.7.0;

import "./AddressRegistryParent.sol";
import "../oracleIterators/IOracleIterator.sol";

contract OracleIteratorRegistry is AddressRegistryParent {
    function _check(bytes32 _key, address _value) internal virtual override{
        super._check(_key, _value);

        require(_key == keccak256(abi.encodePacked(IOracleIterator(_value).symbol())), "Incorrect hash");

        require(IOracleIterator(_value).isOracleIterator(), "Should be oracle iterator");
    }
}
