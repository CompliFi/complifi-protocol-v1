// "SPDX-License-Identifier: GNU General Public License v3.0"

pragma solidity >=0.4.21 <0.7.0;

interface ICollateralSplitTemplate {
    function splitNominalValue(int _normalizedValue) external pure returns(int);
    function normalize(int _u_0, int _u_T) external pure returns(int);
    function range(int _split) external returns(uint);
}
