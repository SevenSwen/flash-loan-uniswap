pragma solidity =0.6.6;

import "./UniswapFlashSwapper.sol";

contract ArbitrageBot is UniswapFlashSwapper{
    constructor(address _uniswapFactory, address router, address _sushiRouter) public
        UniswapFlashSwapper(_uniswapFactory, router, _sushiRouter) {
    }
}
