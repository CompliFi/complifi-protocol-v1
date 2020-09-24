'use strict';

const config = require("../../deploy-config.json");

const StubFeed = artifacts.require("StubFeed");
const OracleRegistry = artifacts.require("OracleRegistry");

const FEEDS = ["ASSET-USD"];

const randomRange = (range) => Math.random() * range - range/2;

module.exports = async (done) => {
  const networkType = await web3.eth.net.getNetworkType();
  const networkId = await web3.eth.net.getId();
  const accounts = await web3.eth.getAccounts();
  console.log("network type:" + networkType);
  console.log("network id:" + networkId);
  console.log("accounts:" + accounts);

  const deployConfig = config[networkId];
  if(!deployConfig){
    throw(`${networkId} configuration is absent`);
  }

  const oracleRegistry = await OracleRegistry.deployed();

  for(const feedSymbol of FEEDS) {
    try {
      const feedAddress = await oracleRegistry.get.call(web3.utils.keccak256(deployConfig[feedSymbol]));
      console.log("Add new round to feed " + feedSymbol + " address " + feedAddress);
      const feed = await StubFeed.at(feedAddress);
      const decimals = 6;
      const latestAnswer = await feed.latestAnswer.call() / Math.pow(10, decimals);
      console.log("Last round answer " + latestAnswer);
      const newAnswer = latestAnswer * (1 + randomRange(0.02));
      const currentTime = Math.floor(Date.now() / 1000);
      console.log("Add round with answer: " + Math.trunc(newAnswer * Math.pow(10, decimals)) / Math.pow(10, decimals) + " at " + currentTime);
      await feed.addRound(Math.trunc(newAnswer * Math.pow(10, decimals)), currentTime, {from: accounts[2]});
      console.log("Added!");
    } catch(e) {
      console.log(e);
      done();
    }
  }

  done();
};
