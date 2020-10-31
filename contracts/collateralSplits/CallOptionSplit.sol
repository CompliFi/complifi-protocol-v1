// "SPDX-License-Identifier: GNU General Public License v3.0"

pragma solidity 0.6.12;

import "./CollateralSplitParent.sol";

contract CallOptionSplit is CollateralSplitParent{

    function symbol() external override pure returns (string memory) {
        return 'CallOption';
    }

    function splitNominalValue(int _normalizedValue) public override pure returns(int){
        if(_normalizedValue > 0) {
            return FRACTION_MULTIPLIER * _normalizedValue / (FRACTION_MULTIPLIER + _normalizedValue );
        } else {
            return 0;
        }
    }
}
