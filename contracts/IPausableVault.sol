// "SPDX-License-Identifier: GNU General Public License v3.0"

pragma solidity >=0.4.21 <0.7.0;

interface IPausableVault {
    function pause() external;
    function unpause() external;
}
