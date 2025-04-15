// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@aave/core-v3/contracts/flashloan/base/FlashLoanSimpleReceiverBase.sol";
import "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";

contract FlashLoanArbitrage is FlashLoanSimpleReceiverBase, ReentrancyGuard, Ownable {
    // Constants for Polygon network
    address private constant WBTC = address(0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6);
    address private constant CHAINLINK_WBTC_USD = address(0xc907E116054Ad103354f2D514433D57F6f);
    
    // DEX Routers
    address private constant ONE_INCH_ROUTER = address(0x1111111254EEB25477B68fb85Ed929f73A960582);
    address private constant PARASWAP_ROUTER = address(0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57);
    
    // Configurable parameters
    uint256 public flashLoanAmount;
    uint256 public minProfitThreshold;
    uint256 public slippageTolerance;
    
    // Price feed
    AggregatorV3Interface private wbtcPriceFeed;
    
    // Events
    event ArbitrageExecuted(
        uint256 flashLoanAmount,
        uint256 profit,
        uint256 timestamp
    );
    event PriceUpdate(
        uint256 wbtcPrice,
        uint256 timestamp
    );
    event ConfigUpdated(
        uint256 newFlashLoanAmount,
        uint256 newMinProfitThreshold,
        uint256 newSlippageTolerance
    );

    constructor(
        address _addressProvider,
        uint256 _flashLoanAmount,
        uint256 _minProfitThreshold,
        uint256 _slippageTolerance
    ) FlashLoanSimpleReceiverBase(IPoolAddressesProvider(_addressProvider)) {
        flashLoanAmount = _flashLoanAmount;
        minProfitThreshold = _minProfitThreshold;
        slippageTolerance = _slippageTolerance;
        wbtcPriceFeed = AggregatorV3Interface(CHAINLINK_WBTC_USD);
    }

    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address /* _initiator */,  // Commented out the unused parameter
        bytes calldata params
    ) external override returns (bool) {
        require(msg.sender == address(POOL), "Caller must be Aave Pool");
        require(asset == WBTC, "Only WBTC flash loans supported");

        // Decode arbitrage parameters from params
        (
            uint256 oneInchMinOut,
            uint256 paraswapMinOut,
            bytes memory oneInchData,
            bytes memory paraswapData
        ) = abi.decode(params, (uint256, uint256, bytes, bytes));

        // Get initial balance
        uint256 initialBalance = IERC20(WBTC).balanceOf(address(this));

        // Execute swaps and store results
        executeOneInchSwap(amount / 2, oneInchMinOut, oneInchData);
        executeParaswapSwap(amount / 2, paraswapMinOut, paraswapData);

        // Calculate profit
        uint256 finalBalance = IERC20(WBTC).balanceOf(address(this));
        uint256 profit = finalBalance - initialBalance;
        require(profit >= minProfitThreshold, "Insufficient profit");

        // Approve repayment
        uint256 amountToRepay = amount + premium;
        IERC20(WBTC).approve(address(POOL), amountToRepay);

        // Emit event
        emit ArbitrageExecuted(amount, profit, block.timestamp);

        return true;
    }

    function executeArbitrage(
        uint256 _oneInchMinOut,
        uint256 _paraswapMinOut,
        bytes calldata _oneInchData,
        bytes calldata _paraswapData
    ) external onlyOwner nonReentrant {
        require(flashLoanAmount > 0, "Flash loan amount must be > 0");
        
        // Encode parameters for flash loan
        bytes memory params = abi.encode(
            _oneInchMinOut,
            _paraswapMinOut,
            _oneInchData,
            _paraswapData
        );

        // Request flash loan
        POOL.flashLoanSimple(
            address(this),
            WBTC,
            flashLoanAmount,
            params,
            0
        );
    }

    function executeOneInchSwap(
        uint256 amountIn,
        uint256 minAmountOut,
        bytes memory swapData
    ) internal returns (uint256) {
        IERC20(WBTC).approve(ONE_INCH_ROUTER, amountIn);
        
        (bool success, bytes memory returnData) = ONE_INCH_ROUTER.call(swapData);
        require(success, "1inch swap failed");
        
        uint256 receivedAmount = abi.decode(returnData, (uint256));
        require(receivedAmount >= minAmountOut, "1inch: Insufficient output amount");
        
        return receivedAmount;
    }

    function executeParaswapSwap(
        uint256 amountIn,
        uint256 minAmountOut,
        bytes memory swapData
    ) internal returns (uint256) {
        IERC20(WBTC).approve(PARASWAP_ROUTER, amountIn);
        
        (bool success, bytes memory returnData) = PARASWAP_ROUTER.call(swapData);
        require(success, "Paraswap swap failed");
        
        uint256 receivedAmount = abi.decode(returnData, (uint256));
        require(receivedAmount >= minAmountOut, "Paraswap: Insufficient output amount");
        
        return receivedAmount;
    }

    function updateConfig(
        uint256 _newFlashLoanAmount,
        uint256 _newMinProfitThreshold,
        uint256 _newSlippageTolerance
    ) external onlyOwner {
        flashLoanAmount = _newFlashLoanAmount;
        minProfitThreshold = _newMinProfitThreshold;
        slippageTolerance = _newSlippageTolerance;
        
        emit ConfigUpdated(
            _newFlashLoanAmount,
            _newMinProfitThreshold,
            _newSlippageTolerance
        );
    }

    // Changed from view to pure since we're not reading state
    function getWBTCPrice() public view returns (uint256) {
        (, int256 price,,,) = wbtcPriceFeed.latestRoundData();
        require(price > 0, "Invalid WBTC price");
        return uint256(price);
    }

    function emergencyWithdraw(address token) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance > 0, "No tokens to withdraw");
        IERC20(token).transfer(owner(), balance);
    }

    // Receive function to accept ETH
    receive() external payable {}
}