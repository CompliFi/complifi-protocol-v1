const VaultFactory = artifacts.require("VaultFactory");
const VaultFactoryProxy = artifacts.require("VaultFactoryProxy");

const DerivativeSpecification = artifacts.require("DerivativeSpecification");

const config = require("../../deploy-config.json");

const FRACTION_MULTIPLIER = Math.pow(10, 12);

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

    const vaultFactoryAddress = (await VaultFactoryProxy.deployed()).address;
    const vaultFactory = await VaultFactory.at(vaultFactoryAddress);

    const setDerivativeSpecification = async (symbol, params) => {
      console.log("Deploying specification " + symbol);
      const derivative = await DerivativeSpecification.new(...params);
      console.log("Adding specification " + derivative.address);
      const result = await vaultFactory.setDerivativeSpecification(
        derivative.address
      );
      console.log(
        `Added specification ${derivative.address} as ${symbol} in ${result.tx}`
      );
    };

    await setDerivativeSpecification("1H-ETHx5-USDC", [
      accounts[0],
      "1H ETHx5 Leveraged Token USDC Collateral",
      "1H-ETHx5-USDC",
      [web3.utils.keccak256(deployConfig["ETH-USD"])],
      [web3.utils.keccak256("ChainlinkIterator")],
      web3.utils.keccak256(deployConfig["USDC"]),
      web3.utils.keccak256("x5"),
      45 * 60,
      1,
      1,
      0.001 * FRACTION_MULTIPLIER,
      "",
    ]);

    await setDerivativeSpecification("1D-ETHx5-USDC", [
      accounts[0],
      "1D ETHx5 Leveraged Token USDC Collateral",
      "1D-ETHx5-USDC",
      [web3.utils.keccak256(deployConfig["ETH-USD"])],
      [web3.utils.keccak256("ChainlinkIterator")],
      web3.utils.keccak256(deployConfig["USDC"]),
      web3.utils.keccak256("x5"),
      24 * 60 * 60,
      1,
      1,
      0,
      "",
    ]);
    done();
  } catch (e) {
    console.log(e);
    done();
  }
};
