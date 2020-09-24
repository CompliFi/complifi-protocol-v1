// "SPDX-License-Identifier: GNU General Public License v3.0"

pragma solidity >=0.4.21 <0.7.0;

interface IAddressRegistry {
    function get(bytes32 _key) external view returns(address);
    function set(bytes32 _key, address _value) external;
}
