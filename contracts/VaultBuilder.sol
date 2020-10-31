// "SPDX-License-Identifier: GNU General Public License v3.0"

pragma solidity 0.6.12;

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
        uint _authorFeeLimit,
        uint _settlementDelay
    ) public override returns(address){
        Vault vault = new Vault(
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
            _authorFeeLimit,
            _settlementDelay
        );
        vault.transferOwnership(msg.sender);
        return address(vault);
    }
}
