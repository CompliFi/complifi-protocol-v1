const VaultFactory = artifacts.require("VaultFactory");
const VaultFactoryProxy = artifacts.require("VaultFactoryProxy");

const config = require("../../deploy-config.json");

module.exports = async (done) => {
  const networkType = await web3.eth.net.getNetworkType();
  const networkId = await web3.eth.net.getId();
  const accounts = await web3.eth.getAccounts();
  console.log("network type:" + networkType);
  console.log("network id:" + networkId);
  console.log("accounts:" + accounts);

  try {
    const deployConfig = config[networkId];
    if (!deployConfig) {
      throw `${networkId} configuration is absent`;
    }

    const CONTRACT_ADMIN_ACCOUNT = accounts[0];
    console.log("CONTRACT_ADMIN_ACCOUNT :: ", CONTRACT_ADMIN_ACCOUNT);

    const vaultFactoryAddress = (await VaultFactoryProxy.deployed()).address;
    const vaultFactory = await VaultFactory.at(vaultFactoryAddress);

    const setOracle = async (symbol) => {
      console.log("Adding oracle " + symbol);
      const address = deployConfig[symbol];
      if (address === "0x0") throw "Empty oracle " + symbol;
      const result = await vaultFactory.setOracle(deployConfig[symbol]);
      console.log(
        `Added oracle ${deployConfig[symbol]} as ${symbol} in ${result.tx}`
      );
    };

    // https://docs.chain.link/docs/reference-contracts
    await setOracle("ETH-USD");
    await setOracle("BTC-USD");
    await setOracle("DOT-USD");
    await setOracle("MATIC-USD");
    await setOracle("LINK-USD");
    await setOracle("SUSHI-USD");

    // await setOracle("LINK-USD");
    // await setOracle("UNI-USD");
    // await setOracle("DAI-USD");
    // await setOracle("EUR-USD");
    // await setOracle("GBP-USD");
    // await setOracle("JPY-USD");
    // await setOracle("XAU-USD");
    // await setOracle("N225-JPY");
    // await setOracle("FTSE-GBP");
    // await setOracle("FASTGAS");

    done();
  } catch (e) {
    console.log(e);
    done();
  }
};
