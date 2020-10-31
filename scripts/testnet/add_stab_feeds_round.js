'use strict';

const StubFeed = artifacts.require("StubFeed");

const FEEDS = ["0x39CAEb369bBE25642De19926f08d7687B46BbE6C"];

const randomRange = (range) => Math.random() * range - range/2;

module.exports = async (done) => {
  const networkType = await web3.eth.net.getNetworkType();
  const networkId = await web3.eth.net.getId();
  const accounts = await web3.eth.getAccounts();
  console.log("network type:" + networkType);
  console.log("network id:" + networkId);
  console.log("accounts:" + accounts);

  for(const feedAddress of FEEDS) {
    try {
      console.log("Add new round to feed address " + feedAddress);
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
