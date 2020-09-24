const StubToken = artifacts.require("StubToken");
const StubFeed = artifacts.require("StubFeed");

const VaultFactoryProxy = artifacts.require("VaultFactoryProxy");
const VaultFactory = artifacts.require("VaultFactory");

module.exports = async (done) => {
  const networkType = await web3.eth.net.getNetworkType();
  const networkId = await web3.eth.net.getId();
  const accounts = await web3.eth.getAccounts();
  console.log("network type:" + networkType);
  console.log("network id:" + networkId);
  console.log("accounts:" + accounts);

  try {
    console.log("Creating Stub Collaterals... ");
    const vaultFactoryAddress = (await VaultFactoryProxy.deployed()).address;
    const vaultFactory = await VaultFactory.at(vaultFactoryAddress);

    const setCollateralToken = async (symbol) => {
      const stubToken = await StubToken.new("Stub " + symbol, symbol, 0);
      console.log("Created stub collateral token " + symbol + " " + stubToken.address);
      await vaultFactory.setCollateralToken(web3.utils.keccak256(stubToken.address), stubToken.address);
      console.log("Set stub collateral token " + symbol + " " + stubToken.address);
    }

    await setCollateralToken("WETH");
    await setCollateralToken("USDC");
    await setCollateralToken("USDT");
    await setCollateralToken("WBTC");
    await setCollateralToken("LINK");

    const setOracle = async (symbol) => {
      const stubFeed = await StubFeed.new();
      console.log("Created stub feed " + symbol + " " + stubFeed.address);
      await vaultFactory.setOracle(web3.utils.keccak256(stubFeed.address), stubFeed.address);
      console.log("Set stub feed " + symbol + " " + stubFeed.address);
    }

    // https://docs.chain.link/docs/reference-contracts
    await setOracle("ETH-USD");
    await setOracle("BTC-USD");
    await setOracle("DAI-USD");
    await setOracle("EUR-USD");
    await setOracle("GBP-USD");
    await setOracle("JPY-USD");
    await setOracle("XAU-USD");
    await setOracle("N225-JPY");
    await setOracle("FTSE-GBP");
    await setOracle("FASTGAS");
    await setOracle("LINK-USD");
  } catch(e) {
    console.log(e);
    done(e);
    return;
  }

  done();
};
