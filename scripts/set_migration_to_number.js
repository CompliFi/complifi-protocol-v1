const Migrations = artifacts.require("Migrations");

module.exports = async (done) => {
  const networkType = await web3.eth.net.getNetworkType();
  const networkId = await web3.eth.net.getId();
  const accounts = await web3.eth.getAccounts();
  console.log("network type:" + networkType);
  console.log("network id:" + networkId);
  console.log("accounts:" + accounts);

  if (networkId !== 4) {
    return done("Incorrect network");
  }

  const migrations = await Migrations.deployed();
  console.log("Migrations contract resolved " + migrations.address);

  try {
    const lastMigration = await migrations.last_completed_migration();
    console.log("Last completed migration " + lastMigration);

    const completed = 6;
    await migrations.setCompleted(completed);
    console.log("Migrations contract set to iteration " + completed);
  } catch (e) {
    console.log(e);
    done(e);
    return;
  }

  done();
};
