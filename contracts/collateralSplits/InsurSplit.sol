// "SPDX-License-Identifier: GNU General Public License v3.0"

pragma solidity >=0.4.21 <0.7.0;

import "./CollateralSplitParent.sol";

contract InsurSplit is CollateralSplitParent{
    function symbol() external override view returns (string memory) {
        return 'Insur';
    }

    function splitNominalValue(int _normalizedValue) public override pure returns(int){
        if(_normalizedValue >= 0) {
            return FRACTION_MULTIPLIER / 2; // 0.5
        }

        if(_normalizedValue < -(FRACTION_MULTIPLIER/2)) {
            return FRACTION_MULTIPLIER; // 1
        }

        if(_normalizedValue >= -(FRACTION_MULTIPLIER/2) && _normalizedValue < 0) {
            return (FRACTION_MULTIPLIER * FRACTION_MULTIPLIER) / ((2 * (FRACTION_MULTIPLIER + _normalizedValue)));  // 1 / 2 * ( 1 + U_T)
        }
        return 0;
    }
}
