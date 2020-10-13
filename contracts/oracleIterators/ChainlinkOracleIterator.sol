// "SPDX-License-Identifier: GNU General Public License v3.0"

pragma solidity >=0.4.21 <0.7.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol";
import "./IOracleIterator.sol";

contract ChainlinkOracleIterator is IOracleIterator {
    using SafeMath for uint256;

    uint256 constant private PHASE_OFFSET = 64;
    int public constant NEGATIVE_INFINITY = type(int256).min;

    // An error specific to the Aggregator V3 Interface, to prevent possible
    // confusion around accidentally reading unset values as reported values.
    string constant private V3_NO_DATA_ERROR = "No data present";

    function isOracleIterator() external override pure returns(bool) {
        return true;
    }

    function symbol() external override view returns (string memory) {
        return "ChainlinkIterator";
    }

    function getUnderlingValue(address _oracle, uint _timestamp, uint[] memory _roundHints) public override view returns(int) {
        require(_timestamp > 0, "Zero timestamp");
        require(_oracle != address(0), "Zero oracle");
        AggregatorV3Interface oracle = AggregatorV3Interface(_oracle);

        uint80 latestRoundId;
        (latestRoundId,,,,) = oracle.latestRoundData();

        uint256 phaseId;
        (phaseId,) = parseIds(latestRoundId);
        require(_roundHints.length == phaseId, "Must have hints for all phases");

        uint256 distance = type(uint256).max;
        int256 answer = NEGATIVE_INFINITY;

        for (uint phase = 1; phase <= phaseId; phase++) {
            uint80 roundHint = uint80(_roundHints[phase - 1]);
            require(roundHint > 0, "Zero hint");
            requirePhaseFor(roundHint, phase);

            int256 phaseAnswer;
            uint256 phaseTimestamp;
            (,phaseAnswer,,phaseTimestamp,) = oracle.getRoundData(roundHint);

            if(phaseTimestamp > 0 && phaseTimestamp > _timestamp) {
                uint256 timestampPrevious = getRoundTimestampSafely(oracle, roundHint - 1);
                require(timestampPrevious == 0, "Earlier round exists");
                continue;
            }

            uint256 timestampNext = getRoundTimestampSafely(oracle, roundHint + 1);

            if(phaseTimestamp > 0 && phaseTimestamp <= _timestamp) {
                if(timestampNext > 0 && timestampNext <= _timestamp) {
                    revert("Later round exists");
                }
                if(timestampNext == 0 || (timestampNext > 0 && timestampNext > _timestamp)) {
                    uint256 phaseDistance = _timestamp.sub(phaseTimestamp);
                    if(phaseDistance < distance) {
                        answer = phaseAnswer;
                        distance = phaseDistance;
                    }
                }
            }
        }

        return answer;
    }

    function getRoundTimestampSafely(AggregatorV3Interface oracle, uint80 round)
    internal
    view
    returns (uint) {
        try oracle.getRoundData(round) returns (
            uint80,
            int256,
            uint256,
            uint256 updatedAt,
            uint80
        ) {
            return updatedAt;
        }
        catch {}
        return 0;
    }

    function requirePhaseFor(uint80 _roundHint, uint256 _phase)
    internal
    pure
    {
        uint256 currentPhaseId;
        (currentPhaseId,) = parseIds(_roundHint);
        require(currentPhaseId == _phase, "Wrong hint phase id");
    }

    function parseIds(
        uint256 _roundId
    )
    internal
    pure
    returns (uint16, uint64)
    {
        uint16 phaseId = uint16(_roundId >> PHASE_OFFSET);
        uint64 aggregatorRoundId = uint64(_roundId);

        return (phaseId, aggregatorRoundId);
    }
}
