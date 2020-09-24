// "SPDX-License-Identifier: GNU General Public License v3.0"

pragma solidity >=0.4.21 <0.7.0;

import "@openzeppelin/contracts-ethereum-package/contracts/access/Ownable.sol";

contract FeeLogger is OwnableUpgradeSafe {
    function log(address _liquidityProvider, address _collateral, uint _protocolFee, address _author) external {
        // timestamp
    }

    function initialize() external initializer {
        __Ownable_init();
    }

    uint256[50] private __gap;
}
