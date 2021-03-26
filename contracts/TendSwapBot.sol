pragma solidity =0.6.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";

interface ILiquidityPool {
    function borrow(address _token, uint256 _amount, bytes calldata _data) external;
}

interface ITend {
   function grillPool() external;
}

interface IWETH {
    function withdraw(uint) external;
    function deposit() external payable;
}

contract TendSwapBot is Ownable {
    IUniswapV2Router02 public immutable uniswapRouter;
    address public immutable wEth;
    address public immutable tendToken;
    address public immutable borrowProxy;
    address payable public immutable liquidityPool;

    modifier onlyBorrowProxy {
        if (msg.sender == borrowProxy) {
            _;
        }
    }

    constructor (
        address payable _liquidityPool,
        address _borrowProxy,
        address _tendToken,
        address _uniswapRouter,
        address _wEth) public {
        liquidityPool = _liquidityPool;
        borrowProxy = _borrowProxy;
        tendToken = _tendToken;
        uniswapRouter = IUniswapV2Router02(_uniswapRouter);
        wEth = _wEth;
    }

    receive() external payable {
    }

    function run(uint256 _amount) external onlyOwner {
        ILiquidityPool(liquidityPool).borrow(
            address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE),
            _amount,
            abi.encodeWithSelector(
                this.__callback.selector,
                _amount
            )
        );
    }

    function getProfit() external {
        address payable to = payable(owner());
        to.transfer(address(this).balance);
    }

    function BIG_RED_BUTTON() external onlyOwner {
        selfdestruct(payable(owner()));
    }

    function __callback(uint256 _amount) external onlyBorrowProxy payable {
        address[] memory _pathEthTend = new address[](2);
        address[] memory _pathTendEth = new address[](2);
        _pathEthTend[0] = wEth;
        _pathEthTend[1] = tendToken;
        _pathTendEth[0] = tendToken;
        _pathTendEth[1] = wEth;

        uniswapRouter.swapExactETHForTokens{value: _amount}(
            0,
            _pathEthTend,
            address(this),
            block.timestamp + 600
        );

        ITend(tendToken).grillPool();

        uint256 balanceTend = IERC20(tendToken).balanceOf(address(this));
        IERC20(tendToken).approve(address(uniswapRouter), balanceTend);

        uniswapRouter.swapExactTokensForETH(
            balanceTend,
            0,
            _pathTendEth,
            address(this),
            block.timestamp + 600
        );

        liquidityPool.transfer(_amount);
    }
}
