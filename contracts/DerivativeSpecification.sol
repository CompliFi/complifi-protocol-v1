// "SPDX-License-Identifier: GNU General Public License v3.0"

pragma solidity >=0.4.21 <0.7.0;

import "@chainlink/contracts/src/v0.6/interfaces/AggregatorInterface.sol";
import "./IDerivativeSpecification.sol";

contract DerivativeSpecification is IDerivativeSpecification {

    function isDerivativeSpecification() external override pure returns(bool) {
        return true;
    }

    string internal symbol_;

    bytes32[] internal oracleSymbols_;
    bytes32[] internal oracleIteratorSymbols_;
    bytes32 internal collateralTokenSymbol_;
    bytes32 internal collateralSplitSymbol_;

    uint internal mintingPeriod_;
    uint internal livePeriod_;

    uint internal primaryNominalValue_;
    uint internal complementNominalValue_;

    uint internal authorFee_;

    string internal name_;
    string private baseURI_;
    address internal author_;

    function name() external view override virtual returns (string memory){
        return name_;
    }

    function baseURI() external view override virtual returns (string memory){
        return baseURI_;
    }

    function symbol() external view override virtual returns (string memory){
        return symbol_;
    }

    function oracleSymbols() external view override virtual returns (bytes32[] memory){
        return oracleSymbols_;
    }

    function oracleIteratorSymbols() external view override virtual returns (bytes32[] memory){
        return oracleIteratorSymbols_;
    }

    function collateralTokenSymbol() external view override virtual returns (bytes32){
        return collateralTokenSymbol_;
    }

    function collateralSplitSymbol() external view override virtual returns (bytes32){
        return collateralSplitSymbol_;
    }

    function mintingPeriod() external view override virtual returns (uint){
        return mintingPeriod_;
    }
    function livePeriod() external view override virtual returns (uint){
        return livePeriod_;
    }

    function primaryNominalValue() external view override virtual returns (uint){
        return primaryNominalValue_;
    }

    function complementNominalValue() external view override virtual  returns (uint){
        return complementNominalValue_;
    }

    function authorFee() external view override virtual returns (uint){
        return authorFee_;
    }

    function author() external view override virtual returns (address){
        return author_;
    }

    constructor (
        address _author,
        string memory _name,
        string memory _symbol,
        bytes32[] memory _oracleSymbols,
        bytes32[] memory _oracleIteratorSymbols,
        bytes32 _collateralTokenSymbol,
        bytes32 _collateralSplitSymbol,
        uint _mintingPeriod,
        uint _livePeriod,
        uint _primaryNominalValue,
        uint _complementNominalValue,
        uint _authorFee,
        string memory _baseURI ) public {

        author_ = _author;
        name_ = _name;
        symbol_ = _symbol;
        oracleSymbols_ = _oracleSymbols;
        oracleIteratorSymbols_ = _oracleIteratorSymbols;
        collateralTokenSymbol_ = _collateralTokenSymbol;
        collateralSplitSymbol_ = _collateralSplitSymbol;
        mintingPeriod_ = _mintingPeriod;
        livePeriod_ = _livePeriod;
        primaryNominalValue_ = _primaryNominalValue;
        complementNominalValue_ = _complementNominalValue;
        authorFee_ = _authorFee;
        baseURI_ = _baseURI;
    }
}
