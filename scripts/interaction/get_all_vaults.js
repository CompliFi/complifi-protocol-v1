"use strict";

const VaultFactory = artifacts.require("VaultFactory");
const VaultFactoryProxy = artifacts.require("VaultFactoryProxy");
const Vault = artifacts.require("Vault");
const VaultView = artifacts.require("VaultView");

const VAULT_FACTORY_PROXY = {
  1: "0x3269DeB913363eE58E221808661CfDDa9d898127",
  4: "0x0d2497c1eCB40F77BFcdD99f04AC049c9E9d83F7",
  137: "0xE970b0B1a2789e3708eC7DfDE88FCDbA5dfF246a",
  97: "0x42d002b519820b4656CcAe850B884aE355A4E349",
  80001: "0x277Dc5711B3D3F2C57ab7d28c5A9430E599ba42C",
};

const VAULT_VIEW = {
  137: "0xbC92cFdDD407a721FE5397275c8bBB557301D2c6",
};

module.exports = async (done) => {
  const networkType = await web3.eth.net.getNetworkType();
  const networkId = await web3.eth.net.getId();
  const accounts = await web3.eth.getAccounts();
  console.log("network type:" + networkType);
  console.log("network id:" + networkId);
  console.log("accounts:" + accounts);

  try {
    const vaultFactory = await VaultFactory.at(VAULT_FACTORY_PROXY[networkId]);
    const vaultView = await VaultView.at(VAULT_VIEW[networkId]);

    const vaults = await vaultFactory.getAllVaults.call();
    console.log(`Vaults ${JSON.stringify(vaults)}`);

    const lastVaultIndex = await vaultFactory.getLastVaultIndex.call();

    for (let i = lastVaultIndex; i >= 0; i--) {
      const vaultAddress = await vaultFactory.getVault.call(i);
      const vault = await Vault.at(vaultAddress);
      const state = await vault.state.call();
      console.log(`Vault ${i} with address ${vaultAddress} in state ${state}`);

      console.log(
        JSON.stringify(
          await vaultView.getVaultInfo.call(vaultAddress, accounts[0])
        )
      );
    }
  } catch (e) {
    console.log(e);
    done();
  }

  done();
};
