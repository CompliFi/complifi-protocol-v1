// "SPDX-License-Identifier: GNU General Public License v3.0"

pragma solidity 0.6.12;

import "./AddressRegistryParent.sol";
import "../collateralSplits/ICollateralSplit.sol";

contract CollateralSplitRegistry is AddressRegistryParent {
    function generateKey(address _value) public override view returns(bytes32 _key){
        require(ICollateralSplit(_value).isCollateralSplit(), "Should be collateral split");
        return keccak256(abi.encodePacked(ICollateralSplit(_value).symbol()));
    }
}
