"use strict";

const StubFeed = artifacts.require("StubFeed");

const FEEDS = {
  "4": ["0xc386FF7BFc1C6a8Dd38039da3CdbC607d42101Ae"],
  "97": ["0x67b8653E2e0F03fCB07294bC3c1b6b4aeb91eA39"],
  "80001": ["0x363d5D5AB77bAa0f66166C593A7223d2bFf7daF3"]
};

const randomRange = (range) => Math.random() * range - range / 2;

module.exports = async (done) => {
  console.log(`starting add_stab_feeds_round, version=${process.env.APP_VERSION}`);
  const networkType = await web3.eth.net.getNetworkType();
  const networkId = await web3.eth.net.getId();
  const accounts = await web3.eth.getAccounts();
  console.log("network type:" + networkType);
  console.log("network id:" + networkId);
  console.log("accounts:" + accounts);

  let feeds;
  const feedsRaw = process.env.FEED_ADDRESSES;
  if(!feedsRaw) {
    feeds = FEEDS[networkId];
  } else {
    feeds = feedsRaw.split(",");
  }

  for (const feedAddress of feeds) {
    try {
      console.log("Add new round to feed address " + feedAddress);
      const feed = await StubFeed.at(feedAddress);
      const decimals = 6;
      const latestAnswer =
        (await feed.latestAnswer.call()) / Math.pow(10, decimals);
      console.log("Last round answer " + latestAnswer);
      const newAnswer = latestAnswer * (1 + randomRange(0.02));
      const currentTime = Math.floor(Date.now() / 1000);
      console.log(
        "Adding round with answer: " +
          Math.trunc(newAnswer * Math.pow(10, decimals)) /
            Math.pow(10, decimals) +
          " at " +
          currentTime
      );
      await feed.addRound(
        Math.trunc(newAnswer * Math.pow(10, decimals)),
        currentTime,
        { from: accounts[2] }
      );
      console.log("Added!");
    } catch (e) {
      console.log(e);
      done();
    }
  }

  done();
};
