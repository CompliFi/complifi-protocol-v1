// "SPDX-License-Identifier: GNU General Public License v3.0"

pragma solidity >=0.4.21 <0.7.0;

import "@chainlink/contracts/src/v0.6/interfaces/AggregatorInterface.sol";
import "./IOracleIterator.sol";

contract ChainlinkOracleIterator is IOracleIterator {
    int public constant NEGATIVE_INFINITY = type(int256).min;

    function isOracleIterator() external override pure returns(bool) {
        return true;
    }

    function symbol() external override view returns (string memory) {
        return "ChainlinkIterator";
    }

    function getUnderlingValue(address _oracle, uint _timestamp, uint _roundHint) public override view returns(int) {
        require(_timestamp > 0, "Zero timestamp");
        require(_oracle != address(0), "Nullable oracle");
        AggregatorInterface oracle = AggregatorInterface(_oracle);

        if(_roundHint > 0) {
            uint roundHintTimestamp = oracle.getTimestamp(_roundHint);
            uint nextRoundHintTimestamp = oracle.getTimestamp(_roundHint + 1);

            if(roundHintTimestamp > 0 && roundHintTimestamp <= _timestamp &&
                (nextRoundHintTimestamp == 0 || nextRoundHintTimestamp > _timestamp)) {
                return oracle.getAnswer(_roundHint);
            } else {
                revert('Incorrect hint');
            }
        }

        uint roundTimestamp = 0;
        uint roundId = oracle.latestRound() + 1;

        do {
            roundId -= 1;
            roundTimestamp = oracle.getTimestamp(roundId);
        } while(roundTimestamp > _timestamp && roundId > 0);

        if(roundId == 0 && oracle.getTimestamp(roundId) > _timestamp) {
            return NEGATIVE_INFINITY;
        }

        return oracle.getAnswer(roundId);
    }
}
