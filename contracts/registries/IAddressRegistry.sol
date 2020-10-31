// "SPDX-License-Identifier: GNU General Public License v3.0"

pragma solidity 0.6.12;

interface IAddressRegistry {
    function get(bytes32 _key) external view returns(address);
    function set(address _value) external;
}
