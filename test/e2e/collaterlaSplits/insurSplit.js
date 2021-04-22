const CollateralSplitRegistry = artifacts.require("CollateralSplitRegistry");
const StubCollateralSplit = artifacts.require("StubCollateralSplit");

const FRACTION_MULTIPLIER = Math.pow(10, 12);

contract("Insure Derivatives", (accounts) => {
  let collateralSplit;

  beforeEach(async () => {
    const registry = await CollateralSplitRegistry.deployed();
    const address = await registry.get.call(web3.utils.keccak256("Insur"));
    collateralSplit = await StubCollateralSplit.at(address);
  });

  it("...should calculate split function.", async () => {
    const callContract = async (value) =>
      await callDerivative(collateralSplit.splitNominalValue, value);

    assert.equal(await callContract(-1), 1, "-1");
    assert.equal(await callContract(-0.9999), 1, "-0.9999");
    assert.equal(await callContract(-0.6), 1, "-0.6");
    assert.equal(await callContract(-0.5), 1, "-0.5");

    assert.equal(await callContract(0), 0.5, "0");
    assert.equal(await callContract(0.3), 0.5, "0.3");
    assert.equal(await callContract(0.5), 0.5, "0.5");
    assert.equal(await callContract(0.9999), 0.5, "0.9999");
    assert.equal(await callContract(1), 0.5, "1");
    assert.equal(await callContract(10), 0.5, "10");

    assert.equal(await callContract(-0.4), calcSplit(-0.4), "-0.4");
    assert.equal(await callContract(-0.3), calcSplit(-0.3), "-0.3");
    assert.equal(await callContract(-0.2), calcSplit(-0.2), "-0.2");
    assert.equal(await callContract(-0.1), calcSplit(-0.1), "-0.1");
    assert.equal(await callContract(-0.01), calcSplit(-0.01), "-0.01");
  });
});

function calcSplit(value) {
  return trunc4(1 / (2 * (1 + value)));
}

function trunc4(value) {
  return Math.trunc(value * FRACTION_MULTIPLIER) / FRACTION_MULTIPLIER;
}

async function callDerivative(func, value) {
  return (await func.call(value * FRACTION_MULTIPLIER)) / FRACTION_MULTIPLIER;
}
