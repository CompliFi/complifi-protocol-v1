// "SPDX-License-Identifier: GNU General Public License v3.0"

pragma solidity >=0.4.21 <0.7.0;

import "./CollateralSplitParent.sol";

contract x1Split is CollateralSplitParent {
    function symbol() external override view returns (string memory) {
        return 'x1';
    }

    function splitNominalValue(int _normalizedValue) public override pure returns(int){
        return (FRACTION_MULTIPLIER + _normalizedValue) / 2 ; // multiplied (1 + u_t) * 0.5
    }
}
