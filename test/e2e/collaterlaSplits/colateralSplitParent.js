const CollateralSplitRegistry = artifacts.require("CollateralSplitRegistry");
const StubCollateralSplit = artifacts.require("StubCollateralSplit");

const FRACTION_MULTIPLIER = Math.pow(10, 12);
const NEGATIVE_INFINITY = "-57896044618658097711785492504343953926634992332820282019728792003956564819968";

contract("Collateral Split Parent", accounts => {
  let collateralSplit;

  beforeEach(async () => {
    const registry = await CollateralSplitRegistry.deployed();
    const address = await registry.get.call(web3.utils.keccak256("Insur"));
    collateralSplit = await StubCollateralSplit.at(address);
  });

  it("...should normalize u value.", async () => {
    assert.equal(await collateralSplit.normalize.call(100, 100), 0);
    assert.equal(await collateralSplit.normalize.call(100, 200), (200 - 100) * FRACTION_MULTIPLIER / 100);
    assert.equal(await collateralSplit.normalize.call(200, 100), (100 - 200) * FRACTION_MULTIPLIER / 200);
  });

  it("...should normalize fail if u_0 NEGATIVE_INFINITY.", async () => {
    try {
      await collateralSplit.normalize.call(NEGATIVE_INFINITY, 100);
      assert.fail();
    } catch (err) {
      assert.ok(/revert u_0 is absent/.test(err.message));
    }
  });

  it("...should normalize fail if u_T NEGATIVE_INFINITY.", async () => {
    try {
      await collateralSplit.normalize.call(100, NEGATIVE_INFINITY);
      assert.fail();
    } catch (err) {
      assert.ok(/revert u_T is absent/.test(err.message));
    }
  });

  it("...should normalize fail if u_0 is zero or negative.", async () => {
    try {
      await collateralSplit.normalize.call(0, 100);
      assert.fail();
    } catch (err) {
      assert.ok(/revert u_0 is less or equal zero/.test(err.message));
    }

    try {
      await collateralSplit.normalize.call(-100, 100);
      assert.fail();
    } catch (err) {
      assert.ok(/revert u_0 is less or equal zero/.test(err.message));
    }
  });
});
