// "SPDX-License-Identifier: GNU General Public License v3.0"

pragma solidity >=0.4.21 <0.7.0;

import "@chainlink/contracts/src/v0.6/interfaces/AggregatorInterface.sol";
import "@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol";
import "../tokens/ERC20PresetMinter.sol";

contract StubFeed is AggregatorInterface, AggregatorV3Interface {
    struct StubFeedRound {
        int answer;
        uint timestamp;
    }

    StubFeedRound[] public rounds;

    uint private latestRound_;

    constructor() public { }

    function addRound(int _answer, uint _timestamp) external {
        rounds.push(StubFeedRound({answer: _answer, timestamp: _timestamp}));
        latestRound_ = rounds.length - 1;
    }

    function updateRound(uint _round, int _answer, uint _timestamp) external {
        rounds[_round] = StubFeedRound({answer: _answer, timestamp: _timestamp});
    }

    function latestAnswer() external view override returns (int256) {
        return rounds[latestRound_].answer;
    }

    function latestTimestamp() external view override returns (uint256){
        return rounds[latestRound_].timestamp;
    }

    function latestRound() external view override returns (uint256){
        return latestRound_;
    }

    function getAnswer(uint256 _roundId) external view override returns (int256){
        if(_roundId > latestRound_) return 0;
        return rounds[_roundId].answer;
    }

    function getTimestamp(uint256 _roundId) external view override returns (uint256){
        if(_roundId > latestRound_) return 0;
        return rounds[_roundId].timestamp;
    }

    function decimals() external view override returns (uint8) {
        return 6;
    }

    function description() external view override returns (string memory) {
        return "Stub Test Feed";
    }

    function version() external view override returns (uint256) {
        return 3;
    }

    // getRoundData and latestRoundData should both raise "No data present"
    // if they do not have data to report, instead of returning unset values
    // which could be misinterpreted as actual reported values.
    function getRoundData(uint80 _roundId)
    external
    view
    override
    returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        roundId = _roundId;
        answeredInRound = _roundId;
        answer = rounds[roundId].answer;
        startedAt = rounds[roundId].timestamp;
        updatedAt = rounds[roundId].timestamp;
    }

    function latestRoundData()
    external
    view
    override
    returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        answeredInRound = uint80(latestRound_);
        roundId = uint80(latestRound_);
        answer = rounds[roundId].answer;
        startedAt = rounds[roundId].timestamp;
        updatedAt = rounds[roundId].timestamp;
    }
}
