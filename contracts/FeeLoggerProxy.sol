// "SPDX-License-Identifier: GNU General Public License v3.0"

pragma solidity >=0.4.21 <0.7.0;

import "./libs/upgradeability/AdminUpgradeabilityProxy.sol";

contract FeeLoggerProxy is AdminUpgradeabilityProxy {
    constructor(address _implementation, address _admin) public AdminUpgradeabilityProxy(_implementation, _admin, new bytes(0)) { }
}
