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

    await setDerivativeSpecification("CallBTC", [
      SPECIFICATION_AUTHOR,
      "BTC Call Option",
      "CallBTC",
      [web3.utils.keccak256(deployConfig["BTC-USD"])],
      [web3.utils.keccak256("ChainlinkIterator")],
      web3.utils.keccak256(deployConfig["WBTC"]),
      web3.utils.keccak256("CallOption"),
      28 * 24 * 3600,
      0,
      1,
      0,
      "",
    ]);

    await setDerivativeSpecification("CallETH", [
      SPECIFICATION_AUTHOR,
      "ETH Call Option",
      "CallETH",
      [web3.utils.keccak256(deployConfig["ETH-USD"])],
      [web3.utils.keccak256("ChainlinkIterator")],
      web3.utils.keccak256(deployConfig["WETH"]),
      web3.utils.keccak256("CallOption"),
      28 * 24 * 3600,
      0,
      1,
      0 * FRACTION_MULTIPLIER,
      "",
    ]);

    await setDerivativeSpecification("BTCx5-USDC", [
      SPECIFICATION_AUTHOR,
      "BTCx5 Leveraged Token USDC Collateral",
      "BTCx5-USDC",
      [web3.utils.keccak256(deployConfig["BTC-USD"])],
      [web3.utils.keccak256("ChainlinkIterator")],
      web3.utils.keccak256(deployConfig["USDC"]),
      web3.utils.keccak256("x5"),
      28 * 24 * 3600,
      1,
      1,
      0 * FRACTION_MULTIPLIER,
      "",
    ]);

    await setDerivativeSpecification("ETHx5-USDC", [
      SPECIFICATION_AUTHOR,
      "ETHx5 Leveraged Token USDC Collateral",
      "ETHx5-USDC",
      [web3.utils.keccak256(deployConfig["ETH-USD"])],
      [web3.utils.keccak256("ChainlinkIterator")],
      web3.utils.keccak256(deployConfig["USDC"]),
      web3.utils.keccak256("x5"),
      28 * 24 * 3600,
      1,
      1,
      0 * FRACTION_MULTIPLIER,
      "",
    ]);

    await setDerivativeSpecification("InsurBTC", [
      SPECIFICATION_AUTHOR,
      "Insured BTC",
      "InsurBTC",
      [web3.utils.keccak256(deployConfig["BTC-USD"])],
      [web3.utils.keccak256("ChainlinkIterator")],
      web3.utils.keccak256(deployConfig["WBTC"]),
      web3.utils.keccak256("Insur"),
      28 * 24 * 3600,
      1,
      1,
      0 * FRACTION_MULTIPLIER,
      "",
    ]);

    await setDerivativeSpecification("InsurETH", [
      SPECIFICATION_AUTHOR,
      "Insured ETH",
      "InsurETH",
      [web3.utils.keccak256(deployConfig["ETH-USD"])],
      [web3.utils.keccak256("ChainlinkIterator")],
      web3.utils.keccak256(deployConfig["WETH"]),
      web3.utils.keccak256("Insur"),
      28 * 24 * 3600,
      1,
      1,
      0 * FRACTION_MULTIPLIER,
      "",
    ]);

    await setDerivativeSpecification("StabBTC", [
      SPECIFICATION_AUTHOR,
      "Stable BTC",
      "StabBTC",
      [web3.utils.keccak256(deployConfig["BTC-USD"])],
      [web3.utils.keccak256("ChainlinkIterator")],
      web3.utils.keccak256(deployConfig["WBTC"]),
      web3.utils.keccak256("Stab"),
      28 * 24 * 3600,
      1,
      1,
      0 * FRACTION_MULTIPLIER,
      "",
    ]);

    await setDerivativeSpecification("StabETH", [
      SPECIFICATION_AUTHOR,
      "Stable ETH",
      "StabETH",
      [web3.utils.keccak256(deployConfig["ETH-USD"])],
      [web3.utils.keccak256("ChainlinkIterator")],
      web3.utils.keccak256(deployConfig["WETH"]),
      web3.utils.keccak256("Stab"),
      28 * 24 * 3600,
      1,
      1,
      0 * FRACTION_MULTIPLIER,
      "",
    ]);

    await setDerivativeSpecification("InsurLINK", [
      SPECIFICATION_AUTHOR,
      "Insured LINK",
      "InsurLINK",
      [web3.utils.keccak256(deployConfig["LINK-USD"])],
      [web3.utils.keccak256("ChainlinkIterator")],
      web3.utils.keccak256(deployConfig["LINK"]),
      web3.utils.keccak256("Insur"),
      28 * 24 * 3600,
      1,
      1,
      0 * FRACTION_MULTIPLIER,
      "",
    ]);

    await setDerivativeSpecification("CallLINK", [
      SPECIFICATION_AUTHOR,
      "LINK Call Option",
      "CallLINK",
      [web3.utils.keccak256(deployConfig["LINK-USD"])],
      [web3.utils.keccak256("ChainlinkIterator")],
      web3.utils.keccak256(deployConfig["LINK"]),
      web3.utils.keccak256("CallOption"),
      28 * 24 * 3600,
      0,
      1,
      0 * FRACTION_MULTIPLIER,
      "",
    ]);

    await setDerivativeSpecification("EURx5-USDC", [
      SPECIFICATION_AUTHOR,
      "EURx5 Leveraged Token USDC Collateral",
      "EURx5-USDC",
      [web3.utils.keccak256(deployConfig["EUR-USD"])],
      [web3.utils.keccak256("ChainlinkIterator")],
      web3.utils.keccak256(deployConfig["USDC"]),
      web3.utils.keccak256("x5"),
      28 * 24 * 3600,
      1,
      1,
      0 * FRACTION_MULTIPLIER,
      "",
    ]);

    await setDerivativeSpecification("GBPx5-USDC", [
      SPECIFICATION_AUTHOR,
      "GBPx5 Leveraged Token USDC Collateral",
      "GBPx5-USDC",
      [web3.utils.keccak256(deployConfig["GBP-USD"])],
      [web3.utils.keccak256("ChainlinkIterator")],
      web3.utils.keccak256(deployConfig["USDC"]),
      web3.utils.keccak256("x5"),
      28 * 24 * 3600,
      1,
      1,
      0 * FRACTION_MULTIPLIER,
      "",
    ]);

    await setDerivativeSpecification("JPYx5-USDC", [
      SPECIFICATION_AUTHOR,
      "JPYx5 Leveraged Token USDC Collateral",
      "JPYx5-USDC",
      [web3.utils.keccak256(deployConfig["JPY-USD"])],
      [web3.utils.keccak256("ChainlinkIterator")],
      web3.utils.keccak256(deployConfig["USDC"]),
      web3.utils.keccak256("x5"),
      28 * 24 * 3600,
      1,
      1,
      0 * FRACTION_MULTIPLIER,
      "",
    ]);

    await setDerivativeSpecification("GOLDx5-USDC", [
      SPECIFICATION_AUTHOR,
      "GOLDx5 Leveraged Token USDC Collateral",
      "GOLDx5-USDC",
      [web3.utils.keccak256(deployConfig["XAU-USD"])],
      [web3.utils.keccak256("ChainlinkIterator")],
      web3.utils.keccak256(deployConfig["USDC"]),
      web3.utils.keccak256("x5"),
      28 * 24 * 3600,
      1,
      1,
      0 * FRACTION_MULTIPLIER,
      "",
    ]);

    await setDerivativeSpecification("N225x5-USDC", [
      SPECIFICATION_AUTHOR,
      "N225x5 Leveraged Token USDC Collateral",
      "N225x5-USDC",
      [web3.utils.keccak256(deployConfig["N225-JPY"])],
      [web3.utils.keccak256("ChainlinkIterator")],
      web3.utils.keccak256(deployConfig["USDC"]),
      web3.utils.keccak256("x5"),
      28 * 24 * 3600,
      1,
      1,
      0 * FRACTION_MULTIPLIER,
      "",
    ]);

    await setDerivativeSpecification("FTSEx5-USDC", [
      SPECIFICATION_AUTHOR,
      "FTSEx5 Leveraged Token USDC Collateral",
      "FTSEx5-USDC",
      [web3.utils.keccak256(deployConfig["FTSE-GBP"])],
      [web3.utils.keccak256("ChainlinkIterator")],
      web3.utils.keccak256(deployConfig["USDC"]),
      web3.utils.keccak256("x5"),
      28 * 24 * 3600,
      1,
      1,
      0 * FRACTION_MULTIPLIER,
      "",
    ]);

    await setDerivativeSpecification("SynthGAS", [
      SPECIFICATION_AUTHOR,
      "Synthetic Gas",
      "SynthGAS",
      [web3.utils.keccak256(deployConfig["FASTGAS"])],
      [web3.utils.keccak256("ChainlinkIterator")],
      web3.utils.keccak256(deployConfig["WETH"]),
      web3.utils.keccak256("x1"),
      28 * 24 * 3600,
      1,
      1,
      0 * FRACTION_MULTIPLIER,
      "",
    ]);

    await setDerivativeSpecification("BTCx5-USDT", [
      SPECIFICATION_AUTHOR,
      "BTCx5 Leveraged Token USDT Collateral",
      "BTCx5-USDT",
      [web3.utils.keccak256(deployConfig["BTC-USD"])],
      [web3.utils.keccak256("ChainlinkIterator")],
      web3.utils.keccak256(deployConfig["USDT"]),
      web3.utils.keccak256("x5"),
      28 * 24 * 3600,
      1,
      1,
      0 * FRACTION_MULTIPLIER,
      "",
    ]);

    await setDerivativeSpecification("ETHx5-USDT", [
      SPECIFICATION_AUTHOR,
      "ETHx5 Leveraged Token USDT Collateral",
      "ETHx5-USDT",
      [web3.utils.keccak256(deployConfig["ETH-USD"])],
      [web3.utils.keccak256("ChainlinkIterator")],
      web3.utils.keccak256(deployConfig["USDT"]),
      web3.utils.keccak256("x5"),
      28 * 24 * 3600,
      1,
      1,
      0 * FRACTION_MULTIPLIER,
      "",
    ]);

    await setDerivativeSpecification("EURx5-USDT", [
      SPECIFICATION_AUTHOR,
      "EURx5 Leveraged Token USDT Collateral",
      "EURx5-USDT",
      [web3.utils.keccak256(deployConfig["EUR-USD"])],
      [web3.utils.keccak256("ChainlinkIterator")],
      web3.utils.keccak256(deployConfig["USDT"]),
      web3.utils.keccak256("x5"),
      28 * 24 * 3600,
      1,
      1,
      0 * FRACTION_MULTIPLIER,
      "",
    ]);

    await setDerivativeSpecification("GBPx5-USDT", [
      SPECIFICATION_AUTHOR,
      "GBPx5 Leveraged Token USDT Collateral",
      "GBPx5-USDT",
      [web3.utils.keccak256(deployConfig["GBP-USD"])],
      [web3.utils.keccak256("ChainlinkIterator")],
      web3.utils.keccak256(deployConfig["USDT"]),
      web3.utils.keccak256("x5"),
      28 * 24 * 3600,
      1,
      1,
      0 * FRACTION_MULTIPLIER,
      "",
    ]);

    await setDerivativeSpecification("JPYx5-USDT", [
      SPECIFICATION_AUTHOR,
      "JPYx5 Leveraged Token USDT Collateral",
      "JPYx5-USDT",
      [web3.utils.keccak256(deployConfig["JPY-USD"])],
      [web3.utils.keccak256("ChainlinkIterator")],
      web3.utils.keccak256(deployConfig["USDT"]),
      web3.utils.keccak256("x5"),
      28 * 24 * 3600,
      1,
      1,
      0 * FRACTION_MULTIPLIER,
      "",
    ]);

    await setDerivativeSpecification("GOLDx5-USDT", [
      SPECIFICATION_AUTHOR,
      "GOLDx5 Leveraged Token USDT Collateral",
      "GOLDx5-USDT",
      [web3.utils.keccak256(deployConfig["XAU-USD"])],
      [web3.utils.keccak256("ChainlinkIterator")],
      web3.utils.keccak256(deployConfig["USDT"]),
      web3.utils.keccak256("x5"),
      28 * 24 * 3600,
      1,
      1,
      0 * FRACTION_MULTIPLIER,
      "",
    ]);

    await setDerivativeSpecification("N225x5-USDT", [
      SPECIFICATION_AUTHOR,
      "N225x5 Leveraged Token USDT Collateral",
      "N225x5-USDT",
      [web3.utils.keccak256(deployConfig["N225-JPY"])],
      [web3.utils.keccak256("ChainlinkIterator")],
      web3.utils.keccak256(deployConfig["USDT"]),
      web3.utils.keccak256("x5"),
      28 * 24 * 3600,
      1,
      1,
      0 * FRACTION_MULTIPLIER,
      "",
    ]);

    await setDerivativeSpecification("FTSEx5-USDT", [
      SPECIFICATION_AUTHOR,
      "FTSEx5 Leveraged Token USDT Collateral",
      "FTSEx5-USDT",
      [web3.utils.keccak256(deployConfig["FTSE-GBP"])],
      [web3.utils.keccak256("ChainlinkIterator")],
      web3.utils.keccak256(deployConfig["USDT"]),
      web3.utils.keccak256("x5"),
      28 * 24 * 3600,
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
