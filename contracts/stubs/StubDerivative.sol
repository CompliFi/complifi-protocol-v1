// "SPDX-License-Identifier: GNU General Public License v3.0"

pragma solidity >=0.4.21 <0.7.0;

import "../DerivativeSpecification.sol";

contract StubDerivative is DerivativeSpecification{
    constructor(bytes32[] memory _oracleSymbols, bytes32[] memory _oracleIteratorSymbols, bytes32 _collateralToken) public DerivativeSpecification(
        msg.sender,
        "Stub derivative",
        "STUB",
        _oracleSymbols, //"STUBFEED"
        _oracleIteratorSymbols, //"ChainlinkIterator"
        _collateralToken,
        keccak256(abi.encodePacked("x5")),
        7 * 24 * 3600,
        21 * 24 * 3600,
        1,
        1,
        0,
        ""
    ) {}

    function setName(string memory _name) external {
        name_ = _name;
    }

    function setSymbol(string memory _symbol) external {
        symbol_ = _symbol;
    }

    function setOracleSymbols(bytes32[] memory _oracleSymbols) external {
        oracleSymbols_ = _oracleSymbols;
    }

    function setCollateralTokenSymbol(bytes32 _collateralTokenSymbol) external {
        collateralTokenSymbol_ = _collateralTokenSymbol;
    }

    function setCollateralSplitSymbol(bytes32 _collateralSplitSymbol) external {
        collateralSplitSymbol_ = _collateralSplitSymbol;
    }

    function setMintingPeriod(uint _mintingPeriod) external {
        mintingPeriod_ = _mintingPeriod;
    }
    function setLivePeriod(uint _livePeriod) external {
        livePeriod_ = _livePeriod;
    }

    function setPrimaryNominalValue(uint _primaryNominalValue) external{
        primaryNominalValue_ = _primaryNominalValue;
    }

    function setComplementNominalValue(uint _complementNominalValue) external{
        complementNominalValue_ = _complementNominalValue;
    }

    function setAuthorFee(uint _authorFee) external {
        authorFee_ = _authorFee;
    }
}
