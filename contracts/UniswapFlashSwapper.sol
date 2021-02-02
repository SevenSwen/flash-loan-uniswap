pragma solidity =0.6.6;

import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Callee.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "@uniswap/v2-periphery/contracts/libraries/UniswapV2Library.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IWETH.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract UniswapFlashSwapper is IUniswapV2Callee {
    enum SwapType { SimpleLoan, SimpleSwap, TriangularSwap, None }

    address public immutable uniswapFactory;
    IUniswapV2Router02 public immutable sushiRouter;
    IWETH public immutable WETH;

    uint constant deadline = 10 minutes;

    address private _permissionedPairAddress = address(0);
    address private _permissionedSender = address(0);

    constructor(address _uniswapFactory, address router, address _sushiRouter) public {
        uniswapFactory = _uniswapFactory; // 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f
        WETH = IWETH(IUniswapV2Router02(router).WETH());
        sushiRouter = IUniswapV2Router02(_sushiRouter);
    }

    // needs to accept ETH from any V1 exchange and WETH. ideally this could be enforced, as in the router,
    // but it's not possible because it requires a call to the v1 factory, which takes too much gas
    receive() external payable {}

    // @notice Flash-borrows amount of tokenBorrow from a Uniswap V2 pair and repays using tokenPay
    // @param tokenIn The address of the token you want to flash-borrow
    // @param amount The amount of _tokenBorrow you will borrow
    // @param tokenOut The address of the token you want to use to payback the flash-borrow
    // @dev Depending on your use case, you may want to add access controls to this function
    function startSwap(address tokenIn, uint256 amount, address tokenOut) internal {
        _permissionedSender = msg.sender;
//        if (tokenChanger == address(0)) {
            flashLoan(tokenIn, amount, tokenOut);
//            return;
//        }
//        if (tokenChanger == WETH) {
//            flashSwap(tokenIn, amount, tokenOut,);
//            return;
//        }
//        traingularFlashSwap(tokenIn, amount, tokenOut);
    }

    // @notice This function is used when the user repays with the same token they borrowed
    // @dev This initiates the flash borrow. See `flashLoanExecute` for the code that executes after the borrow.
    function flashLoan(address tokenIn, uint256 amount, address tokenOut) private {
        _permissionedPairAddress = UniswapV2Library.pairFor(uniswapFactory, tokenIn, tokenOut);
        address pairAddress = _permissionedPairAddress; // gas efficiency
        require(pairAddress != address(0), "Requested _token is not available.");
        address token0 = IUniswapV2Pair(pairAddress).token0();
        address token1 = IUniswapV2Pair(pairAddress).token1();
        uint256 amount0Out = tokenIn == token0 ? amount : 0;
        uint256 amount1Out = tokenIn == token1 ? amount : 0;
        bytes memory data = abi.encode(
            SwapType.SimpleLoan,
            new bytes(0)
        );
        IUniswapV2Pair(pairAddress).swap(amount0Out, amount1Out, address(this), data);
    }

    // @notice Function is called by the Uniswap V2 pair's `swap` function
    function uniswapV2Call(
        address sender, uint256 amount0,
        uint256 amount1, bytes calldata data
    ) external override {
        require(sender == address(this), "only this contract may initiate");

        // decode data
        (
            SwapType _swapType,
            bytes memory _otherData
        ) = abi.decode(data, (SwapType, bytes));

        if (_swapType == SwapType.None) {
            return;
        }

        assert(msg.sender == _permissionedPairAddress);

        if (_swapType == SwapType.SimpleLoan) {
            flashLoanExecute(amount0, amount1, _otherData);
            return;
        }
        if (_swapType == SwapType.SimpleSwap) {
//            flashSwapExecute(_tokenBorrow, _amount, _tokenPay, msg.sender, _isBorrowingEth, _isPayingEth);
            return;
        }
//        traingularFlashSwapExecute(_tokenBorrow, _amount, _tokenPay, _triangleData);
    }

    // @notice This is the code that is executed after `flashLoan` initiated the flash-borrow
    // @dev When this code executes, this contract will hold the flash-borrowed amount of tokenIn
    function flashLoanExecute(uint256 amount0, uint256 amount1, bytes memory data) private {
        address pair = _permissionedPairAddress;
        uint256 _amountTokenIn;
        address[] memory _path = new address[](2);
        IERC20 token;
        { // scope for token{0,1}, avoids stack too deep errors
            address token0 = IUniswapV2Pair(pair).token0();
            address token1 = IUniswapV2Pair(pair).token1();
            token = IERC20(amount0 == 0 ? token1 : token0);
            assert(amount0 == 0 || amount1 == 0); // this strategy is unidirectional
            _path[0] = amount0 == 0 ? token1 : token0;
            _path[1] = amount0 == 0 ? token0 : token1;
            _amountTokenIn = amount0 == 0 ? amount1 : amount0;
        }

        assert(data.length == 0);

        token.approve(address(sushiRouter), _amountTokenIn);
        uint amountRequired = UniswapV2Library.getAmountsIn(uniswapFactory, _amountTokenIn, _path)[0];
        uint amountReceived = sushiRouter.swapExactTokensForTokens(_amountTokenIn, amountRequired, _path, address(pair), deadline)[1];
        assert(amountReceived > amountRequired); // fail if we didn't get enough tokens back to repay our flash loan
        assert(token.transfer(address(pair), amountRequired)); // return tokens to V2 pair
        assert(token.transfer(_permissionedSender, amountReceived - amountRequired)); // keep the rest! (tokens)
    }
}
