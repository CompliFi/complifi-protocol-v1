// "SPDX-License-Identifier: GNU General Public License v3.0"
pragma solidity >=0.4.21 <0.7.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./IAddressRegistry.sol";

contract AddressRegistryParent is Ownable, IAddressRegistry{
    bytes32[] internal _keys;
    mapping(bytes32 => address) internal _registry;

    event AddressAdded(bytes32 _key, address _value);

    function set(bytes32 _key, address _value) external override onlyOwner() {
        _check(_key, _value);
        emit AddressAdded(_key, _value);
        _keys.push(_key);
        _registry[_key] = _value;
    }

    function get(bytes32 _key) external override view returns(address) {
        return _registry[_key];
    }

    function _check(bytes32 _key, address _value) internal virtual {
        require(_value != address(0), "Nullable address");
        require(_registry[_key] == address(0), "Existed key");
    }
}
