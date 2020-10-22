// "SPDX-License-Identifier: GNU General Public License v3.0"

pragma solidity >=0.4.21 <0.7.0;

interface IVaultBuilder {
    function buildVault(
        uint _initializationTime,
        uint _protocolFee,
        address _feeWallet,
        address _derivativeSpecification,
        address _collateralToken,
        address[] memory _oracles,
        address[] memory _oracleIterators,
        address _collateralSplit,
        address _tokenBuilder,
        address _feeLogger,
        uint _authorFeeLimit,
        uint _settlementDelay
    ) external returns(address);
}
