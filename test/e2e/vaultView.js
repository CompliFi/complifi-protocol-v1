const Vault = artifacts.require("Vault");
const VaultView = artifacts.require("VaultView");
const VaultFactory = artifacts.require("VaultFactory");
const VaultFactoryProxy = artifacts.require("VaultFactoryProxy");

const StubToken = artifacts.require("StubToken");
const StubFeed = artifacts.require("StubFeed");
const StubDerivative = artifacts.require("StubDerivative");

contract("VaultView", accounts => {
  let vaultFactory;
  let vaultView;
  before(async () => {
    vaultFactory = await VaultFactory.at((await VaultFactoryProxy.deployed()).address);

    let stubFeed = await StubFeed.new();
    await vaultFactory.setOracle(stubFeed.address);

    let collateralToken = await StubToken.new("Stub", "STUB", 0);
    await vaultFactory.setCollateralToken(collateralToken.address);

    const specification = await StubDerivative.new(
      [web3.utils.keccak256(stubFeed.address)],
      [web3.utils.keccak256("ChainlinkIterator")],
      web3.utils.keccak256(collateralToken.address),
      {from: accounts[0]});
    await vaultFactory.setDerivativeSpecification(specification.address);

    vaultView = await VaultView.new();
  });

  it("...should return vault config.", async () => {
    const derivativeLive = Math.floor(Date.now() / 1000);
    await vaultFactory.createVault(web3.utils.keccak256("STUB"), derivativeLive);

    const vault = await vaultFactory.getVault.call(0);

    const vaultInstance = await Vault.at(vault);

    await vaultInstance.initialize([100]);

    console.log(JSON.stringify(await vaultView.getVaultInfo.call(vault)));
  });
});
