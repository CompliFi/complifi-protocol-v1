// "SPDX-License-Identifier: GNU General Public License v3.0"

pragma solidity 0.6.12;

interface IOracleIterator {
    /// @notice Proof of oracle iterator contract
    /// @dev Verifies that contract is a oracle iterator contract
    /// @return true if contract is a oracle iterator contract
    function isOracleIterator() external pure returns(bool);

    /// @notice Symbol of the oracle iterator
    /// @dev Should be resolved through OracleIteratorRegistry contract
    /// @return oracle iterator symbol
    function symbol() external pure returns (string memory);

    /// @notice Algorithm that, for the type of oracle used by the derivative,
    //  finds the value closest to a given timestamp
    /// @param _oracle iteratable oracle through
    /// @param _timestamp a given timestamp
    /// @param _roundHints specified rounds for a given timestamp
    /// @return the value closest to a given timestamp
    function getUnderlingValue(address _oracle, uint _timestamp, uint[] memory _roundHints) external view returns(int);
}
