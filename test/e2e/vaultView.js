const Vault = artifacts.require("Vault");
const VaultView = artifacts.require("VaultView");
const VaultFactory = artifacts.require("VaultFactory");
const VaultFactoryProxy = artifacts.require("VaultFactoryProxy");

const StubToken = artifacts.require("StubToken");
const StubFeed = artifacts.require("StubFeed");
const StubDerivative = artifacts.require("StubDerivative");

contract("VaultView", (accounts) => {
  let vaultFactory;
  let vaultView;
  let collateralToken;
  before(async () => {
    vaultFactory = await VaultFactory.at(
      (await VaultFactoryProxy.deployed()).address
    );

    let stubFeed = await StubFeed.new();
    await vaultFactory.setOracle(stubFeed.address);

    collateralToken = await StubToken.new("Stub", "STUB", 0);
    await vaultFactory.setCollateralToken(collateralToken.address);

    const specification = await StubDerivative.new(
      [web3.utils.keccak256(stubFeed.address)],
      [web3.utils.keccak256("ChainlinkIterator")],
      web3.utils.keccak256(collateralToken.address),
      { from: accounts[0] }
    );
    await vaultFactory.setDerivativeSpecification(specification.address);

    vaultView = await VaultView.new();
  });

  it("...should return vault config.", async () => {
    const derivativeLive = Math.floor(Date.now() / 1000);
    await vaultFactory.createVault(
      web3.utils.keccak256("STUB"),
      derivativeLive
    );
    const lastVaultIndex = await vaultFactory.getLastVaultIndex.call();
    const vault = await vaultFactory.getVault.call(lastVaultIndex);

    const vaultInstance = await Vault.at(vault);

    await vaultInstance.initialize([100]);

    const userBalance = 1000;
    await collateralToken.mint(accounts[0], userBalance);
    const data = await vaultView.getVaultInfo.call(vault, accounts[0]);
    console.log(JSON.stringify(data));
    assert.equal(data["collateralData"]["userBalance"], userBalance);
  });

  it("...should return vault config for 0x0 sender.", async () => {
    const derivativeLive = Math.floor(Date.now() / 1000);
    await vaultFactory.createVault(
      web3.utils.keccak256("STUB"),
      derivativeLive
    );
    const lastVaultIndex = await vaultFactory.getLastVaultIndex.call();
    const vault = await vaultFactory.getVault.call(lastVaultIndex);

    const vaultInstance = await Vault.at(vault);

    await vaultInstance.initialize([100]);

    const userBalance = 1000;
    await collateralToken.mint(accounts[0], userBalance);
    const data = await vaultView.getVaultInfo.call(
      vault,
      "0x0000000000000000000000000000000000000000"
    );
    console.log(JSON.stringify(data));
    assert.equal(data["collateralData"]["userBalance"], 0);
  });
});
