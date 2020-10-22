const OracleIteratorRegistry = artifacts.require("OracleIteratorRegistry");
const ChainlinkOracleIterator = artifacts.require("ChainlinkOracleIterator");
const StubFeed = artifacts.require("StubFeed");
const AggregatorProxy = artifacts.require("AggregatorProxy");
const OracleIteratorDebugger = artifacts.require("OracleIteratorDebugger");

const FRACTION_MULTIPLIER = Math.pow(10, 12);
const NEGATIVE_INFINITY = "-57896044618658097711785492504343953926634992332820282019728792003956564819968";

const seconds = (amount) => amount;
const minutes = (amount) => amount * seconds(60);
const hours = (amount) => amount * minutes(60);
const days = (amount) => amount * hours(24);
const months = (amount) => amount * days(30);

const makeRoundIdForPhase = (phaseId, roundId) => web3.utils.toBN(phaseId).shln(64).add(web3.utils.toBN(roundId)).toString();

const makeRoundIdForPhase1 = (roundId) => makeRoundIdForPhase(1, roundId);
const makeRoundIdForPhase2 = (roundId) => makeRoundIdForPhase(2, roundId);
const makeRoundIdForPhase3 = (roundId) => makeRoundIdForPhase(3, roundId);

contract("Oracle Iterator Debugger", accounts => {
  let oracleIterator, stubFeed, aggregatorProxy, oracleIteratorDebugger;

  beforeEach(async () => {
    const registry = await OracleIteratorRegistry.deployed();
    const address = await registry.get.call(web3.utils.keccak256("ChainlinkIterator"));
    oracleIterator = await ChainlinkOracleIterator.at(address);

    stubFeed = await StubFeed.new();
    aggregatorProxy = await AggregatorProxy.new(stubFeed.address);

    oracleIteratorDebugger = await OracleIteratorDebugger.new();
  });

  it("...should revert if hints empty.", async () => {
    const now = Math.floor(Date.now() / 1000);

    await stubFeed.addRound(100, now);

    assert.equal(0, (await oracleIteratorDebugger.underlingValue.call()).toNumber());

    await oracleIteratorDebugger.updateUnderlingValue(
      oracleIterator.address,
      aggregatorProxy.address,
      now + seconds(1),
      [makeRoundIdForPhase1(1)]);

    assert.equal(100, (await oracleIteratorDebugger.underlingValue.call()).toNumber());
  });
});
