const seconds = (amount) => amount;
const minutes = (amount) => amount * seconds(60);
const hours = (amount) => amount * minutes(60);
const days = (amount) => amount * hours(24);
const months = (amount) => amount * days(30);

const Vault = artifacts.require("Vault");
const VaultFactory = artifacts.require("VaultFactory");
const VaultFactoryProxy = artifacts.require("VaultFactoryProxy");

const StubDerivative = artifacts.require("StubDerivative");
const StubFeed = artifacts.require("StubFeed");
const AggregatorProxy = artifacts.require("AggregatorProxy");
const StubToken = artifacts.require("StubToken");
const StubCollateralSplit = artifacts.require("StubCollateralSplit");

const ERC20PresetMinterPermitted = artifacts.require(
  "ERC20PresetMinterPermitted"
);

const FRACTION_MULTIPLIER = Math.pow(10, 12);

const STAGE = {
  Created: 0,
  Live: 1,
  Settled: 2,
};

const makeRoundIdForPhase = (phaseId, roundId) =>
  web3.utils.toBN(phaseId).shln(64).add(web3.utils.toBN(roundId)).toString();
const makeRoundIdForPhase1 = (roundId) => makeRoundIdForPhase(1, roundId);

const get = {};

const initVaultFactory = async () => {
  get["vaultFactory"] = await VaultFactory.at(
    (await VaultFactoryProxy.deployed()).address
  );
};

const setStubCollateralDecimal = (decimals) => {
  get["STUB_COLLATERAL_DECIMALS"] = decimals;
};

const registerStubSpecification = async (name, author, oracle, collateral) => {
  const specification = await StubDerivative.new(
    [web3.utils.keccak256(oracle)],
    [web3.utils.keccak256("ChainlinkIterator")],
    web3.utils.keccak256(collateral),
    { from: author }
  );
  await get["vaultFactory"].setDerivativeSpecification(specification.address);
  get["specification"] = specification;
};

const createVaultBy = async (symbol, liveValue) => {
  const vaultLived = Math.floor(Date.now() / 1000);
  const vaultFactory = get["vaultFactory"];
  await vaultFactory.createVault(web3.utils.keccak256(symbol), vaultLived);
  const lastVaultIndex = await vaultFactory.getLastVaultIndex.call();
  const vaultAddress = await vaultFactory.getVault.call(lastVaultIndex);
  assert.isOk(web3.eth.getCode(vaultAddress) !== "0x");

  const vault = await Vault.at(vaultAddress);
  await vault.initialize([liveValue]);

  get["vault"] = vault;
  get["vaultLived"] = vaultLived;

  get["primaryToken"] = await ERC20PresetMinterPermitted.at(
    await vault.primaryToken.call()
  );
  get["complementToken"] = await ERC20PresetMinterPermitted.at(
    await vault.complementToken.call()
  );

  get["collateralSplit"] = await StubCollateralSplit.at(
    await vault.collateralSplit.call()
  );
};

const createCollateral = async (symbol) => {
  return await createCollateralWith(0, symbol);
};

const createCollateralWith = async (decimal, symbol) => {
  const stubToken = await StubToken.new("Stub Token", symbol, decimal);
  await get["vaultFactory"].setCollateralToken(stubToken.address);
  get["stubToken"] = stubToken;
};

const createStubFeed = async (symbol) => {
  const stubFeedPhase = await StubFeed.new();
  const stubFeed = await AggregatorProxy.new(stubFeedPhase.address);
  await get["vaultFactory"].setOracle(stubFeed.address); //symbol || "STUBFEED"
  get["stubFeed"] = stubFeed;
  get["stubFeedPhase"] = stubFeedPhase;
};

const setStubFeedRound = async (value, timestamp) => {
  await get["stubFeedPhase"].addRound(value, timestamp);
};

const calcConversions = async (startValue, endValue) => {
  const collectedCollateral = await get["stubToken"].balanceOf.call(
    get["vault"].address
  );
  const mintedPrimaryTokenAmount = await get["primaryToken"].totalSupply.call();

  const u = ((endValue - startValue) / startValue) * FRACTION_MULTIPLIER;
  const w = await get["collateralSplit"].range.call(
    await get["collateralSplit"].splitNominalValue.call(u)
  );

  const primaryConversion = Math.trunc(
    (collectedCollateral * w) / mintedPrimaryTokenAmount
  );
  const complementConversion = Math.trunc(
    (collectedCollateral * (FRACTION_MULTIPLIER - w)) / mintedPrimaryTokenAmount
  );

  get["primaryConversion"] = primaryConversion;
  get["complementConversion"] = complementConversion;

  return [primaryConversion, complementConversion];
};

const issueCollateralsTo = async (user, value) => {
  value = toBN(value);
  const currentBalance = await get["stubToken"].balanceOf.call(user);
  await get["stubToken"].mint(user, value);
  assert.equal(
    (await get["stubToken"].balanceOf.call(user)).toString(),
    currentBalance.add(value).toString()
  );

  const currentAllowance = await get["stubToken"].allowance.call(
    user,
    get["vault"].address
  );
  await get["stubToken"].approve(get["vault"].address, value, { from: user });
  assert.equal(
    (
      await get["stubToken"].allowance.call(user, get["vault"].address)
    ).toString(),
    currentAllowance.add(value).toString()
  );
};

const mintFor = async (user, value) => {
  const currentBalance = await get["stubToken"].balanceOf.call(
    get["vault"].address
  );
  await get["vault"].mint(value, { from: user });
  if ((await get["vault"].state.call()) === STAGE.Live) {
    assert.equal(
      (await get["stubToken"].balanceOf.call(get["vault"].address)).toString(),
      toBN(value).add(currentBalance).toString()
    );
  }
};

const approveTokensFor = async (user, primaryValue, complementValue) => {
  await get["primaryToken"].approve(
    get["vault"].address,
    primaryValue.toString(),
    { from: user }
  );
  await get["complementToken"].approve(
    get["vault"].address,
    complementValue.toString(),
    { from: user }
  );
  await checkTokensAllowanceAreEqualFor(user, primaryValue, complementValue);
};

const redeemFor = async (user, primaryValue, complementValue) => {
  // const primaryAllowance = (await get["primaryToken"].allowance.call(user, get["vault"].address)).toString();
  // const complementAllowance = (await get["complementToken"].allowance.call(user, get["vault"].address)).toString();

  await get["vault"].redeem(
    primaryValue.toString(),
    complementValue.toString(),
    [makeRoundIdForPhase1(2)],
    { from: user }
  );
  //await checkTokensAllowanceAreEqualFor(user, primaryAllowance - primaryValue, complementAllowance - complementValue);
};

const redeemEquallyFor = async (user, value) => {
  await get["vault"].refund(value, { from: user });
};

const denominate = async (value) => {
  value = toBN(value);

  const primaryNominalValue = await get[
    "specification"
  ].primaryNominalValue.call();
  const complementNominalValue = await get[
    "specification"
  ].complementNominalValue.call();

  return value.div(primaryNominalValue.add(complementNominalValue));
};

const unDenominate = async (value) => {
  value = toBN(value);

  const primaryNominalValue = await get[
    "specification"
  ].primaryNominalValue.call();
  const complementNominalValue = await get[
    "specification"
  ].complementNominalValue.call();

  return value.mul(primaryNominalValue.add(complementNominalValue));
};

const calcFee = async (value) => {
  const protocolFee = await calcProtocolFee(value);
  const authorFee = await calcAuthorFee(value);
  return protocolFee.add(authorFee);
};

const calcAuthorFee = async (value) => {
  let authorFee = await get["specification"].authorFee.call();

  const authorFeeLimit = await get["vault"].authorFeeLimit.call();
  if (authorFee > authorFeeLimit) {
    authorFee = authorFeeLimit;
  }

  return toBN(value).mul(authorFee).div(toBN(FRACTION_MULTIPLIER));
};

const calcRedeemedAmount = (value, primaryConversion, complementConversion) => {
  return Math.trunc(
    (primaryConversion * value + complementConversion * 0) / FRACTION_MULTIPLIER
  );
};

const toBN = (value) => {
  return web3.utils.toBN(value);
};

const checkFees = async (value, func) => {
  const author = await get["specification"].author.call();
  const authorBalance = await getCollateralBalance(author);

  const protocolWallet = await get["vault"].feeWallet.call();
  const protocolBalance = await getCollateralBalance(protocolWallet);

  await func();

  const protocolFee = await calcProtocolFee(value);
  assert.equal(
    (await getCollateralBalance(author)).toString(),
    authorBalance.add(await calcAuthorFee(toBN(value))).toString()
  );
  assert.equal(
    (await getCollateralBalance(protocolWallet)).toString(),
    protocolBalance.add(protocolFee).toString()
  );
};

const calcProtocolFee = async (value) => {
  let protocolFee = await get["vault"].protocolFee.call();
  return toBN(value).mul(protocolFee).div(toBN(FRACTION_MULTIPLIER));
};

const getCollateralBalance = async (user) => {
  return await get["stubToken"].balanceOf.call(user);
};

const checkCollateralBalanceEqualFor = async (user, value) => {
  assert.equal((await getCollateralBalance(user)).toString(), value.toString());
};

const checkCollateralAreEmptyFor = async (user) => {
  await checkCollateralBalanceEqualFor(user, 0);
};

const checkTokensAreEmptyFor = async (user) => {
  await checkTokensAreEqualFor(user, 0, 0);
};

const checkTokensAreEqualFor = async (
  user,
  primaryAmount,
  complementAmount
) => {
  assert.equal(
    (await get["primaryToken"].balanceOf.call(user)).toString(),
    primaryAmount.toString()
  );
  assert.equal(
    (await get["complementToken"].balanceOf.call(user)).toString(),
    complementAmount.toString()
  );
};

const checkTokensAllowanceAreEqualFor = async (
  user,
  primaryAmount,
  complementAmount
) => {
  assert.equal(
    (
      await get["primaryToken"].allowance.call(user, get["vault"].address)
    ).toString(),
    primaryAmount.toString()
  );
  assert.equal(
    (
      await get["complementToken"].allowance.call(user, get["vault"].address)
    ).toString(),
    complementAmount.toString()
  );
};

const settleWithHints = async (endHints) => {
  await get["vault"].settle(endHints);
};

const settleWithDefaultHints = async (startHints, endHints) => {
  await settleWithHints([makeRoundIdForPhase1(2)]);
};

module.exports = {
  get,
  toBN,
  initVaultFactory,
  setStubCollateralDecimal,
  registerStubSpecification,
  createVaultBy,
  createCollateral,
  createCollateralWith,
  createStubFeed,
  setStubFeedRound,
  calcConversions,
  calcRedeemedAmount,
  issueCollateralsTo,
  mintFor,
  redeemFor,
  approveTokensFor,
  redeemEquallyFor,
  denominate,
  unDenominate,
  calcFee,
  calcAuthorFee,
  checkFees,
  calcProtocolFee,
  checkCollateralBalanceEqualFor,
  checkCollateralAreEmptyFor,
  checkTokensAreEmptyFor,
  checkTokensAreEqualFor,
  checkTokensAllowanceAreEqualFor,
  settleWithDefaultHints,
  settleWithHints,
};
