// "SPDX-License-Identifier: GNU General Public License v3.0"

pragma solidity >=0.4.21 <0.7.0;

import "./CollateralSplitParent.sol";

contract CallOptionSplit is CollateralSplitParent{

    function symbol() external override view returns (string memory) {
        return 'CallOption';
    }

    function splitNominalValue(int _normalizedValue) public override pure returns(int){
        if(_normalizedValue < 0) { // < 0
            return 0; // 0%
        }

        if(_normalizedValue >= 0) { // >= 0
            return FRACTION_MULTIPLIER * _normalizedValue / (FRACTION_MULTIPLIER + _normalizedValue );  // U/(1+U)
        }
        return 0;
    }
}
