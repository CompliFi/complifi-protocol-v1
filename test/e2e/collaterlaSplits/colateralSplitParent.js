const truffleAssert = require("truffle-assertions");

const {
  constants, // Common constants, like the zero address and largest integers
} = require("@openzeppelin/test-helpers");

const CollateralSplitRegistry = artifacts.require("CollateralSplitRegistry");
const StubCollateralSplit = artifacts.require("StubCollateralSplit");

const FRACTION_MULTIPLIER = Math.pow(10, 12);

contract("Collateral Split Parent", (accounts) => {
  let collateralSplit;

  beforeEach(async () => {
    const registry = await CollateralSplitRegistry.deployed();
    const address = await registry.get.call(web3.utils.keccak256("Insur"));
    collateralSplit = await StubCollateralSplit.at(address);
  });

  it("...should normalize u value.", async () => {
    assert.equal(await collateralSplit.normalize.call(100, 100), 0);
    assert.equal(
      await collateralSplit.normalize.call(100, 200),
      ((200 - 100) * FRACTION_MULTIPLIER) / 100
    );
    assert.equal(
      await collateralSplit.normalize.call(200, 100),
      ((100 - 200) * FRACTION_MULTIPLIER) / 200
    );
  });

  it("...should normalize fail if u_0 NEGATIVE_INFINITY.", async () => {
    await truffleAssert.reverts(
      collateralSplit.normalize.call(constants.MIN_INT256, 100),
      "u_0 is absent"
    );
  });

  it("...should normalize fail if u_T NEGATIVE_INFINITY.", async () => {
    await truffleAssert.reverts(
      collateralSplit.normalize.call(100, constants.MIN_INT256),
      "u_T is absent"
    );
  });

  it("...should normalize fail if u_0 is zero or negative.", async () => {
    await truffleAssert.reverts(
      collateralSplit.normalize.call(0, 100),
      "u_0 is less or equal zero"
    );

    await truffleAssert.reverts(
      collateralSplit.normalize.call(-100, 100),
      "u_0 is less or equal zero"
    );
  });
});
