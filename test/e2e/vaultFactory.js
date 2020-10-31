const Vault = artifacts.require("Vault");
const VaultFactory = artifacts.require("VaultFactory");
const VaultFactoryProxy = artifacts.require("VaultFactoryProxy");

const CollateralTokenRegistry = artifacts.require("CollateralTokenRegistry");
const CollateralSplitRegistry = artifacts.require("CollateralSplitRegistry");
const DerivativeSpecificationRegistry = artifacts.require("DerivativeSpecificationRegistry");
const OracleRegistry = artifacts.require("OracleRegistry");
const OracleIteratorRegistry = artifacts.require("OracleIteratorRegistry");
const TokenBuilder = artifacts.require("TokenBuilder");

const StubToken = artifacts.require("StubToken");
const StubFeed = artifacts.require("StubFeed");
const StubDerivative = artifacts.require("StubDerivative");

contract("VaultFactory", accounts => {
  let vaultFactory;
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
  });

  it("...should be initialised.", async () => {
    assert.equal(await vaultFactory.collateralTokenRegistry.call(), (await CollateralTokenRegistry.deployed()).address);
    assert.equal(await vaultFactory.collateralSplitRegistry.call(), (await CollateralSplitRegistry.deployed()).address);
    assert.equal(await vaultFactory.derivativeSpecificationRegistry.call(), (await DerivativeSpecificationRegistry.deployed()).address);
    assert.equal(await vaultFactory.oracleRegistry.call(), (await OracleRegistry.deployed()).address);
    assert.equal(await vaultFactory.oracleIteratorRegistry.call(), (await OracleIteratorRegistry.deployed()).address);
    assert.equal(await vaultFactory.tokenBuilder.call(), (await TokenBuilder.deployed()).address);

    assert.equal(await vaultFactory.feeWallet.call(), accounts[0]);
  });

  it("...should create a vault for STUB derivative.", async () => {
    const derivativeCreated = Math.floor(Date.now() / 1000);
    await vaultFactory.createVault(web3.utils.keccak256("STUB"), derivativeCreated);

    const vault = await vaultFactory.getVault.call(0);

    const vaultInstance = await Vault.at(vault);
    await vaultInstance.initialize();
  });
});
