const OracleIteratorRegistry = artifacts.require("OracleIteratorRegistry");
const ChainlinkOracleIterator = artifacts.require("ChainlinkOracleIterator");
const StubFeed = artifacts.require("StubFeed");
const AggregatorProxy = artifacts.require("AggregatorProxy");

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

contract("Chainlink Oracle Iterator", accounts => {
  let oracleIterator;

  before(async () => {
    const registry = await OracleIteratorRegistry.deployed();
    const address = await registry.get.call(web3.utils.keccak256("ChainlinkIterator"));
    oracleIterator = await ChainlinkOracleIterator.at(address);
  });

  describe(' with one phase ', function () {
    let stubFeed, aggregatorProxy;

    beforeEach(async () => {
      stubFeed = await StubFeed.new();
      aggregatorProxy = await AggregatorProxy.new(stubFeed.address);
    });

    it("...should revert if incorrect hints amount.", async () => {
      const now = Math.floor(Date.now() / 1000);

      await stubFeed.addRound(100, now);

      try {
        await oracleIterator.getUnderlingValue.call(aggregatorProxy.address, now + seconds(1), [])
        assert.fail();
      } catch (err) {
        assert.ok(/revert Wrong number of hints/.test(err.message));
      }

      try {
        await oracleIterator.getUnderlingValue.call(aggregatorProxy.address, now + seconds(1), [makeRoundIdForPhase1(1), makeRoundIdForPhase1(1)])
        assert.fail();
      } catch (err) {
        assert.ok(/revert Wrong number of hints/.test(err.message));
      }
    });

    it("...should revert if feed empty.", async () => {
      const now = Math.floor(Date.now() / 1000);

      try {
        await oracleIterator.getUnderlingValue.call(aggregatorProxy.address, now + seconds(1), [makeRoundIdForPhase1(1)]);
        assert.fail();
      } catch (err) {
        assert.ok(/revert No data present/.test(err.message));
      }
    });

    it("...should revert if zero hint.", async () => {
      const now = Math.floor(Date.now() / 1000);

      await stubFeed.addRound(100, now);

      try {
        await oracleIterator.getUnderlingValue.call(aggregatorProxy.address, now + seconds(1), [0])
        assert.fail();
      } catch (err) {
        assert.ok(/revert Zero hint/.test(err.message));
      }
    });

    it("...should return answer if next round existed.", async () => {
      const now = Math.floor(Date.now() / 1000);

      await stubFeed.addRound(100, now);
      await stubFeed.addRound(101, now + seconds(2));

      assert.equal(100,
        await oracleIterator.getUnderlingValue.call(
          aggregatorProxy.address,
          now + seconds(1),
          [makeRoundIdForPhase1(1)]));
    });

    it("...should return answer if next round absent.", async () => {
      const now = Math.floor(Date.now() / 1000);

      await stubFeed.addRound(200, now);

      assert.equal(200,
        await oracleIterator.getUnderlingValue.call(
          aggregatorProxy.address,
          now + seconds(2),
          [makeRoundIdForPhase1(1)]));
    });

    it("...should revert if all rounds in future.", async () => {
      const now = Math.floor(Date.now() / 1000);

      await stubFeed.addRound(100, now + seconds(1));
      await stubFeed.addRound(101, now + seconds(2));

      try {
        await oracleIterator.getUnderlingValue.call(
          aggregatorProxy.address,
          now,
          [makeRoundIdForPhase1(1)])
        assert.fail();
      } catch (err) {
        assert.ok(/revert Incorrect hint/.test(err.message));
      }
    });

    it("...should return answer if last round with right timestamp.", async () => {
      const now = Math.floor(Date.now() / 1000);

      await stubFeed.addRound(100, now + seconds(1));
      await stubFeed.addRound(101, now + seconds(2));
      await stubFeed.addRound(102, now + seconds(3));

      assert.equal(102,
        (await oracleIterator.getUnderlingValue.call(
          aggregatorProxy.address,
          now + seconds(3),
          [makeRoundIdForPhase1(3)])).toString());
    });

    it("...should return answer if pre-last round with right timestamp.", async () => {
      const now = Math.floor(Date.now() / 1000);

      await stubFeed.addRound(100, now + seconds(1));
      await stubFeed.addRound(101, now + seconds(2));
      await stubFeed.addRound(102, now + seconds(3));

      assert.equal(101,
        (await oracleIterator.getUnderlingValue.call(aggregatorProxy.address, now + seconds(2),
          [makeRoundIdForPhase1(2)])).toString());
    });

    it("...should revert if pre-last round with wrong timestamp.", async () => {
      const now = Math.floor(Date.now() / 1000);

      await stubFeed.addRound(100, now + seconds(1));
      await stubFeed.addRound(101, now + seconds(2));
      await stubFeed.addRound(102, now + seconds(3));

      try {
        await oracleIterator.getUnderlingValue.call(aggregatorProxy.address, now + seconds(3), [makeRoundIdForPhase1(1)])
        assert.fail();
      } catch (err) {
        assert.ok(/revert Later round exists/.test(err.message));
      }
    });
  });

  describe(' with many phases ', function () {
    let stubFeed1, stubFeed2, stubFeed3, aggregatorProxy;

    beforeEach(async () => {
      stubFeed1 = await StubFeed.new();
      stubFeed2 = await StubFeed.new();
      stubFeed3 = await StubFeed.new();
      aggregatorProxy = await AggregatorProxy.new(stubFeed1.address);
      await aggregatorProxy.proposeAggregator(stubFeed2.address);
      await aggregatorProxy.confirmAggregator(stubFeed2.address);
      await aggregatorProxy.proposeAggregator(stubFeed3.address);
      await aggregatorProxy.confirmAggregator(stubFeed3.address);
    });

    it("...should revert if not latest phase in hint.", async () => {
      const now = Math.floor(Date.now() / 1000);

      await stubFeed1.addRound(101, now);
      await stubFeed1.addRound(110, now + seconds(2));
      await stubFeed2.addRound(102, now + seconds(1));
      await stubFeed2.addRound(120, now + seconds(3));
      await stubFeed3.addRound(1031, now);
      await stubFeed3.addRound(1032, now + seconds(4));

      try {
        await oracleIterator.getUnderlingValue.call(aggregatorProxy.address, now + seconds(1), [makeRoundIdForPhase1(2)])
        assert.fail();
      } catch (err) {
        assert.ok(/revert Wrong hint phase/.test(err.message));
      }
    });

    it("...should return answer if next round existed.", async () => {
      const now = Math.floor(Date.now() / 1000);

      await stubFeed1.addRound(101, now);
      await stubFeed1.addRound(110, now + seconds(2));
      await stubFeed2.addRound(102, now + seconds(1));
      await stubFeed2.addRound(120, now + seconds(3));
      await stubFeed3.addRound(1031, now);
      await stubFeed3.addRound(1032, now + seconds(4));

      assert.equal(1031,
        await oracleIterator.getUnderlingValue.call(
          aggregatorProxy.address,
          now + seconds(1),
          [
            makeRoundIdForPhase3(1),
          ]));
    });

    it("...should return answer if next round absent.", async () => {
      const now = Math.floor(Date.now() / 1000);

      await stubFeed1.addRound(101, now);
      await stubFeed1.addRound(110, now + seconds(2));
      await stubFeed2.addRound(102, now + seconds(1));
      await stubFeed3.addRound(1031, now);

      assert.equal(1031,
        await oracleIterator.getUnderlingValue.call(
          aggregatorProxy.address,
          now + seconds(1),
          [
            makeRoundIdForPhase3(1),
          ]));
    });

    it("...should return answer if last round with right timestamp.", async () => {
      const now = Math.floor(Date.now() / 1000);

      await stubFeed1.addRound(1011, now + seconds(1));
      await stubFeed1.addRound(1012, now + seconds(2));
      await stubFeed1.addRound(1013, now + seconds(4));

      await stubFeed2.addRound(1021, now + seconds(1));
      await stubFeed2.addRound(1022, now + seconds(2));
      await stubFeed2.addRound(1023, now + seconds(5));

      await stubFeed3.addRound(1031, now + seconds(1));
      await stubFeed3.addRound(1032, now + seconds(2));
      await stubFeed3.addRound(1033, now + seconds(3));

      assert.equal(1033,
        (await oracleIterator.getUnderlingValue.call(
          aggregatorProxy.address,
          now + seconds(3),
          [
            makeRoundIdForPhase3(3),
          ])).toString());
    });

    it("...should return answer if pre-last round with right timestamp.", async () => {
      const now = Math.floor(Date.now() / 1000);

      await stubFeed1.addRound(1011, now + seconds(0));
      await stubFeed1.addRound(1012, now + seconds(1));
      await stubFeed1.addRound(1013, now + seconds(3));

      await stubFeed2.addRound(1021, now + seconds(1));
      await stubFeed2.addRound(1022, now + seconds(2));
      await stubFeed2.addRound(1023, now + seconds(3));

      await stubFeed3.addRound(1031, now + seconds(0));
      await stubFeed3.addRound(1032, now + seconds(1));
      await stubFeed3.addRound(1033, now + seconds(3));

      assert.equal(1032,
        (await oracleIterator.getUnderlingValue.call(aggregatorProxy.address, now + seconds(2),
          [
            makeRoundIdForPhase3(2)
          ])).toString());
    });
  });
});
