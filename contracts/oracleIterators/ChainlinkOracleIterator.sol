// "SPDX-License-Identifier: GNU General Public License v3.0"

pragma solidity 0.6.12;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol";
import "./IOracleIterator.sol";

contract ChainlinkOracleIterator is IOracleIterator {
    using SafeMath for uint256;

    uint256 constant private PHASE_OFFSET = 64;
    int public constant NEGATIVE_INFINITY = type(int256).min;

    function isOracleIterator() external override pure returns(bool) {
        return true;
    }

    function symbol() external override pure returns (string memory) {
        return "ChainlinkIterator";
    }

    function getUnderlingValue(address _oracle, uint _timestamp, uint[] memory _roundHints) public override view returns(int) {
        require(_timestamp > 0, "Zero timestamp");
        require(_oracle != address(0), "Zero oracle");
        require(_roundHints.length == 1, "Wrong number of hints");
        AggregatorV3Interface oracle = AggregatorV3Interface(_oracle);

        uint80 latestRoundId;
        (latestRoundId,,,,) = oracle.latestRoundData();

        uint256 phaseId;
        (phaseId,) = parseIds(latestRoundId);

        uint80 roundHint = uint80(_roundHints[0]);
        require(roundHint > 0, "Zero hint");
        requirePhaseFor(roundHint, phaseId);

        int256 hintAnswer;
        uint256 hintTimestamp;
        (,hintAnswer,,hintTimestamp,) = oracle.getRoundData(roundHint);

        require(hintTimestamp > 0 && hintTimestamp <= _timestamp, 'Incorrect hint');

        uint256 timestampNext = 0;
        if(roundHint + 1 <= latestRoundId) {
            (,,,timestampNext,) = oracle.getRoundData(roundHint + 1);
            require(timestampNext == 0 || timestampNext > _timestamp, "Later round exists");
        }

        if(timestampNext == 0 || timestampNext > _timestamp){
            return hintAnswer;
        }

        return NEGATIVE_INFINITY;
    }

    function requirePhaseFor(uint80 _roundHint, uint256 _phase)
    internal
    pure
    {
        uint256 currentPhaseId;
        (currentPhaseId,) = parseIds(_roundHint);
        require(currentPhaseId == _phase, "Wrong hint phase");
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
