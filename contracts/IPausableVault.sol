// "SPDX-License-Identifier: GNU General Public License v3.0"

pragma solidity 0.6.12;

interface IPausableVault {
    function pause() external;
    function unpause() external;
}
