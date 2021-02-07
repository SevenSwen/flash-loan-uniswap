pragma solidity =0.6.6;

import "./UniswapFlashSwapper.sol";

contract ArbitrageBot is UniswapFlashSwapper {
    // @param _uniswapRouter The address of uniswap V2 protocol router
    // @param _sushiRouter The address of sushiswap protocol router
    constructor(address _uniswapRouter, address _sushiRouter) public UniswapFlashSwapper(_uniswapRouter, _sushiRouter) {
    }

    // @notice Flash-borrows amount of tokenIn from a Uniswap V2 pair and repays using tokenOut
    // @param tokenIn The address of the token you want to flash-borrow
    // @param amount The amount of tokenIn you will borrow
    // @param tokenOut The address of the token you want to use to payback the flash-borrow
    function startSwap(address tokenIn, uint256 amount, address tokenOut) external {
        _startSwap(tokenIn, amount, tokenOut);
    }
}
