// "SPDX-License-Identifier: GNU General Public License v3.0"

pragma solidity 0.6.12;

import "@openzeppelin/contracts/math/SignedSafeMath.sol";
import "./ICollateralSplit.sol";
import "../oracleIterators/IOracleIterator.sol";

abstract contract CollateralSplitParent is ICollateralSplit {
    using SignedSafeMath for int256;

    int256 public constant FRACTION_MULTIPLIER = 10**12;
    int256 public constant NEGATIVE_INFINITY = type(int256).min;

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
    external override virtual view returns(uint _split, int256[] memory _underlyingStarts, int256[] memory _underlyingEnds) {
        require(_oracles.length == 1, "More than one oracle");
        require(_oracles[0] != address(0), "Oracle is empty");
        require(_oracleIterators[0] != address(0), "Oracle iterator is empty");

        _underlyingStarts = new int256[](1);
        _underlyingEnds = new int256[](1);

        IOracleIterator iterator = IOracleIterator(_oracleIterators[0]);
        require(iterator.isOracleIterator(), "Not oracle iterator");

        _underlyingStarts[0] = iterator.getUnderlingValue(_oracles[0], _liveTime, _underlyingStartRoundHints);
        _underlyingEnds[0] = iterator.getUnderlingValue(_oracles[0], _settleTime, _underlyingEndRoundHints);

        _split = range(
            splitNominalValue(
                normalize( _underlyingStarts[0], _underlyingEnds[0] )
            )
        );
    }

    function splitNominalValue(int256 _normalizedValue) public virtual pure returns(int256);

    function normalize(int256 _u_0, int256 _u_T) public virtual pure returns(int256){
        require(_u_0 != NEGATIVE_INFINITY, "u_0 is absent");
        require(_u_T != NEGATIVE_INFINITY, "u_T is absent");
        require(_u_0 > 0, "u_0 is less or equal zero");

        if(_u_T < 0) {
            _u_T = 0;
        }

        return _u_T.sub(_u_0).mul(FRACTION_MULTIPLIER).div(_u_0);
    }

    function range(int256 _split) public pure returns(uint256) {
        if(_split >= FRACTION_MULTIPLIER) {
            return uint(FRACTION_MULTIPLIER);
        }
        if(_split <= 0) {
            return 0;
        }
        return uint256(_split);
    }
}
