"use strict";

const VaultFactory = artifacts.require("VaultFactory");
const VaultFactoryProxy = artifacts.require("VaultFactoryProxy");
const Vault = artifacts.require("Vault");
const VaultView = artifacts.require("VaultView");

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
    const vaultView = await VaultView.deployed();

    const lastVaultIndex = await vaultFactory.getLastVaultIndex.call();

    for (let i = lastVaultIndex; i >= 0; i--) {
      const vaultAddress = await vaultFactory.getVault.call(i);
      const vault = await Vault.at(vaultAddress);
      const state = await vault.state.call();
      console.log(`Vault ${i} with address ${vaultAddress} in state ${state}`);

      console.log(JSON.stringify(await vaultView.getVaultInfo.call(vaultAddress)))
    }
  } catch (e) {
    console.log(e);
    done();
  }

  done();
};
