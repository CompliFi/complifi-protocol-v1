const TokenBuilder = artifacts.require("TokenBuilder");
const StubDerivative = artifacts.require("StubDerivative");
const StubToken = artifacts.require("StubToken");

const ERC20PresetMinterPermitted = artifacts.require(
  "ERC20PresetMinterPermitted"
);

const toDerivativeFormat = function (date) {
  let monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  let day = date.getUTCDate();

  let monthIndex = date.getMonth();
  let monthName = monthNames[monthIndex];

  let year = date.getFullYear() - Math.trunc(date.getFullYear() / 100) * 100;

  return `${day}${monthName}${year}`;
};

contract("TokenBuilder", (accounts) => {
  it("...should create tokens.", async () => {
    const tokenBuilderInstance = await TokenBuilder.deployed();
    const stubDerivativeInstance = await StubDerivative.new(
      [web3.utils.keccak256("None")],
      [web3.utils.keccak256("ChainlinkIterator")],
      web3.utils.keccak256("None")
    );
    const DECIMALS = 8;
    const stubToken = await StubToken.new("Stub Token", "STUBTOKEN", DECIMALS);

    const settlement = Math.floor(Date.now() / 1000);
    const settlementDate = toDerivativeFormat(new Date());

    const { logs } = await tokenBuilderInstance.buildTokens(
      stubDerivativeInstance.address,
      settlement,
      stubToken.address
    );

    const primaryTokenAddress = logs[0].args["primaryTokenAddress"];
    const complementTokenAddress = logs[0].args["complementTokenAddress"];

    assert.isOk(web3.eth.getCode(primaryTokenAddress) !== "0x");
    assert.isOk(web3.eth.getCode(complementTokenAddress) !== "0x");

    const primaryToken = await ERC20PresetMinterPermitted.at(
      primaryTokenAddress
    );
    assert.equal(
      await primaryToken.symbol.call(),
      (await stubDerivativeInstance.symbol.call()) +
        "-" +
        settlementDate +
        "-UP"
    );
    assert.equal(
      await primaryToken.name.call(),
      (await stubDerivativeInstance.name.call()) + " " + settlementDate + " UP"
    );
    assert.equal(await primaryToken.decimals.call(), DECIMALS);

    const complementToken = await ERC20PresetMinterPermitted.at(
      complementTokenAddress
    );
    assert.equal(
      await complementToken.symbol.call(),
      (await stubDerivativeInstance.symbol.call()) +
        "-" +
        settlementDate +
        "-DOWN"
    );
    assert.equal(
      await complementToken.name.call(),
      (await stubDerivativeInstance.name.call()) +
        " " +
        settlementDate +
        " DOWN"
    );
    assert.equal(await complementToken.decimals.call(), DECIMALS);
  });
});
