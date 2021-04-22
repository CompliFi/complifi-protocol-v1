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

    const setCollateralToken = async (symbol) => {
      console.log("Adding collateral " + symbol);
      const address = deployConfig[symbol];
      if (address === "0x0") throw "Empty collateral token " + symbol;
      const result = await vaultFactory.setCollateralToken(
        deployConfig[symbol]
      );
      console.log(
        `Added collateral ${deployConfig[symbol]} as ${symbol} in ${result.tx}`
      );
    };

    // USDC https://www.centre.io/developer-resources
    await setCollateralToken("USDC");
    await setCollateralToken("USDT");
    await setCollateralToken("WBTC");
    // WETH Deployed contract addresses https://blog.0xproject.com/canonical-weth-migration-8a7ab6caca71
    await setCollateralToken("WETH");
    await setCollateralToken("LINK");
    done();
  } catch (e) {
    console.log(e);
    done();
  }
};
