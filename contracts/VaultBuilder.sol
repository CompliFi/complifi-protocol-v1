// "SPDX-License-Identifier: GNU General Public License v3.0"

pragma solidity >=0.4.21 <0.7.0;

import "./Vault.sol";
import "./IVaultBuilder.sol";

contract VaultBuilder is IVaultBuilder{
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
        uint _authorFeeLimit
    ) external override returns(address){
        address vault = address(
            new Vault(
                _initializationTime,
                _protocolFee,
                _feeWallet,
                _derivativeSpecification,
                _collateralToken,
                _oracles,
                _oracleIterators,
                _collateralSplit,
                _tokenBuilder,
                _feeLogger,
                _authorFeeLimit
            )
        );
        return vault;
    }
}
