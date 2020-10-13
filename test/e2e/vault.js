const i = require("./domain/context");

const increaseTime = (addSeconds) => new Promise((resolve, reject) => {
  web3.currentProvider.send(
    [{jsonrpc: "2.0", method: "evm_increaseTime", params: [addSeconds], id: 0},
      {jsonrpc: "2.0", method: "evm_mine", params: [], id: 0}
    ],
    function (error, result) {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    }
  );
});

const snapshot = () => new Promise((resolve, reject) => {
  //web3.currentProvider.sendAsync(
  web3.currentProvider.send(
    {jsonrpc: "2.0", method: "evm_snapshot", params: [], id: 0},
    function (error, result) {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    }
  );
});

const revert = (id) => new Promise((resolve, reject) => {
  //web3.currentProvider.sendAsync(
  web3.currentProvider.send(
    {jsonrpc: "2.0", method: "evm_revert", params: [id], id: 0},
    function (error, result) {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    }
  );
});

const seconds = (amount) => amount;
const minutes = (amount) => amount * seconds(60);
const hours = (amount) => amount * minutes(60);
const days = (amount) => amount * hours(24);
const months = (amount) => amount * days(30);

const TokenBuilder = artifacts.require("TokenBuilder");

const FRACTION_MULTIPLIER = Math.pow(10, 12);
const NEGATIVE_INFINITY = "-57896044618658097711785492504343953926634992332820282019728792003956564819968";
const COLLATERAL_VALUE = 999999999;
const STUB_SPECIFICATION_SYMBOL = "STUB";
const DECIMALS_DEFAULT = 18;

const STAGE = {
  Created: 0,
  Minting: 1,
  Live: 2,
  Settled: 3,
  Error: 3
};

const makeRoundIdForPhase = (phaseId, roundId) => web3.utils.toBN(phaseId).shln(64).add(web3.utils.toBN(roundId)).toString();
const makeRoundIdForPhase1 = (roundId) => makeRoundIdForPhase(1, roundId);

contract("Vault", accounts => {
  let startValue, endValue;

  const replaceCollateralTokenWith18Decimals = async () => {
    i.setStubCollateralDecimal(DECIMALS_DEFAULT);

    const COLLATERAL_NAME = "STUBTOKEN2";
    await i.createCollateral(COLLATERAL_NAME);
    await i.get["specification"].setCollateralTokenSymbol(web3.utils.keccak256(i.get["stubToken"].address));
    await i.createVaultBy(STUB_SPECIFICATION_SYMBOL);
  }

  before(async () => {
    await i.initVaultFactory();
    await i.get["vaultFactory"].setProtocolFee(Math.trunc(0.01 * FRACTION_MULTIPLIER));
  });

  beforeEach(async () => {
    snapshotId = (await snapshot()).result;

    const author = accounts[4];
    await i.createCollateralWith(9, "STUBTOKEN");
    await i.createStubFeed();
    await i.registerStubSpecification(STUB_SPECIFICATION_SYMBOL, author, i.get["stubFeed"].address, i.get["stubToken"].address);
    await i.get["specification"].setAuthorFee(Math.trunc(0.03 * FRACTION_MULTIPLIER));
    await i.createVaultBy(STUB_SPECIFICATION_SYMBOL);
    i.setStubCollateralDecimal(9);
  });

  afterEach(async () => {
    await revert(snapshotId);
  });

  describe(' with correct oracle ', function () {
    beforeEach(async () => {
      startValue = 100;
      endValue = 110;
      await i.setStubFeedRound(startValue, i.get["vaultCreated"] + days(7) - hours(2));
      await i.setStubFeedRound(endValue, i.get["vaultCreated"] + days(7) + days(21) - hours(2));
    });

    describe(' checking life cycle ', function () {
      it("...should be created with the right state.", async () => {
        const initializationTime = (await i.get["vault"].initializationTime.call()).toNumber();
        assert.isOk(Math.abs(initializationTime - i.get["vaultCreated"]) <= 1);

        const liveTime = (await i.get["vault"].liveTime.call()).toNumber();
        const mintingPeriod = (await i.get["specification"].mintingPeriod.call()).toNumber();
        assert.equal(liveTime, initializationTime + mintingPeriod);

        const settleTime = (await i.get["vault"].settleTime.call()).toNumber();
        const livePeriod = (await i.get["specification"].livePeriod.call()).toNumber();
        assert.equal(settleTime, initializationTime + mintingPeriod + livePeriod);

        assert.equal((await i.get["vault"].underlyingStart.call()).toString(), NEGATIVE_INFINITY);
        assert.equal((await i.get["vault"].underlyingEnd.call()).toString(), NEGATIVE_INFINITY);

        assert.equal(await i.get["vault"].state.call(), STAGE.Minting);

        assert.equal(await i.get["vault"].derivativeSpecification.call(), i.get["specification"].address);
        assert.equal(await i.get["vault"].collateralToken.call(), i.get["stubToken"].address);
        assert.equal(await i.get["vault"].oracles.call(0), i.get["stubFeed"].address);
        assert.equal(await i.get["vault"].tokenBuilder.call(), TokenBuilder.address);

        assert.equal(await i.get["vault"].feeWallet.call(), accounts[0]);

        assert.isOk(await i.get["vault"].primaryToken.call());
        assert.isOk(await i.get["vault"].complementToken.call());
      });

      it("...should be switched to Live state.", async () => {
        try {
          await i.get["vault"].live();
          assert.fail();
        } catch (err) {
          assert.ok(/revert/.test(err.message));
        }

        increaseTime(days(7));

        await i.get["vault"].live();

        assert.equal(await i.get["vault"].state.call(), STAGE.Live);
      });

      it("...should be switched to Settled state without minting.", async () => {
        increaseTime(days(7));

        await i.get["vault"].live();

        try {
          await i.settleWithDefaultHints();
          assert.fail();
        } catch (err) {
          assert.ok(/revert/.test(err.message));
        }

        increaseTime(days(21));

        await i.settleWithDefaultHints();

        assert.equal((await i.get["vault"].underlyingStart.call()).toNumber(), startValue);
        assert.equal((await i.get["vault"].underlyingEnd.call()).toNumber(), endValue);

        assert.equal(await i.get["vault"].state.call(), STAGE.Settled);

        assert.equal((await i.get["vault"].primaryConversion.call()).toNumber(), 0);
        assert.equal((await i.get["vault"].complementConversion.call()).toNumber(), 0);
      });

      it("...should be switched to Settled state with correct conversions.", async () => {
        const user = accounts[1];
        const value = COLLATERAL_VALUE;
        await i.issueCollateralsTo(user, value);
        await i.mintFor(user, value);

        const user2 = accounts[3];
        await i.issueCollateralsTo(user2, value);
        await i.mintFor(user2, value);

        const [primaryConversion, complementConversion] = await i.calcConversions(startValue, endValue);

        increaseTime(days(7));
        await i.get["vault"].live();

        increaseTime(days(28));
        await i.settleWithDefaultHints();

        assert.equal((await i.get["vault"].underlyingStart.call()).toString(), startValue);
        assert.equal((await i.get["vault"].underlyingEnd.call()).toString(), endValue);

        assert.equal((await i.get["vault"].primaryConversion.call()).toString(), primaryConversion);
        assert.equal((await i.get["vault"].complementConversion.call()).toString(), complementConversion);
      });

      it("...should delay settlement.", async () => {
        assert.equal((await i.get["vaultFactory"].settlementDelay.call()).toString(), 0);
        await i.get["vaultFactory"].setSettlementDelay(hours(3));
        assert.equal((await i.get["vaultFactory"].settlementDelay.call()).toString(), hours(3));

        assert.equal((await i.get["vault"].settlementDelay.call()).toString(), 0);
        await i.createVaultBy(STUB_SPECIFICATION_SYMBOL);
        assert.equal((await i.get["vault"].settlementDelay.call()).toString(), hours(3));

        const user = accounts[1];
        const value = COLLATERAL_VALUE;
        await i.issueCollateralsTo(user, value);
        await i.mintFor(user, value);

        increaseTime(days(7));
        await i.get["vault"].live();

        increaseTime(days(21));

        try {
          await i.settleWithDefaultHints();
          assert.fail();
        } catch (err) {
          assert.ok(/revert Delayed settlement/.test(err.message));
        }

        try {
          await i.redeemFor(user, 1, 0);
          assert.fail();
        } catch (err) {
          assert.ok(/revert Delayed settlement/.test(err.message));
        }

        increaseTime(hours(3));

        await i.settleWithDefaultHints();

        assert.equal(await i.get["vault"].state.call(), STAGE.Settled);
      });

      it("...should pause and unpause vault.", async () => {
        const user = accounts[1];
        const value = COLLATERAL_VALUE;
        await i.issueCollateralsTo(user, value);
        await i.mintFor(user, value);

        increaseTime(days(7));
        await i.get["vault"].live();

        console.log(await i.get["vault"].owner());
        console.log(i.get["vaultFactory"].address);

        await i.get["vaultFactory"].pauseVault(i.get["vault"].address);

        increaseTime(days(21));

        try {
          await i.settleWithDefaultHints();
          assert.fail();
        } catch (err) {
          assert.ok(/revert Pausable: paused/.test(err.message));
        }

        increaseTime(days(1));

        await i.get["vaultFactory"].unpauseVault(i.get["vault"].address);

        await i.settleWithDefaultHints();

        assert.equal(await i.get["vault"].state.call(), STAGE.Settled);
      });

      it("...should redeem if vault paused after settlement.", async () => {
        const user = accounts[1];
        const value = COLLATERAL_VALUE;
        const fee = await i.calcFee(value);
        await i.issueCollateralsTo(user, value);
        await i.mintFor(user, value);

        increaseTime(days(7));
        await i.get["vault"].live();

        console.log(await i.get["vault"].owner());
        console.log(i.get["vaultFactory"].address);

        increaseTime(days(21));

        await i.settleWithDefaultHints();

        await i.get["vaultFactory"].pauseVault(i.get["vault"].address);

        increaseTime(days(1));

        const denominated = await i.denominate(value - fee);
        await i.approveTokensFor(user, denominated, denominated);
        //Redeem minimal amount
        const MINIMAL_COLLATERAL = 1;
        await i.redeemFor(user, MINIMAL_COLLATERAL, 0);
        await i.checkCollateralBalanceEqualFor(user, i.toBN(MINIMAL_COLLATERAL));
      });
    });

    const mintAndCheck = async (user, value) => {
      const fee = await i.calcFee(value);
      await i.issueCollateralsTo(user, value);
      await i.checkTokensAreEmptyFor(user);
      await i.checkFees(value,async () => await i.mintFor(user, value));

      const denominated = (await i.denominate(i.toBN(value).sub(fee)));
      await i.checkTokensAreEqualFor(user, denominated, denominated);
      return fee;
    }

    describe(' during collateral submission basically in minting state ', function () {
      it("...should not mint if value is zero.", async () => {
        const user = accounts[1];
        const value = 0;
        try {
          await i.mintFor(user, value);
          assert.fail();
        } catch (err) {
          assert.ok(/revert/.test(err.message));
        }
      });

      it("...should mint with minimal collateral amount", async () => {
        const user = accounts[1];
        await mintAndCheck(user, 1);
      });

      it("...should mint with huge collateral amount", async () => {
        await replaceCollateralTokenWith18Decimals();

        const user = accounts[1];
        const MAX_VALUE = "1157920892373161954235709850086879078532699846656405";
        await mintAndCheck(user, MAX_VALUE);
      });

      it("...should mint with regular collateral amount.", async () => {
        assert.equal(await i.get["vault"].state.call(), STAGE.Minting);

        const user = accounts[1];
        await mintAndCheck(user, COLLATERAL_VALUE);
      });

      it("...should mint with regular collateral many users.", async () => {
        assert.equal(await i.get["vault"].state.call(), STAGE.Minting);

        const userIdFrom = 5;
        const userIdTo = 9;
        let totalFee = 0;

        for(let i = userIdFrom; i <= userIdTo; i++) {
          totalFee += (await mintAndCheck(accounts[i], COLLATERAL_VALUE)).toNumber();
        }
        assert.equal(
          (await i.get["stubToken"].balanceOf.call(i.get["vault"].address)).toString(),
          COLLATERAL_VALUE * (userIdTo - userIdFrom + 1) - totalFee, "Incorrect vault collateral");
      });

      it("...should mint with exceeded limit author fee.", async () => {
        await i.get["specification"].setAuthorFee(Math.trunc(0.1 * FRACTION_MULTIPLIER));
        await i.createVaultBy(STUB_SPECIFICATION_SYMBOL);

        assert.equal(await i.get["vault"].state.call(), STAGE.Minting);

        const user = accounts[1];
        await mintAndCheck(user, COLLATERAL_VALUE);
      });

      it("...should not mint in Live or Settled state.", async () => {
        increaseTime(days(7));
        await i.get["vault"].live();

        const user = accounts[1];
        const value = COLLATERAL_VALUE;

        try {
          await i.mintFor(user, value);
          assert.fail();
        } catch (err) {
          assert.ok(/revert Minting period is over/.test(err.message));
        }

        increaseTime(days(21));
        await i.settleWithDefaultHints();

        try {
          await i.mintFor(user, value);
          assert.fail();
        } catch (err) {
          assert.ok(/revert Minting period is over/.test(err.message));
        }
      });
    });

    describe(' during redemption ', function() {
      it("...should make symmetric redeem minimal and regular in Minting state.", async () => {
        const user = accounts[1];
        const value = COLLATERAL_VALUE;
        const divisionErrorPerOperation = value % 2;
        const fee = await i.calcFee(value);

        await i.issueCollateralsTo(user, value);
        await i.mintFor(user, value);
        assert.equal(await i.get["stubToken"].balanceOf.call(user), 0);
        const denominated = await i.denominate(value - fee);

        await i.checkTokensAreEqualFor(user, denominated, denominated);
        await i.approveTokensFor(user, denominated, denominated);
        //Redeem minimal amount
        const MINIMAL_AMOUNT = i.toBN(1);
        await i.redeemEquallyFor(user, MINIMAL_AMOUNT);
        await i.checkCollateralBalanceEqualFor(user, await i.unDenominate(MINIMAL_AMOUNT));
        //Redeem all amount
        await i.redeemEquallyFor(user, denominated - MINIMAL_AMOUNT);

        await i.checkTokensAreEmptyFor(user);
        await i.checkCollateralBalanceEqualFor(user, value - fee - divisionErrorPerOperation);
        await i.checkCollateralBalanceEqualFor(i.get["vault"].address, divisionErrorPerOperation);
      });

      it("...should make symmetric redeem minimal and regular in Live state.", async () => {
        await replaceCollateralTokenWith18Decimals();

        const user = accounts[1];
        const value = COLLATERAL_VALUE;
        const divisionErrorPerOperation = value % 2;
        const fee = await i.calcFee(value);
        await i.issueCollateralsTo(user, value);

        await i.mintFor(user, value);

        increaseTime(days(7));
        await i.get["vault"].live();

        const denominated = await i.denominate(value - fee);
        await i.approveTokensFor(user, denominated, denominated);
        //Redeem minimal amount
        const MINIMAL_COLLATERAL = 1;
        await i.redeemEquallyFor(user, MINIMAL_COLLATERAL);
        await i.checkCollateralBalanceEqualFor(user, await i.unDenominate(MINIMAL_COLLATERAL));
        //Redeem all amount
        await i.redeemEquallyFor(user, denominated - MINIMAL_COLLATERAL);
        await i.checkTokensAreEmptyFor(user);
        await i.checkCollateralBalanceEqualFor(user, value - fee - divisionErrorPerOperation);
        await i.checkCollateralBalanceEqualFor(i.get["vault"].address, divisionErrorPerOperation);
      });

      it("...should make symmetric redeem minimal and regular in Settled state.", async () => {
        const user = accounts[1];
        const value = COLLATERAL_VALUE;
        const divisionErrorPerOperation = value % 2;
        const fee = await i.calcFee(value);

        await i.issueCollateralsTo(user, value);

        await i.mintFor(user, value);

        increaseTime(days(7));
        await i.get["vault"].live();

        increaseTime(days(21));
        await i.settleWithDefaultHints();

        const denominated = await i.denominate(value - fee);
        await i.approveTokensFor(user, denominated, denominated);
        //Redeem minimal amount
        const MINIMAL_COLLATERAL = 1;
        await i.redeemEquallyFor(user, MINIMAL_COLLATERAL);
        await i.checkCollateralBalanceEqualFor(user, await i.unDenominate(MINIMAL_COLLATERAL));
        await i.checkTokensAreEqualFor(user, denominated - MINIMAL_COLLATERAL, denominated - MINIMAL_COLLATERAL);
        //Redeem all amount
        await i.redeemEquallyFor(user, denominated - MINIMAL_COLLATERAL);
        await i.checkTokensAreEmptyFor(user);
        await i.checkCollateralBalanceEqualFor(user, value - fee - divisionErrorPerOperation);
        await i.checkCollateralBalanceEqualFor(i.get["vault"].address, divisionErrorPerOperation);
      });

      it("...should not make asymmetric redeem in Minting and Live state.", async () => {
        const user = accounts[1];
        const value = COLLATERAL_VALUE;
        const divisionErrorPerOperation = value % 2;
        const fee = await i.calcFee(value);
        await i.issueCollateralsTo(user, value);
        await i.mintFor(user, value);

        const denominated = await i.denominate(value - fee);
        await i.approveTokensFor(user, denominated, denominated);

        await i.redeemFor(user, denominated, 0);
        await i.redeemFor(user, 0, denominated);

        await i.checkCollateralBalanceEqualFor(user, 0);
        await i.checkTokensAreEqualFor(user, denominated, denominated);

        increaseTime(days(7));
        await i.get["vault"].live();

        await i.redeemFor(user, denominated, 0);
        await i.redeemFor(user, 0, denominated);

        await i.checkCollateralBalanceEqualFor(user, 0);
        await i.checkTokensAreEqualFor(user, denominated, denominated);

        increaseTime(days(21));
        await i.settleWithDefaultHints();

        await i.redeemFor(user, denominated, 0);
        await i.redeemFor(user, 0, denominated);

        await i.checkCollateralBalanceEqualFor(user, value - fee - divisionErrorPerOperation);
        await i.checkTokensAreEmptyFor(user);
        await i.checkCollateralBalanceEqualFor(i.get["vault"].address, divisionErrorPerOperation);
      });

      it("...should make asymmetric redeem minimal and regular in Settled state.", async () => {
        const user = accounts[1];
        const value = COLLATERAL_VALUE;
        const divisionErrorPerOperation = value % 2;
        const fee = await i.calcFee(value);
        await i.issueCollateralsTo(user, value);

        await i.mintFor(user, value);

        const [primaryConversion, complementConversion] = await i.calcConversions(startValue, endValue);

        increaseTime(days(7));
        await i.get["vault"].live();

        increaseTime(days(21));
        await i.settleWithDefaultHints();

        const denominated = await i.denominate(value - fee);
        await i.approveTokensFor(user, denominated, denominated);
        //Redeem minimal amount
        const MINIMAL_COLLATERAL = 1;
        await i.redeemFor(user, MINIMAL_COLLATERAL, 0);
        await i.checkCollateralBalanceEqualFor(user, i.toBN(MINIMAL_COLLATERAL));
        //Redeem all amount
        await i.redeemFor(user, denominated - MINIMAL_COLLATERAL, 0);

        const redeemed = i.calcRedeemedAmount(denominated, primaryConversion, complementConversion);
        await i.checkCollateralBalanceEqualFor(user, i.toBN(redeemed));

        await i.checkTokensAreEqualFor(user, 0, denominated);

        //Redeem minimal amount
        await i.redeemFor(user, 0, MINIMAL_COLLATERAL);
        await i.checkCollateralBalanceEqualFor(user, i.toBN(redeemed).add(i.toBN(MINIMAL_COLLATERAL)).sub(i.toBN(divisionErrorPerOperation)));
        //Redeem all amount
        await i.redeemFor(user, 0, denominated - MINIMAL_COLLATERAL);

        await i.checkCollateralBalanceEqualFor(user, value - fee - 2 * divisionErrorPerOperation);
        await i.checkTokensAreEmptyFor(user);
        await i.checkCollateralBalanceEqualFor(i.get["vault"].address, 2 * divisionErrorPerOperation);
      });
    });
  });

  describe(' with incorrect oracle ', function () {
    describe(' when switching to settled ', function () {
      it("...should success if underlying start and end is correct", async () => {
        await i.setStubFeedRound(100, i.get["vaultCreated"] + days(7) - hours(2));
        await i.setStubFeedRound(110, i.get["vaultCreated"] + days(21) - hours(2));

        increaseTime(days(7));
        await i.get["vault"].live();

        increaseTime(days(21));
        await i.settleWithDefaultHints();

        assert.equal((await i.get["vault"].underlyingStart.call()).toString(), 100);
        assert.equal((await i.get["vault"].underlyingEnd.call()).toString(), 110);
      });

      it("...should revert if underlying start is zero", async () => {
        await i.setStubFeedRound(0, i.get["vaultCreated"] + days(7) - hours(2));

        increaseTime(days(7));
        await i.get["vault"].live();

        increaseTime(days(21));

        try {
          await i.settleWithDefaultHints([makeRoundIdForPhase1(1)], [makeRoundIdForPhase1(1)]);
          assert.fail();
        } catch (err) {
          assert.ok(/revert u_0 is less or equal zero/.test(err.message));
        }
      });

      it("...should revert if oracle is empty", async () => {
        increaseTime(days(7));
        await i.get["vault"].live();

        increaseTime(days(21));
        try {
          await i.settleWithDefaultHints();
          assert.fail();
        } catch (err) {
          assert.ok(/revert No data present/.test(err.message));
        }
      });

      it("...should underlying end be zero if oracle is zero", async () => {
        await i.setStubFeedRound(100, i.get["vaultCreated"] + days(7) - hours(2));
        await i.setStubFeedRound(0, i.get["vaultCreated"] + days(21) - hours(2));

        increaseTime(days(7));
        await i.get["vault"].live();

        increaseTime(days(21));

        await i.settleWithDefaultHints();

        assert.equal((await i.get["vault"].underlyingStart.call()).toString(), 100);
        assert.equal((await i.get["vault"].underlyingEnd.call()).toString(), 0);
      });

      it("...should underlying end be negative value if oracle is negative value", async () => {
        await i.setStubFeedRound(100, i.get["vaultCreated"] + days(7) - hours(2));
        await i.setStubFeedRound(-100, i.get["vaultCreated"] + days(21) - hours(2));

        increaseTime(days(7));
        await i.get["vault"].live();

        increaseTime(days(21));
        await i.settleWithDefaultHints();

        assert.equal((await i.get["vault"].underlyingStart.call()).toString(), 100);
        assert.equal((await i.get["vault"].underlyingEnd.call()).toString(), -100);
      });

      it("...should underlying end be equal to underlying start if oracle value timestamp bigger than settled", async () => {
        await i.setStubFeedRound(100, i.get["vaultCreated"] + days(7) - hours(2));
        await i.setStubFeedRound(100, i.get["vaultCreated"] + days(28) + minutes(1));
        await i.setStubFeedRound(110, i.get["vaultCreated"] + days(30) + minutes(1));
        await i.setStubFeedRound(120, i.get["vaultCreated"] + days(60) + minutes(1));

        increaseTime(days(7));
        await i.get["vault"].live();

        increaseTime(days(21));
        await i.settleWithDefaultHints([makeRoundIdForPhase1(1)], [makeRoundIdForPhase1(1)]);

        assert.equal((await i.get["vault"].underlyingStart.call()).toString(), 100);
        assert.equal((await i.get["vault"].underlyingEnd.call()).toString(), 100);
      });
    });
  });

});
