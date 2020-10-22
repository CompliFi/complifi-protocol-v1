// "SPDX-License-Identifier: GNU General Public License v3.0"

pragma solidity >=0.4.21 <0.7.0;

import "./IOracleIterator.sol";

contract OracleIteratorDebugger {

    int public underlingValue;

    function updateUnderlingValue(address _oracleIterator, address _oracle, uint _timestamp, uint[] memory _roundHints) public {
        require(_timestamp > 0, "Zero timestamp");
        require(_oracle != address(0), "Zero oracle");
        require(_oracleIterator != address(0), "Zero oracle iterator");

        IOracleIterator oracleIterator = IOracleIterator(_oracleIterator);
        underlingValue = oracleIterator.getUnderlingValue(_oracle, _timestamp, _roundHints);
    }
}
