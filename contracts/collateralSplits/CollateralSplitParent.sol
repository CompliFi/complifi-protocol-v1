// "SPDX-License-Identifier: GNU General Public License v3.0"

pragma solidity >=0.4.21 <0.7.0;

import "./ICollateralSplit.sol";
import "../oracleIterators/IOracleIterator.sol";

abstract contract CollateralSplitParent is ICollateralSplit {
    int public constant FRACTION_MULTIPLIER = 10**12;
    int public constant NEGATIVE_INFINITY = type(int256).min;

    function isCollateralSplit() external override pure returns(bool) {
        return true;
    }

    function split(
        address[] memory _oracles,
        address[] memory _oracleIterators,
        uint _liveTime,
        uint _settleTime,
        uint[] memory _underlyingStartRoundHints,
        uint[] memory _underlyingEndRoundHints)
    external override virtual view returns(uint _split, int _underlyingStart, int _underlyingEnd) {
        require(_oracles.length == 1, "More than one oracle");
        require(_oracles[0] != address(0), "Oracle is empty");
        require(_oracleIterators[0] != address(0), "Oracle iterator is empty");

        IOracleIterator iterator = IOracleIterator(_oracleIterators[0]);
        require(iterator.isOracleIterator(), "Not oracle iterator");

        _underlyingStart = iterator.getUnderlingValue(_oracles[0], _liveTime, _underlyingStartRoundHints[0]);
        _underlyingEnd = iterator.getUnderlingValue(_oracles[0], _settleTime, _underlyingEndRoundHints[0]);

        _split = range(
            splitNominalValue(
                normalize( _underlyingStart, _underlyingEnd )
            )
        );
    }

    function splitNominalValue(int _normalizedValue) public virtual pure returns(int);

    function normalize(int _u_0, int _u_T) public virtual pure returns(int){
        require(_u_0 != NEGATIVE_INFINITY, "u_0 is absent");
        require(_u_T != NEGATIVE_INFINITY, "u_T is absent");
        require(_u_0 > 0, "u_0 is less or equal zero");

        if(_u_T < 0) {
            _u_T = 0;
        }

        return (_u_T - _u_0) * FRACTION_MULTIPLIER / _u_0;
    }

    function range(int _split) public pure returns(uint) {
        if(_split >= FRACTION_MULTIPLIER) {
            return uint(FRACTION_MULTIPLIER);
        }
        if(_split <= 0) {
            return 0;
        }
        return uint(_split);
    }
}
