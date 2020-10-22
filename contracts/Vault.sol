// "SPDX-License-Identifier: GNU General Public License v3.0"

pragma solidity >=0.4.21 <0.7.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

import "./tokens/EIP20NonStandardInterface.sol";

import "./IDerivativeSpecification.sol";
import "./collateralSplits/ICollateralSplit.sol";
import "./tokens/IERC20MintedBurnable.sol";
import "./tokens/ITokenBuilder.sol";
import "./IFeeLogger.sol";

import "./IPausableVault.sol";

/// @title Derivative implementation Vault
/// @notice A smart contract that references derivative specification and enables users to mint and redeem the derivative
contract Vault is Ownable, Pausable, IPausableVault, ReentrancyGuard {
    using SafeMath for uint256;
    using SafeMath for uint8;

    uint public constant FRACTION_MULTIPLIER = 10**12;

    enum State { Created, Minting, Live, Settled }

    event StateChanged(State oldState, State newState);
    event MintingStateSet(address primaryToken, address complementToken);
    event LiveStateSet();
    event SettledStateSet(int[] underlyingStarts, int[] underlyingEnds, uint primaryConversion, uint complementConversion);
    event Minted(uint minted, uint collateral, uint fee);
    event Refunded(uint tokenAmount, uint collateral);
    event Redeemed(uint tokenAmount, uint conversion, uint collateral, bool isPrimary);

    /// @notice vault initialization time
    uint public initializationTime;
    /// @notice start of live period
    uint public liveTime;
    /// @notice end of live period
    uint public settleTime;

    /// @notice redeem function can only be called after the end of the Live period + delay
    uint public settlementDelay;

    /// @notice underlying value at the start of live period
    int[] public underlyingStarts;
    /// @notice underlying value at the end of live period
    int[] public underlyingEnds;

    /// @notice primary token conversion rate multiplied by 10 ^ 12
    uint public primaryConversion;
    /// @notice primary token conversion rate multiplied by 10 ^ 12
    uint public complementConversion;

    /// @notice protocol fee multiplied by 10 ^ 12
    uint public protocolFee;
    /// @notice limit on author fee multiplied by 10 ^ 12
    uint public authorFeeLimit;

    // @notice current state of the vault
    State public state;

    // @notice derivative specification address
    IDerivativeSpecification public derivativeSpecification;
    // @notice collateral token address
    IERC20 public collateralToken;
    // @notice oracle address
    address[] public oracles;
    address[] public oracleIterators;
    // @notice collateral split address
    ICollateralSplit public collateralSplit;
    // @notice derivative's token builder strategy address
    ITokenBuilder public tokenBuilder;
    IFeeLogger public feeLogger;

    // @notice protocol's fee receiving wallet
    address public feeWallet;

    // @notice primary token address
    IERC20MintedBurnable public primaryToken;
    // @notice complement token address
    IERC20MintedBurnable public complementToken;

    constructor(
        uint _initializationTime,
        uint _protocolFee,
        address _feeWallet,
        address _derivativeSpecification,
        address _collateralToken,
        address[] memory _oracles,
        address[] memory _oracleIterators,
        address _collateralSplit,
        address _tokenBuilder,
        address _feeLogger,
        uint _authorFeeLimit,
        uint _settlementDelay
    ) Ownable() public {
        require(_initializationTime > 0, "Initialization time");
        initializationTime = _initializationTime;

        protocolFee = _protocolFee;

        require(_feeWallet != address(0), "Fee wallet");
        feeWallet = _feeWallet;

        require(_derivativeSpecification != address(0), "Derivative");
        derivativeSpecification = IDerivativeSpecification(_derivativeSpecification);

        require(_collateralToken != address(0), "Collateral token");
        collateralToken = IERC20(_collateralToken);

        require(_oracles.length > 0, "Oracles");
        require(_oracles[0] != address(0), "First oracle is absent");
        oracles = _oracles;

        require(_oracleIterators.length > 0, "OracleIterators");
        require(_oracleIterators[0] != address(0), "First oracle iterator is absent");
        oracleIterators = _oracleIterators;

        require(_collateralSplit != address(0), "Collateral split");
        collateralSplit = ICollateralSplit(_collateralSplit);

        require(_tokenBuilder != address(0), "Token builder");
        tokenBuilder = ITokenBuilder(_tokenBuilder);

        require(_feeLogger != address(0), "Fee logger");
        feeLogger = IFeeLogger(_feeLogger);

        changeState(State.Created);

        authorFeeLimit = _authorFeeLimit;

        liveTime = initializationTime + derivativeSpecification.mintingPeriod();
        settleTime = liveTime + derivativeSpecification.livePeriod();
        require(liveTime > block.timestamp, "Live time");
        require(settleTime > block.timestamp, "Settle time");

        settlementDelay = _settlementDelay;
    }

    function pause() external override onlyOwner() {
        _pause();
    }

    function unpause() external override onlyOwner() {
        _unpause();
    }

    /// @notice Initialize vault by creating derivative token and switching to Minting state
    /// @dev Extracted from constructor to reduce contract gas creation amount
    function initialize() external {
        require(state == State.Created, "Incorrect state.");

        changeState(State.Minting);

        (primaryToken, complementToken) = tokenBuilder.buildTokens(derivativeSpecification, settleTime, address(collateralToken));

        emit MintingStateSet(address(primaryToken), address(complementToken));
    }

    /// @notice Switch to Live state if appropriate time threshold is passed
    function live() public {
        if(state != State.Minting) {
            revert('Incorrect state');
        }
        require(block.timestamp >= liveTime, "Incorrect time");
        changeState(State.Live);

        emit LiveStateSet();
    }

    function changeState(State _newState) internal {
        emit StateChanged(state, _newState);
        state = _newState;
    }


    /// @notice Switch to Settled state if appropriate time threshold is passed and
    /// set underlyingStarts value and set underlyingEnds value,
    /// calculate primaryConversion and complementConversion params
    /// @dev Reverts if underlyingStart or underlyingEnd are not available
    /// Vault cannot settle when it paused
    function settle(uint[] memory _underlyingStartRoundHints, uint[] memory _underlyingEndRoundHints)
    public whenNotPaused() {
        if(state != State.Live) {
            revert('Incorrect state');
        }
        require(block.timestamp >= (settleTime), "Incorrect time");
        require(block.timestamp >= (settleTime + settlementDelay), "Delayed settlement");
        changeState(State.Settled);

        uint split;
        (split, underlyingStarts, underlyingEnds) = collateralSplit.split(
            oracles, oracleIterators, liveTime, settleTime, _underlyingStartRoundHints, _underlyingEndRoundHints
        );
        split = range(split);

        uint collectedCollateral = collateralToken.balanceOf(address(this));
        uint mintedPrimaryTokenAmount = primaryToken.totalSupply();

        if(mintedPrimaryTokenAmount > 0) {
            uint primaryCollateralPortion = collectedCollateral.mul(split);
            primaryConversion = primaryCollateralPortion.div(mintedPrimaryTokenAmount);
            complementConversion = collectedCollateral.mul(FRACTION_MULTIPLIER).sub(primaryCollateralPortion).div(mintedPrimaryTokenAmount);
        }

        emit SettledStateSet(underlyingStarts, underlyingEnds, primaryConversion, complementConversion);
    }

    function range(uint _split) public pure returns(uint) {
        if(_split > FRACTION_MULTIPLIER) {
            return FRACTION_MULTIPLIER;
        }
        if(_split < 0) {
            return 0;
        }
        return _split;
    }

    /// @notice Mints primary and complement derivative tokens
    /// @dev Checks and switches to the right state and does nothing if vault is not in Minting state
    function mint(uint _collateralAmount) external nonReentrant() {
        if(block.timestamp >= liveTime && state == State.Minting) {
            live();
        }

        if(state != State.Minting){
            revert('Minting period is over');
        }

        require(_collateralAmount > 0, "Zero amount");
        _collateralAmount = doTransferIn(msg.sender, _collateralAmount);

        uint feeAmount = withdrawFee(_collateralAmount);

        uint netAmount = _collateralAmount.sub(feeAmount);

        uint tokenAmount = denominate(netAmount);

        primaryToken.mint(msg.sender, tokenAmount);
        complementToken.mint(msg.sender, tokenAmount);

        emit Minted(tokenAmount, _collateralAmount, feeAmount);
    }

    /// @notice Refund equal amounts of derivative tokens for collateral at any time
    function refund(uint _tokenAmount) external nonReentrant() {
        require(_tokenAmount > 0, "Zero amount");
        require(_tokenAmount <= primaryToken.balanceOf(msg.sender), "Insufficient primary amount");
        require(_tokenAmount <= complementToken.balanceOf(msg.sender), "Insufficient complement amount");

        primaryToken.burnFrom(msg.sender, _tokenAmount);
        complementToken.burnFrom(msg.sender, _tokenAmount);
        uint unDenominated = unDenominate(_tokenAmount);

        emit Refunded(_tokenAmount, unDenominated);
        doTransferOut(msg.sender, unDenominated);
    }

    /// @notice Redeems unequal amounts previously calculated conversions if the vault in Settled state
    function redeem(
        uint _primaryTokenAmount,
        uint _complementTokenAmount,
        uint[] memory _underlyingStartRoundHints,
        uint[] memory _underlyingEndRoundHints
    ) external nonReentrant() {
        require(_primaryTokenAmount > 0 || _complementTokenAmount > 0, "Both tokens zero amount");
        require(_primaryTokenAmount <= primaryToken.balanceOf(msg.sender), "Insufficient primary amount");
        require(_complementTokenAmount <= complementToken.balanceOf(msg.sender), "Insufficient complement amount");

        if(block.timestamp >= liveTime && state == State.Minting) {
            live();
        }

        if(block.timestamp >= settleTime && state == State.Live) {
            settle(_underlyingStartRoundHints, _underlyingEndRoundHints);
        }

        if(state == State.Settled) {
            redeemAsymmetric(primaryToken, _primaryTokenAmount, true);
            redeemAsymmetric(complementToken, _complementTokenAmount, false);
        }
    }

    function redeemAsymmetric(IERC20MintedBurnable _derivativeToken, uint _amount, bool _isPrimary) internal {
        if(_amount > 0) {
            _derivativeToken.burnFrom(msg.sender, _amount);
            uint conversion = _isPrimary ? primaryConversion : complementConversion;
            uint collateral = _amount.mul(conversion).div(FRACTION_MULTIPLIER);
            emit Redeemed(_amount, conversion, collateral, _isPrimary);
            if(collateral > 0) {
                doTransferOut(msg.sender, collateral);
            }
        }
    }

    function denominate(uint _collateralAmount) internal view returns(uint) {
        return _collateralAmount.div(derivativeSpecification.primaryNominalValue() + derivativeSpecification.complementNominalValue());
    }

    function unDenominate(uint _tokenAmount) internal view returns(uint) {
        return _tokenAmount.mul(derivativeSpecification.primaryNominalValue() + derivativeSpecification.complementNominalValue());
    }

    function withdrawFee(uint _amount) internal returns(uint){
        uint protocolFeeAmount = calcAndTransferFee(_amount, payable(feeWallet), protocolFee);

        feeLogger.log(msg.sender, address(collateralToken), protocolFeeAmount, derivativeSpecification.author());

        uint authorFee = derivativeSpecification.authorFee();
        if(authorFee > authorFeeLimit) {
            authorFee = authorFeeLimit;
        }
        uint authorFeeAmount = calcAndTransferFee(_amount, payable(derivativeSpecification.author()), authorFee);

        return protocolFeeAmount.add(authorFeeAmount);
    }

    function calcAndTransferFee(uint _amount, address payable _beneficiary, uint _fee) internal returns(uint){
        uint feeAmount = _amount.mul(_fee).div(FRACTION_MULTIPLIER);
        if(feeAmount > 0) {
            doTransferOut(_beneficiary, feeAmount);
        }
        return feeAmount;
    }


    /// @dev Similar to EIP20 transfer, except it handles a False result from `transferFrom` and reverts in that case.
    /// This will revert due to insufficient balance or insufficient allowance.
    /// This function returns the actual amount received,
    /// which may be less than `amount` if there is a fee attached to the transfer.
    /// @notice This wrapper safely handles non-standard ERC-20 tokens that do not return a value.
    /// See here: https://medium.com/coinmonks/missing-return-value-bug-at-least-130-tokens-affected-d67bf08521ca
    function doTransferIn(address from, uint amount) internal returns (uint) {
        EIP20NonStandardInterface token = EIP20NonStandardInterface(address(collateralToken));
        uint balanceBefore = collateralToken.balanceOf(address(this));
        token.transferFrom(from, address(this), amount);

        bool success;
        assembly {
            switch returndatasize()
            case 0 {                       // This is a non-standard ERC-20
                success := not(0)          // set success to true
            }
            case 32 {                      // This is a compliant ERC-20
                returndatacopy(0, 0, 32)
                success := mload(0)        // Set `success = returndata` of external call
            }
            default {                      // This is an excessively non-compliant ERC-20, revert.
                revert(0, 0)
            }
        }
        require(success, "TOKEN_TRANSFER_IN_FAILED");

        // Calculate the amount that was *actually* transferred
        uint balanceAfter = collateralToken.balanceOf(address(this));
        require(balanceAfter >= balanceBefore, "TOKEN_TRANSFER_IN_OVERFLOW");
        return balanceAfter - balanceBefore;   // underflow already checked above, just subtract
    }

    /// @dev Similar to EIP20 transfer, except it handles a False success from `transfer` and returns an explanatory
    /// error code rather than reverting. If caller has not called checked protocol's balance, this may revert due to
    /// insufficient cash held in this contract. If caller has checked protocol's balance prior to this call, and verified
    /// it is >= amount, this should not revert in normal conditions.
    /// @notice This wrapper safely handles non-standard ERC-20 tokens that do not return a value.
    /// See here: https://medium.com/coinmonks/missing-return-value-bug-at-least-130-tokens-affected-d67bf08521ca
    function doTransferOut(address payable to, uint amount) internal {
        EIP20NonStandardInterface token = EIP20NonStandardInterface(address(collateralToken));
        token.transfer(to, amount);

        bool success;
        assembly {
            switch returndatasize()
            case 0 {                      // This is a non-standard ERC-20
                success := not(0)          // set success to true
            }
            case 32 {                     // This is a complaint ERC-20
                returndatacopy(0, 0, 32)
                success := mload(0)        // Set `success = returndata` of external call
            }
            default {                     // This is an excessively non-compliant ERC-20, revert.
                revert(0, 0)
            }
        }
        require(success, "TOKEN_TRANSFER_OUT_FAILED");
    }
}
