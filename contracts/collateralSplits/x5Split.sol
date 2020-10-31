// "SPDX-License-Identifier: GNU General Public License v3.0"

pragma solidity 0.6.12;

import "./CollateralSplitParent.sol";

contract x5Split is CollateralSplitParent{
    function symbol() external override pure returns (string memory) {
        return 'x5';
    }

    function splitNominalValue(int _normalizedValue) public override pure returns(int){
        if(_normalizedValue <= -(FRACTION_MULTIPLIER/5)) {
            return 0;
        } else if(_normalizedValue > -(FRACTION_MULTIPLIER/5) && _normalizedValue < FRACTION_MULTIPLIER/5) {
            return (FRACTION_MULTIPLIER + _normalizedValue * 5) / 2;
        } else {
            return FRACTION_MULTIPLIER;
        }
    }
}
