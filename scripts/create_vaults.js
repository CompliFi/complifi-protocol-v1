"use strict";

const VaultFactory = artifacts.require("VaultFactory");
const Vault = artifacts.require("Vault");
const StubFeed = artifacts.require("StubFeed");

const paused = parseInt(process.env.DELAY_MS || "5000");

const seconds = (amount) => amount;
const minutes = (amount) => amount * seconds(60);
const hours = (amount) => amount * minutes(60);
const days = (amount) => amount * hours(24);
const months = (amount) => amount * days(30);

const delay = require("delay");
const wait = async (param) => {
  console.log("Delay " + paused);
  await delay(paused);
  return param;
};

const VAULT_FACTORY_PROXY = {
  1: "0x3269DeB913363eE58E221808661CfDDa9d898127",
  4: "0x0d2497c1eCB40F77BFcdD99f04AC049c9E9d83F7",
  137: "0xE970b0B1a2789e3708eC7DfDE88FCDbA5dfF246a",
  97: "0x42d002b519820b4656CcAe850B884aE355A4E349",
  80001: "0x277Dc5711B3D3F2C57ab7d28c5A9430E599ba42C",
};

module.exports = async (done) => {
  console.log(`starting create_vaults, version=${process.env.APP_VERSION}`);
  const networkType = await web3.eth.net.getNetworkType();
  const networkId = await web3.eth.net.getId();
  const accounts = await web3.eth.getAccounts();
  console.log("network type:" + networkType);
  console.log("network id:" + networkId);
  console.log("accounts:" + accounts);

  try {
    let INSTRUMENTS = [];
    if (networkId === 1 || networkId === 137) {
      INSTRUMENTS = [
        "BTCx5-USDC",
        "ETHx5-USDC",
        "LINKx5-USDC",
        "MATICx5-USDC",

        // "DOTx5-USDC",
        // "SUSHIx5-USDC",

        // "InsurETH",
        // "StabBTC",
        // "CallBTC",
        // "CallETH",
        // "BTCx5-USDC",
        // "ETHx5-USDC",
        // "InsurBTC",
        // "StabETH",
        // "InsurLINK",
        // "CallLINK",
        // "EURx5-USDC",
        // "GBPx5-USDC",
        // "JPYx5-USDC",
        // "GOLDx5-USDC",
        // "N225x5-USDC",
        // "FTSEx5-USDC",
        // "SynthGAS",
        // "ETHx5-USDT",
        // "EURx5-USDT",
        // "GBPx5-USDT",
        // "JPYx5-USDT",
        // "GOLDx5-USDT",
        // "N225x5-USDT",
        // "FTSEx5-USDT",
      ];
    } else {
      INSTRUMENTS = [
        "ASSETx5-STBL",
        // "CallASSET",
        // "InsurASSET",
        // "StabASSET",
        // "ASSETx1"
      ];
    }

    let vaultFactoryAddress = process.env.VAULT_FACTORY_PROXY_ADDRESS;
    if (!vaultFactoryAddress) {
      vaultFactoryAddress = VAULT_FACTORY_PROXY[networkId];
    }

    console.log("vaultFactoryAddress " + vaultFactoryAddress);
    const vaultFactory = await VaultFactory.at(vaultFactoryAddress);

    let derivativeLive = 1621684800; //SET BEFORE MAINNET LAUNCH


    for (const instrument of INSTRUMENTS) {
      const derivativeTraded = Math.floor(Date.now() / 1000);

      if (networkId !== 1 && networkId !== 137) {
        const daysBefore = days(39);
        derivativeLive = derivativeTraded - daysBefore;
      }

      console.log(
        "Creating vault " +
          instrument +
          " live at " +
          derivativeLive +
          " traded at " +
          derivativeTraded
      );
      await wait(
        await vaultFactory.createVault(
          web3.utils.keccak256(instrument),
          derivativeLive
        )
      );
      const lastVaultIndex = await vaultFactory.getLastVaultIndex.call();
      console.log("Vault created index " + lastVaultIndex);
      const vaultAddress = await vaultFactory.getVault.call(lastVaultIndex);
      console.log("Vault created " + vaultAddress);

      const vault = await Vault.at(vaultAddress);
      const oracleAddress = await vault.oracles(0);
      console.log("Oracle address " + oracleAddress);

      const feed = await StubFeed.at(oracleAddress);

      const roundData = await feed.latestRoundData.call();
      console.log(`Last round id ${roundData.roundId} answer ${roundData.answer}`);

      try {
        await wait(
          await (await Vault.at(vaultAddress)).initialize([roundData.answer])
        );
      } catch {
        // second try if the first is failed
        await wait(
          await (await Vault.at(vaultAddress)).initialize([roundData.answer])
        );
      }
      console.log(
        "Vault initialized " +
          vaultAddress +
          " with value " +
        roundData.answer
      );
    }
  } catch (e) {
    console.log(e);
    done();
  }

  done();
};
