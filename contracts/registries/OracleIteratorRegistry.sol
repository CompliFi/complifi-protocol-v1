// "SPDX-License-Identifier: GNU General Public License v3.0"

pragma solidity 0.6.12;

import "./AddressRegistryParent.sol";
import "../oracleIterators/IOracleIterator.sol";

contract OracleIteratorRegistry is AddressRegistryParent {
    function generateKey(address _value) public override view returns(bytes32 _key){
        require(IOracleIterator(_value).isOracleIterator(), "Should be oracle iterator");
        return keccak256(abi.encodePacked(IOracleIterator(_value).symbol()));
    }
}
