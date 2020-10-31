// "SPDX-License-Identifier: GNU General Public License v3.0"
pragma solidity 0.6.12;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./IAddressRegistry.sol";

abstract contract AddressRegistryParent is Ownable, IAddressRegistry{
    mapping(bytes32 => address) internal _registry;

    event AddressAdded(bytes32 _key, address _value);

    function generateKey(address _value) public virtual view returns(bytes32 _key){
        return keccak256(abi.encodePacked(_value));
    }

    function set(address _value) external override onlyOwner() {
        bytes32 key = generateKey(_value);
        _check(key, _value);
        emit AddressAdded(key, _value);
        _registry[key] = _value;
    }

    function get(bytes32 _key) external override view returns(address) {
        return _registry[_key];
    }

    function _check(bytes32 _key, address _value) internal virtual {
        require(_value != address(0), "Nullable address");
        require(_registry[_key] == address(0), "Key already exists");
    }
}
