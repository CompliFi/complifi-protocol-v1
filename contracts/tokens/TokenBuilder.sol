// "SPDX-License-Identifier: GNU General Public License v3.0"

pragma solidity >=0.4.21 <0.7.0;

import "./ITokenBuilder.sol";
import "./ERC20PresetMinter.sol";
import "./IERC20Metadata.sol";
import "../IDerivativeSpecification.sol";

import "../libs/BokkyPooBahsDateTimeLibrary/BokkyPooBahsDateTimeLibrary.sol";

contract TokenBuilder is ITokenBuilder{
    string public constant PRIMARY_TOKEN_NAME_POSTFIX = " PRIMARY TOKEN";
    string public constant COMPLEMENT_TOKEN_NAME_POSTFIX = " COMPLEMENT TOKEN";
    string public constant PRIMARY_TOKEN_SYMBOL_POSTFIX = "-P";
    string public constant COMPLEMENT_TOKEN_SYMBOL_POSTFIX = "-C";
    uint8 public constant DECIMALS_DEFAULT = 18;

    event DerivativeTokensCreated(address primaryTokenAddress, address complementTokenAddress);

    function isTokenBuilder() external pure override returns(bool) {
        return true;
    }

    function buildTokens(IDerivativeSpecification _derivativeSpecification, uint _settlement, address _collateralToken) external override returns(IERC20MintedBurnable, IERC20MintedBurnable) {
        uint year;
        uint month;
        uint day;
        (year, month, day) = BokkyPooBahsDateTimeLibrary.timestampToDate(_settlement);

        string memory settlementDate = concat(uint2str(day), concat(getMonthShortName(month), uint2str(getCenturyYears(year))));

        uint8 decimals = IERC20Metadata(_collateralToken).decimals();
        if( decimals == 0 ) {
            decimals = DECIMALS_DEFAULT;
        }

        address primaryToken = address(new ERC20PresetMinter(
                concat(_derivativeSpecification.name(), concat(" ", concat(settlementDate, PRIMARY_TOKEN_NAME_POSTFIX))),
                concat(_derivativeSpecification.symbol(), concat("-", concat(settlementDate, PRIMARY_TOKEN_SYMBOL_POSTFIX))),
                msg.sender,
                decimals));

        address complementToken = address(new ERC20PresetMinter(
                concat(_derivativeSpecification.name(), concat(" ", concat(settlementDate, COMPLEMENT_TOKEN_NAME_POSTFIX))),
                concat(_derivativeSpecification.symbol(), concat("-", concat(settlementDate, COMPLEMENT_TOKEN_SYMBOL_POSTFIX))),
                msg.sender,
                decimals));

        emit DerivativeTokensCreated(primaryToken, complementToken);

        return (IERC20MintedBurnable(primaryToken), IERC20MintedBurnable(complementToken));
    }

    function getCenturyYears(uint _year) internal pure returns(uint) {
        return _year - (_year / 100 ) * 100;
    }

    function concat(string memory _a, string memory _b) internal pure returns(string memory) {
        return string(abi.encodePacked(bytes(_a), bytes(_b)));
    }

    function uint2str(uint _i) internal pure returns (string memory _uintAsString) {
        if (_i == 0) {
            return "0";
        }
        uint j = _i;
        uint len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint k = len - 1;
        while (_i != 0) {
            bstr[k--] = byte(uint8(48 + _i % 10));
            _i /= 10;
        }
        return string(bstr);
    }

    function getMonthShortName(uint _month) internal pure returns (string memory) {
        if (_month == 1) {
            return "Jan";
        }
        if (_month == 2) {
            return "Feb";
        }
        if (_month == 3) {
            return "Mar";
        }
        if (_month == 4) {
            return "Arp";
        }
        if (_month == 5) {
            return "May";
        }
        if (_month == 6) {
            return "Jun";
        }
        if (_month == 7) {
            return "Jul";
        }
        if (_month == 8) {
            return "Aug";
        }
        if (_month == 9) {
            return "Sep";
        }
        if (_month == 10) {
            return "Oct";
        }
        if (_month == 11) {
            return "Nov";
        }
        if (_month == 12) {
            return "Dec";
        }
        return "NaN";
    }
}
