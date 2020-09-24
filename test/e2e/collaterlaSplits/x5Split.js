const CollateralSplitRegistry = artifacts.require("CollateralSplitRegistry");
const StubCollateralSplit = artifacts.require("StubCollateralSplit");

const FRACTION_MULTIPLIER = Math.pow(10, 12);

contract("x5 Derivatives", accounts => {
  let collateralSplit;

  beforeEach(async () => {
    const registry = await CollateralSplitRegistry.deployed();
    const address = await registry.get.call(web3.utils.keccak256("x5"));
    collateralSplit = await StubCollateralSplit.at(address);
  });

  it("...should calculate split function.", async () => {
    const callContract = async (value) => await callDerivative(collateralSplit.splitNominalValue, value);

    assert.equal(await callContract(-0.9999), 0, "-0.9999");
    assert.equal(await callContract(-0.8), 0, "-0.8");
    assert.equal(await callContract(-0.6), 0, "-0.6");
    assert.equal(await callContract(-0.5), 0, "-0.5");
    assert.equal(await callContract(-0.4), 0, "-0.4");
    assert.equal(await callContract(-0.2), 0, "-0.2");
    assert.equal(await callContract(-0.1), calcSplit(-0.1), "-0.1");
    assert.equal(await callContract(-0.0099), calcSplit(-0.0099), "-0.0099");
    assert.equal(await callContract(0), calcSplit(0), "0");
    assert.equal(await callContract(0.0099), calcSplit(0.0099), "0.0099");
    assert.equal(await callContract(0.1), calcSplit(0.1), "0.1");
    assert.equal(await callContract(0.2), FRACTION_MULTIPLIER, "0.2");
    assert.equal(await callContract(0.3), FRACTION_MULTIPLIER, "0.3");
    assert.equal(await callContract(0.5), FRACTION_MULTIPLIER, "0.5");
    assert.equal(await callContract(0.7), FRACTION_MULTIPLIER, "0.7");
    assert.equal(await callContract(0.9999), FRACTION_MULTIPLIER, "0.9999");
  });
});

function calcSplit(value) {
  return trunc4((FRACTION_MULTIPLIER + value *  FRACTION_MULTIPLIER * 5) / 2) // (1+5*U) / 2

}
function trunc4(value) {
  return Math.trunc(value)
}

async function callDerivative(func, value){
  return (await func.call(value * FRACTION_MULTIPLIER)).toNumber();
}
