const CollateralSplitRegistry = artifacts.require("CollateralSplitRegistry");
const StubCollateralSplit = artifacts.require("StubCollateralSplit");

const FRACTION_MULTIPLIER = Math.pow(10, 12);

contract("Call Option Derivatives", accounts => {
  let collateralSplit;

  beforeEach(async () => {
    const registry = await CollateralSplitRegistry.deployed();
    const address = await registry.get.call(web3.utils.keccak256("CallOption"));
    collateralSplit = await StubCollateralSplit.at(address);
  });

  it("...should calculate split function.", async () => {
    const callContract = async (value) => await callDerivative(collateralSplit.splitNominalValue, value);

    assert.equal(await callContract(-1), 0, "-1");
    assert.equal(await callContract(-0.9999), 0, "-0.9999");
    assert.equal(await callContract(-0.6), 0, "-0.6");
    assert.equal(await callContract(-0.5), 0, "-0.5");
    assert.equal(await callContract(-0.4), 0, "-0.4");
    assert.equal(await callContract(-0.3), 0, "-0.3");
    assert.equal(await callContract(-0.2), 0, "-0.2");
    assert.equal(await callContract(-0.1), 0, "-0.1");
    assert.equal(await callContract(-0.01), 0, "-0.01");

    assert.equal(await callContract(0),  calcSplit(0), "0");
    assert.equal(await callContract(0.3), calcSplit(0.3), "0.3");
    assert.equal(await callContract(0.5), calcSplit(0.5), "0.5");
    assert.equal(await callContract(0.9999), calcSplit(0.9999), "0.9999");
    assert.equal(await callContract(0.4), calcSplit(0.4), "0.4");
    assert.equal(await callContract(0.2), calcSplit(0.2), "0.2");
    assert.equal(await callContract(0.1), calcSplit(0.1), "0.1");
    assert.equal(await callContract(0.01), calcSplit(0.01), "0.01");
    assert.equal(await callContract(1), calcSplit(1), "1");
    assert.equal(await callContract(10), calcSplit(10), "10");
  });
});

function calcSplit(value) {
  return trunc4(value / (1 + value));
}

function trunc4(value) {
  return Math.trunc(value * FRACTION_MULTIPLIER) / FRACTION_MULTIPLIER
}

async function callDerivative(func, value){
  return await func.call(value * FRACTION_MULTIPLIER) / FRACTION_MULTIPLIER;
}
