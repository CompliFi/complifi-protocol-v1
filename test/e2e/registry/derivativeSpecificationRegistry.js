const truffleAssert = require("truffle-assertions");

const VaultFactory = artifacts.require("VaultFactory");
const VaultFactoryProxy = artifacts.require("VaultFactoryProxy");
const DerivativeSpecification = artifacts.require("DerivativeSpecification");

const FRACTION_MULTIPLIER = Math.pow(10, 12);

const setDerivativeSpecification = async (vaultFactory, symbol, params) => {
  const derivative = await DerivativeSpecification.new(...params);
  return await vaultFactory.setDerivativeSpecification(derivative.address);
};

contract("DerivativeSpecificationRegistry", (accounts) => {
  it("...should revert on the same params or even one param.", async () => {
    const vaultFactory = await VaultFactory.at(
      (await VaultFactoryProxy.deployed()).address
    );

    // unique params
    const oracles = [web3.utils.keccak256("0xAAAAA")];
    const iterators = [web3.utils.keccak256("Iterator")];
    const collateral = web3.utils.keccak256("0xBBBBB");
    const split = web3.utils.keccak256("Split");
    const live = 45 * 60;
    const nominalPrimary = 1;
    const nominalComplement = 1;
    const commission = 0.001 * FRACTION_MULTIPLIER;

    // alternative param
    const commissionOther = 0;

    await setDerivativeSpecification(vaultFactory, "TEST1", [
      accounts[0],
      "Test Leveraged Token",
      "TEST1",
      oracles,
      iterators,
      collateral,
      split,
      live,
      nominalPrimary,
      nominalComplement,
      commission,
      "",
    ]);

    await truffleAssert.reverts(
      setDerivativeSpecification(vaultFactory, "TEST2", [
        accounts[0],
        "Test Leveraged Token",
        "TEST2",
        oracles,
        iterators,
        collateral,
        split,
        live,
        nominalPrimary,
        nominalComplement,
        commission,
        "",
      ]),
      "Same spec params"
    );

    await setDerivativeSpecification(vaultFactory, "TEST3", [
      accounts[0],
      "Test Leveraged Token",
      "TEST3",
      oracles,
      iterators,
      collateral,
      split,
      live,
      nominalPrimary,
      nominalComplement,
      commissionOther,
      "",
    ]);

    await truffleAssert.reverts(
      setDerivativeSpecification(vaultFactory, "TEST4", [
        accounts[0],
        "Test Leveraged Token",
        "TEST4",
        oracles,
        iterators,
        collateral,
        split,
        live,
        nominalPrimary,
        nominalComplement,
        commissionOther,
        "",
      ]),
      "Same spec params"
    );
  });
});
