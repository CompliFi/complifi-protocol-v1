// "SPDX-License-Identifier: GNU General Public License v3.0"

pragma solidity 0.6.12;

interface ICollateralSplitTemplate {
    function splitNominalValue(int _normalizedValue) external pure returns(int);
    function normalize(int _u_0, int _u_T) external pure returns(int);
    function range(int _split) external returns(uint);
}
