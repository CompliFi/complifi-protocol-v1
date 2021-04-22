const truffleAssert = require("truffle-assertions");

const OracleIteratorRegistry = artifacts.require("OracleIteratorRegistry");
const ChainlinkOracleIterator = artifacts.require("ChainlinkOracleIterator");
const StubFeed = artifacts.require("StubFeed");
const AggregatorProxy = artifacts.require("AggregatorProxy");

const FRACTION_MULTIPLIER = Math.pow(10, 12);
const ITERATIONS = 24;
const NEGATIVE_INFINITY =
  "-57896044618658097711785492504343953926634992332820282019728792003956564819968";

const seconds = (amount) => amount;
const minutes = (amount) => amount * seconds(60);
const hours = (amount) => amount * minutes(60);
const days = (amount) => amount * hours(24);
const months = (amount) => amount * days(30);

const makeRoundIdForPhase = (phaseId, roundId) =>
  web3.utils.toBN(phaseId).shln(64).add(web3.utils.toBN(roundId)).toString();

const makeRoundIdForPhase1 = (roundId) => makeRoundIdForPhase(1, roundId);
const makeRoundIdForPhase2 = (roundId) => makeRoundIdForPhase(2, roundId);
const makeRoundIdForPhase3 = (roundId) => makeRoundIdForPhase(3, roundId);

contract("Chainlink Oracle Iterator", (accounts) => {
  let oracleIterator;

  before(async () => {
    const registry = await OracleIteratorRegistry.deployed();
    const address = await registry.get.call(
      web3.utils.keccak256("ChainlinkIterator")
    );
    oracleIterator = await ChainlinkOracleIterator.at(address);
  });

  describe(" with one phase ", function () {
    let stubFeed, aggregatorProxy;

    beforeEach(async () => {
      stubFeed = await StubFeed.new();
      aggregatorProxy = await AggregatorProxy.new(stubFeed.address);
    });

    it("...should revert if incorrect hints amount.", async () => {
      const now = Math.floor(Date.now() / 1000);

      await stubFeed.addRound(100, now);

      await truffleAssert.reverts(
        oracleIterator.getUnderlyingValue.call(
          aggregatorProxy.address,
          now + seconds(1),
          []
        ),
        "Wrong number of hints"
      );

      await truffleAssert.reverts(
        oracleIterator.getUnderlyingValue.call(
          aggregatorProxy.address,
          now + seconds(1),
          [makeRoundIdForPhase1(1), makeRoundIdForPhase1(1)]
        ),
        "Wrong number of hints"
      );
    });

    it("...should revert if feed empty.", async () => {
      const now = Math.floor(Date.now() / 1000);

      await truffleAssert.reverts(
        oracleIterator.getUnderlyingValue.call(
          aggregatorProxy.address,
          now + seconds(1),
          [makeRoundIdForPhase1(1)]
        ),
        "No data present"
      );
    });

    it("...should return answer if next round existed.", async () => {
      const now = Math.floor(Date.now() / 1000);

      await stubFeed.addRound(100, now);
      await stubFeed.addRound(101, now + seconds(2));

      assert.equal(
        100,
        await oracleIterator.getUnderlyingValue.call(
          aggregatorProxy.address,
          now + seconds(1),
          [makeRoundIdForPhase1(1)]
        )
      );
    });

    it("...should return answer if next round absent.", async () => {
      const now = Math.floor(Date.now() / 1000);

      await stubFeed.addRound(200, now);

      assert.equal(
        200,
        await oracleIterator.getUnderlyingValue.call(
          aggregatorProxy.address,
          now + seconds(2),
          [makeRoundIdForPhase1(1)]
        )
      );
    });

    it("...should revert if all rounds in future.", async () => {
      const now = Math.floor(Date.now() / 1000);

      await stubFeed.addRound(100, now + seconds(1));
      await stubFeed.addRound(101, now + seconds(2));

      await truffleAssert.reverts(
        oracleIterator.getUnderlyingValue.call(aggregatorProxy.address, now, [
          makeRoundIdForPhase1(1),
        ]),
        "Incorrect hint"
      );
    });

    it("...should return answer if last round with right timestamp.", async () => {
      const now = Math.floor(Date.now() / 1000);

      await stubFeed.addRound(100, now + seconds(1));
      await stubFeed.addRound(101, now + seconds(2));
      await stubFeed.addRound(102, now + seconds(3));

      assert.equal(
        102,
        (
          await oracleIterator.getUnderlyingValue.call(
            aggregatorProxy.address,
            now + seconds(3),
            [makeRoundIdForPhase1(3)]
          )
        ).toString()
      );
    });

    it("...should return answer if pre-last round with right timestamp.", async () => {
      const now = Math.floor(Date.now() / 1000);

      await stubFeed.addRound(100, now + seconds(1));
      await stubFeed.addRound(101, now + seconds(2));
      await stubFeed.addRound(102, now + seconds(3));

      assert.equal(
        101,
        (
          await oracleIterator.getUnderlyingValue.call(
            aggregatorProxy.address,
            now + seconds(2),
            [makeRoundIdForPhase1(2)]
          )
        ).toString()
      );
    });

    it("...should return iterated answer from single round.", async () => {
      const now = Math.floor(Date.now() / 1000);

      await stubFeed.addRound(200, now + seconds(1));

      assert.equal(
        200,
        await oracleIterator.getUnderlyingValue.call(
          aggregatorProxy.address,
          now + seconds(2),
          [0]
        )
      );
    });

    it("...should return iterated answer from three rounds.", async () => {
      const now = Math.floor(Date.now() / 1000);

      await stubFeed.addRound(231, now);
      await stubFeed.addRound(199, now + seconds(3));
      await stubFeed.addRound(200, now + seconds(4));

      assert.equal(
        231,
        await oracleIterator.getUnderlyingValue.call(
          aggregatorProxy.address,
          now + seconds(2),
          [0]
        )
      );
    });

    it("...should return iterated answer from four rounds.", async () => {
      const now = Math.floor(Date.now() / 1000);

      await stubFeed.addRound(231, now);
      await stubFeed.addRound(203, now + seconds(1));
      await stubFeed.addRound(199, now + seconds(3));
      await stubFeed.addRound(200, now + seconds(4));

      assert.equal(
        203,
        await oracleIterator.getUnderlyingValue.call(
          aggregatorProxy.address,
          now + seconds(2),
          [0]
        )
      );
    });

    it("...should return iterated answer NEGATIVE_INFINITY.", async () => {
      const now = Math.floor(Date.now() / 1000);

      for (let i = 0; i < ITERATIONS + 1; ++i) {
        await stubFeed.addRound(i, now + seconds(i));
      }
      assert.equal(
        NEGATIVE_INFINITY,
        await oracleIterator.getUnderlyingValue.call(
          aggregatorProxy.address,
          now,
          [0]
        )
      );
    });

    it("...should correctly iterate over rounds.", async () => {
      const now = Math.floor(Date.now() / 1000);

      for (let i = 0; i < ITERATIONS; ++i) {
        await stubFeed.addRound(i, now + seconds(i));
      }
      assert.equal(
        0,
        await oracleIterator.getUnderlyingValue.call(
          aggregatorProxy.address,
          now,
          [0]
        )
      );
    });

    it("...should iterate and return result with hinted answer.", async () => {
      const now = Math.floor(Date.now() / 1000);

      for (let i = 0; i < 24; ++i) {
        await stubFeed.addRound(i + 3, now + seconds(i));
      }
      assert.equal(
        3,
        await oracleIterator.getUnderlyingValue.call(
          aggregatorProxy.address,
          now,
          [makeRoundIdForPhase1(1)]
        )
      );
    });

    it("...should return hinted answer after iterated failed.", async () => {
      const now = Math.floor(Date.now() / 1000);

      await stubFeed.addRound(0, now);
      for (let i = 1; i <= 24; ++i) {
        await stubFeed.addRound(i, now + seconds(i));
      }
      assert.equal(
        0,
        await oracleIterator.getUnderlyingValue.call(
          aggregatorProxy.address,
          now,
          [makeRoundIdForPhase1(1)]
        )
      );
    });
  });

  describe(" with many phases ", function () {
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

    it("...should return answer if next round existed.", async () => {
      const now = Math.floor(Date.now() / 1000);

      await stubFeed1.addRound(101, now);
      await stubFeed1.addRound(110, now + seconds(2));
      await stubFeed2.addRound(102, now + seconds(1));
      await stubFeed2.addRound(120, now + seconds(3));
      await stubFeed3.addRound(1031, now);
      await stubFeed3.addRound(1032, now + seconds(4));

      assert.equal(
        1031,
        await oracleIterator.getUnderlyingValue.call(
          aggregatorProxy.address,
          now + seconds(1),
          [makeRoundIdForPhase3(1)]
        )
      );
    });

    it("...should return answer if next round absent.", async () => {
      const now = Math.floor(Date.now() / 1000);

      await stubFeed1.addRound(101, now);
      await stubFeed1.addRound(110, now + seconds(2));
      await stubFeed2.addRound(102, now + seconds(1));
      await stubFeed3.addRound(1031, now);

      assert.equal(
        1031,
        await oracleIterator.getUnderlyingValue.call(
          aggregatorProxy.address,
          now + seconds(1),
          [makeRoundIdForPhase3(1)]
        )
      );
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

      assert.equal(
        1033,
        (
          await oracleIterator.getUnderlyingValue.call(
            aggregatorProxy.address,
            now + seconds(3),
            [makeRoundIdForPhase3(3)]
          )
        ).toString()
      );
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

      assert.equal(
        1032,
        (
          await oracleIterator.getUnderlyingValue.call(
            aggregatorProxy.address,
            now + seconds(2),
            [makeRoundIdForPhase3(2)]
          )
        ).toString()
      );
    });
  });
});
