const VaultFactory = artifacts.require("VaultFactory");
const VaultFactoryProxy = artifacts.require("VaultFactoryProxy");

const StubToken = artifacts.require("StubToken");
const StubFeed = artifacts.require("StubFeed");

const DerivativeSpecification = artifacts.require("DerivativeSpecification");

const FRACTION_MULTIPLIER = Math.pow(10, 12);

module.exports = async (done) => {
  const networkType = await web3.eth.net.getNetworkType();
  const networkId = await web3.eth.net.getId();
  const accounts = await web3.eth.getAccounts();
  console.log("network type:" + networkType);
  console.log("network id:" + networkId);
  console.log("accounts:" + accounts);

  try {
    const vaultFactoryAddress = (await VaultFactoryProxy.deployed()).address;
    const vaultFactory = await VaultFactory.at(vaultFactoryAddress);

    const setStubToken = async (symbol, decimals) => {
      console.log("Deploying token " + symbol);
      const TOKEN = await StubToken.new(
        "Collateral " + symbol,
        symbol,
        decimals
      );
      console.log("Created token " + TOKEN.address);
      console.log("Adding token... ");
      const result = await vaultFactory.setCollateralToken(TOKEN.address);
      console.log(`Added token ${TOKEN.address} as ${symbol} in ${result.tx}`);
      return TOKEN.address;
    };
    const ASSET = await setStubToken("ASSET", 18);
    const STBL = await setStubToken("STBL", 6);

    const setStubFeed = async (symbol) => {
      const currentTime = Math.floor(Date.now() / 1000);
      const decimals = 6;
      console.log("Deploying stab feed " + symbol);
      const FEED = await StubFeed.new();
      console.log("Created feed " + FEED.address);
      const answer = 1000 * Math.pow(10, decimals);
      console.log("Adding round " + answer + " at " + currentTime);
      await FEED.addRound(answer, currentTime);
      console.log("Adding feed... ");
      const result = await vaultFactory.setOracle(FEED.address);
      console.log(`Added feed ${FEED.address} as ${symbol} in ${result.tx}`);
      return FEED.address;
    };
    const ASSETUSD = await setStubFeed("ASSET-USD");

    const setDerivativeSpecification = async (symbol, params) => {
      console.log(
        "Deploying new specification " +
          symbol +
          " with params: " +
          params.toString()
      );
      const derivative = await DerivativeSpecification.new(...params);
      console.log("Adding specification " + derivative.address);
      const result = await vaultFactory.setDerivativeSpecification(
        derivative.address
      );
      console.log(
        `Added specification ${derivative.address} as ${symbol} in ${result.tx}`
      );
    };

    // await setDerivativeSpecification("InsurASSET", [
    //   accounts[1],
    //   "Insured ASSET",
    //   "InsurASSET",
    //   [web3.utils.keccak256(ASSETUSD)],
    //   [web3.utils.keccak256("ChainlinkIterator")],
    //   web3.utils.keccak256(ASSET),
    //   web3.utils.keccak256("Insur"),
    //   1 * 24 * 3600,
    //   1,
    //   1,
    //   0 * FRACTION_MULTIPLIER,
    //   "",
    // ]);
    //
    // await setDerivativeSpecification("CallASSET", [
    //   accounts[1],
    //   "ASSET Call Option",
    //   "CallASSET",
    //   [web3.utils.keccak256(ASSETUSD)],
    //   [web3.utils.keccak256("ChainlinkIterator")],
    //   web3.utils.keccak256(ASSET),
    //   web3.utils.keccak256("CallOption"),
    //   1 * 24 * 3600,
    //   0,
    //   1,
    //   0 * FRACTION_MULTIPLIER,
    //   "",
    // ]);

    await setDerivativeSpecification("ASSETx5-STBL", [
      accounts[1],
      "ASSETx5 STBL",
      "ASSETx5-STBL",
      [web3.utils.keccak256(ASSETUSD)],
      [web3.utils.keccak256("ChainlinkIterator")],
      web3.utils.keccak256(STBL),
      web3.utils.keccak256("x5"),
      1 * 24 * 3600,
      1,
      1,
      0 * FRACTION_MULTIPLIER,
      "",
    ]);

    await setDerivativeSpecification("28D-ASSETx5-STBL", [
      accounts[1],
      "28D ASSETx5 STBL",
      "28D-ASSETx5-STBL",
      [web3.utils.keccak256(ASSETUSD)],
      [web3.utils.keccak256("ChainlinkIterator")],
      web3.utils.keccak256(STBL),
      web3.utils.keccak256("x5"),
      28 * 24 * 3600,
      1,
      1,
      0 * FRACTION_MULTIPLIER,
      "",
    ]);

    await setDerivativeSpecification("1H-ASSETx5-STBL", [
      accounts[1],
      "1H ASSETx5 STBL",
      "1H-ASSETx5-STBL",
      [web3.utils.keccak256(ASSETUSD)],
      [web3.utils.keccak256("ChainlinkIterator")],
      web3.utils.keccak256(STBL),
      web3.utils.keccak256("x5"),
      3600,
      1,
      1,
      0 * FRACTION_MULTIPLIER,
      "",
    ]);

    // await setDerivativeSpecification("StabASSET", [
    //   accounts[1],
    //   "Stable ASSET",
    //   "StabASSET",
    //   [web3.utils.keccak256(ASSETUSD)],
    //   [web3.utils.keccak256("ChainlinkIterator")],
    //   web3.utils.keccak256(ASSET),
    //   web3.utils.keccak256("Stab"),
    //   1 * 24 * 3600,
    //   1,
    //   1,
    //   0 * FRACTION_MULTIPLIER,
    //   "",
    // ]);
    //
    // await setDerivativeSpecification("ASSETx1", [
    //   accounts[1],
    //   "ASSETx1 Leveraged Token",
    //   "ASSETx1",
    //   [web3.utils.keccak256(ASSETUSD)],
    //   [web3.utils.keccak256("ChainlinkIterator")],
    //   web3.utils.keccak256(STBL),
    //   web3.utils.keccak256("x1"),
    //   1 * 24 * 3600,
    //   1,
    //   1,
    //   0 * FRACTION_MULTIPLIER,
    //   "",
    // ]);

    // await setDerivativeSpecification("1H-InsurASSET", [
    //   accounts[1],
    //   "1H Insured ASSET",
    //   "1H-InsurASSET",
    //   [web3.utils.keccak256(ASSETUSD)],
    //   [web3.utils.keccak256("ChainlinkIterator")],
    //   web3.utils.keccak256(ASSET),
    //   web3.utils.keccak256("Insur"),
    //   45 * 60,
    //   1,
    //   1,
    //   0.02 * FRACTION_MULTIPLIER,
    //   ''
    // ]);
    //
    // await setDerivativeSpecification("1H-CallASSET", [
    //   accounts[1],
    //   "1H ASSET Call Option",
    //   "1H-CallASSET",
    //   [web3.utils.keccak256(ASSETUSD)],
    //   [web3.utils.keccak256("ChainlinkIterator")],
    //   web3.utils.keccak256(ASSET),
    //   web3.utils.keccak256("CallOption"),
    //   45 * 60,
    //   0,
    //   1,
    //   0.005 * FRACTION_MULTIPLIER,
    //   ''
    // ]);
    //
    // await setDerivativeSpecification("1H-ASSETx5", [
    //   accounts[1],
    //   "1H ASSETx5 Leveraged Token",
    //   "1H-ASSETx5",
    //   [web3.utils.keccak256(ASSETUSD)],
    //   [web3.utils.keccak256("ChainlinkIterator")],
    //   web3.utils.keccak256(STBL),
    //   web3.utils.keccak256("x5"),
    //   45 * 60,
    //   1,
    //   1,
    //   0.001 * FRACTION_MULTIPLIER,
    //   ''
    // ]);
    //
    // await setDerivativeSpecification("1H-StabASSET", [
    //   accounts[1],
    //   "1H Stable ASSET",
    //   "1H-StabASSET",
    //   [web3.utils.keccak256(ASSETUSD)],
    //   [web3.utils.keccak256("ChainlinkIterator")],
    //   web3.utils.keccak256(ASSET),
    //   web3.utils.keccak256("Stab"),
    //   45 * 60,
    //   1,
    //   1,
    //   0.005 * FRACTION_MULTIPLIER,
    //   ''
    // ]);
    //
    // await setDerivativeSpecification("1H-ASSETx1", [
    //   accounts[1],
    //   "1H ASSETx1 Leveraged Token",
    //   "1H-ASSETx1",
    //   [web3.utils.keccak256(ASSETUSD)],
    //   [web3.utils.keccak256("ChainlinkIterator")],
    //   web3.utils.keccak256(STBL),
    //   web3.utils.keccak256("x1"),
    //   45 * 60,
    //   1,
    //   1,
    //   0.00999 * FRACTION_MULTIPLIER,
    //   ''
    // ]);
    done();
  } catch (e) {
    console.log(e);
    done();
  }
};
