// "SPDX-License-Identifier: GNU General Public License v3.0"

pragma solidity 0.6.12;

import "./CollateralSplitParent.sol";

contract StableSplit is CollateralSplitParent{
    function symbol() external override pure returns (string memory) {
        return 'Stab';
    }

    function splitNominalValue(int _normalizedValue) public override pure returns(int){
        if(_normalizedValue <= -(FRACTION_MULTIPLIER/2)) {
            return FRACTION_MULTIPLIER;
        } else {
            return FRACTION_MULTIPLIER * FRACTION_MULTIPLIER / (2 * (FRACTION_MULTIPLIER  + _normalizedValue));
        }
    }
}
