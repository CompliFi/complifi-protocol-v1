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

    const SPECIFICATION_AUTHOR = "0x1eaA64f5caBAb19FC15E1f7B262f583C9E65E3E8";
    console.log("SPECIFICATION_AUTHOR :: ", SPECIFICATION_AUTHOR);

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

    await setDerivativeSpecification("BTCx5-USDC", [
      SPECIFICATION_AUTHOR,
      "BTCx5 USDC",
      "BTCx5-USDC",
      [web3.utils.keccak256(deployConfig["BTC-USD"])],
      [web3.utils.keccak256("ChainlinkIterator")],
      web3.utils.keccak256(deployConfig["USDC"]),
      web3.utils.keccak256("x5"),
      40 * 24 * 3600,
      1,
      1,
      0 * FRACTION_MULTIPLIER,
      "",
    ]);

    await setDerivativeSpecification("DOTx5-USDC", [
      SPECIFICATION_AUTHOR,
      "DOTx5 USDC",
      "DOTx5-USDC",
      [web3.utils.keccak256(deployConfig["DOT-USD"])],
      [web3.utils.keccak256("ChainlinkIterator")],
      web3.utils.keccak256(deployConfig["USDC"]),
      web3.utils.keccak256("x5"),
      40 * 24 * 3600,
      1,
      1,
      0 * FRACTION_MULTIPLIER,
      "",
    ]);

    await setDerivativeSpecification("MATICx5-USDC", [
      SPECIFICATION_AUTHOR,
      "MATICx5 USDC",
      "MATICx5-USDC",
      [web3.utils.keccak256(deployConfig["MATIC-USD"])],
      [web3.utils.keccak256("ChainlinkIterator")],
      web3.utils.keccak256(deployConfig["USDC"]),
      web3.utils.keccak256("x5"),
      40 * 24 * 3600,
      1,
      1,
      0 * FRACTION_MULTIPLIER,
      "",
    ]);

    await setDerivativeSpecification("ETHx5-USDC", [
      SPECIFICATION_AUTHOR,
      "ETHx5 USDC",
      "ETHx5-USDC",
      [web3.utils.keccak256(deployConfig["ETH-USD"])],
      [web3.utils.keccak256("ChainlinkIterator")],
      web3.utils.keccak256(deployConfig["USDC"]),
      web3.utils.keccak256("x5"),
      40 * 24 * 3600,
      1,
      1,
      0 * FRACTION_MULTIPLIER,
      "",
    ]);

    await setDerivativeSpecification("GOLDx5-USDC", [
      SPECIFICATION_AUTHOR,
      "GOLDx5 USDC",
      "GOLDx5-USDC",
      [web3.utils.keccak256(deployConfig["XAU-USD"])],
      [web3.utils.keccak256("ChainlinkIterator")],
      web3.utils.keccak256(deployConfig["USDC"]),
      web3.utils.keccak256("x5"),
      40 * 24 * 3600,
      1,
      1,
      0 * FRACTION_MULTIPLIER,
      "",
    ]);

    await setDerivativeSpecification("LINKx5-USDC", [
      SPECIFICATION_AUTHOR,
      "LINKx5 USDC",
      "LINKx5-USDC",
      [web3.utils.keccak256(deployConfig["LINK-USD"])],
      [web3.utils.keccak256("ChainlinkIterator")],
      web3.utils.keccak256(deployConfig["USDC"]),
      web3.utils.keccak256("x5"),
      40 * 24 * 3600,
      1,
      1,
      0 * FRACTION_MULTIPLIER,
      "",
    ]);

    await setDerivativeSpecification("UNIx5-USDC", [
      SPECIFICATION_AUTHOR,
      "UNIx5 USDC",
      "UNIx5-USDC",
      [web3.utils.keccak256(deployConfig["UNI-USD"])],
      [web3.utils.keccak256("ChainlinkIterator")],
      web3.utils.keccak256(deployConfig["USDC"]),
      web3.utils.keccak256("x5"),
      40 * 24 * 3600,
      1,
      1,
      0 * FRACTION_MULTIPLIER,
      "",
    ]);

    await setDerivativeSpecification("SUSHIx5-USDC", [
      SPECIFICATION_AUTHOR,
      "SUSHIx5 USDC",
      "SUSHIx5-USDC",
      [web3.utils.keccak256(deployConfig["SUSHI-USD"])],
      [web3.utils.keccak256("ChainlinkIterator")],
      web3.utils.keccak256(deployConfig["USDC"]),
      web3.utils.keccak256("x5"),
      40 * 24 * 3600,
      1,
      1,
      0 * FRACTION_MULTIPLIER,
      "",
    ]);

    done();
  } catch (e) {
    console.log(e);
    done();
  }
};
