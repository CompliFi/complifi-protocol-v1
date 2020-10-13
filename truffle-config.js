require('dotenv').config();
require('babel-register');
require('babel-polyfill');
const Web3 = require('web3');

const web3 = new Web3('');
const gasPrice = web3.utils.toWei(web3.utils.toBN(process.env.GAS_PRICE_GWEI), "gwei");

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*",
      gasPrice: gasPrice
    },
  },
  mocha: {
    reporter: 'eth-gas-reporter',
    reporterOptions : {
      currency: 'USD',
      gasPrice: 6
    }
  },
  compilers: {
    solc: {
      version: '^0.6.12',
      settings: {
        optimizer: {
          enabled: true,
          runs: 1000000,
        }
      }
    }
  },
  plugins: ["solidity-coverage"]
};
