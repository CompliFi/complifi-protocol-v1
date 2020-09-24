const OracleIteratorRegistry = artifacts.require("OracleIteratorRegistry");
const ChainlinkOracleIterator = artifacts.require("ChainlinkOracleIterator");
const StubFeed = artifacts.require("StubFeed");

const FRACTION_MULTIPLIER = Math.pow(10, 12);
const NEGATIVE_INFINITY = "-57896044618658097711785492504343953926634992332820282019728792003956564819968";

const seconds = (amount) => amount;
const minutes = (amount) => amount * seconds(60);
const hours = (amount) => amount * minutes(60);
const days = (amount) => amount * hours(24);
const months = (amount) => amount * days(30);

contract("Chainlink Oracle Iterator", accounts => {
  let oracleIterator, stubFeed;

  beforeEach(async () => {
    stubFeed = await StubFeed.new();

    const registry = await OracleIteratorRegistry.deployed();
    const address = await registry.get.call(web3.utils.keccak256("ChainlinkIterator"));
    oracleIterator = await ChainlinkOracleIterator.at(address);
  });

  it("...should revert if feed empty.", async () => {
    const vaultCreated = Math.floor(Date.now() / 1000);

    try {
      await oracleIterator.getUnderlingValue.call(stubFeed.address, vaultCreated + seconds(1), 0)
      assert.fail();
    } catch (err) {
      assert.ok(/revert/.test(err.message));
    }
  });

  it("...should return needed answer iterated.", async () => {
    const vaultCreated = Math.floor(Date.now() / 1000);

    await stubFeed.addRound(100, vaultCreated);

    assert.equal(100, await oracleIterator.getUnderlingValue.call(stubFeed.address, vaultCreated + seconds(1), 0));
  });

  it("...should return negative infinity if there is no needed data.", async () => {
    const vaultCreated = Math.floor(Date.now() / 1000);

    await stubFeed.addRound(100, vaultCreated + seconds(1));

    assert.equal(NEGATIVE_INFINITY, (await oracleIterator.getUnderlingValue.call(stubFeed.address, vaultCreated, 0)).toString());
  });

  it("...should return answer by hint for last round.", async () => {
    const vaultCreated = Math.floor(Date.now() / 1000);

    await stubFeed.addRound(100, vaultCreated + seconds(1));
    await stubFeed.addRound(101, vaultCreated + seconds(2));
    await stubFeed.addRound(102, vaultCreated + seconds(3));

    assert.equal(102, (await oracleIterator.getUnderlingValue.call(stubFeed.address, vaultCreated + seconds(3), 2)).toString());
  });

  it("...should return answer by hint for pre-last round.", async () => {
    const vaultCreated = Math.floor(Date.now() / 1000);

    await stubFeed.addRound(100, vaultCreated + seconds(1));
    await stubFeed.addRound(101, vaultCreated + seconds(2));
    await stubFeed.addRound(102, vaultCreated + seconds(3));

    assert.equal(101, (await oracleIterator.getUnderlingValue.call(stubFeed.address, vaultCreated + seconds(2), 1)).toString());
  });

  it("...should revert by hint for pre-last round.", async () => {
    const vaultCreated = Math.floor(Date.now() / 1000);

    await stubFeed.addRound(100, vaultCreated + seconds(1));
    await stubFeed.addRound(101, vaultCreated + seconds(2));
    await stubFeed.addRound(102, vaultCreated + seconds(3));

    try {
      await oracleIterator.getUnderlingValue.call(stubFeed.address, vaultCreated + seconds(3), 1)
      assert.fail();
    } catch (err) {
      assert.ok(/revert Incorrect hint/.test(err.message));
    }
  });
});
