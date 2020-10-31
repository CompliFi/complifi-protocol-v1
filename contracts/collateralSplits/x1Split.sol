// "SPDX-License-Identifier: GNU General Public License v3.0"

pragma solidity 0.6.12;

import "./CollateralSplitParent.sol";

contract x1Split is CollateralSplitParent {
    function symbol() external override pure returns (string memory) {
        return 'x1';
    }

    function splitNominalValue(int _normalizedValue) public override pure returns(int){
        return (FRACTION_MULTIPLIER + _normalizedValue) / 2 ;
    }
}
