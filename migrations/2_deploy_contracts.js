const WETH9 = artifacts.require('WETH9'); // Wrapper Eth
const UniswapV2Factory = artifacts.require('UniswapV2Factory'); // Uniswap Factory
const UniswapV2Pair = artifacts.require('UniswapV2Pair'); // Uniswap Pair
const UniswapV2Router02 = artifacts.require('UniswapV2Router02'); // Uniswap Router

const TetherToken = artifacts.require('TetherToken'); // USDT
const FiatTokenV2 = artifacts.require('FiatTokenV2'); // USDC
const Dai = artifacts.require('Dai'); // DAI
const WBTC = artifacts.require('WBTC'); // WBTC

const ArbitrageBot = artifacts.require('ArbitrageBot');

const usd = (n) => web3.utils.toWei(n, 'Mwei');
const btc = (n) => web3.utils.toWei(n, 'Gwei').slice(0, -1); // decimals 8
const ether = (n) => web3.utils.toWei(n, 'ether');

module.exports = function (deployer, network) {
  deployer.then(async () => {
    if (network === 'rinkeby' || network === 'rinkeby-fork') {
      const owner = process.env.DEPLOYER_ACCOUNT;
      // connect to uniswap protocol
      const uniswapRouter = await UniswapV2Router02.at('0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D');
      const weth = await WETH9.at('0xc778417E063141139Fce010982780140Aa0cD5Ab');

      // fuck the sushiswap protocol
      // deploy sushiswap factory and router
      const sushiswapFactory = await deployer.deploy(UniswapV2Factory, owner);
      const sushiswapRouter = await deployer.deploy(UniswapV2Router02,
        sushiswapFactory.address, weth.address);

      // deploy and configure USDT
      const usdt = await deployer.deploy(TetherToken, usd('1000000'), 'Tether USD', 'USDT', 6);

      // deploy and configure USDC
      const usdc = await deployer.deploy(FiatTokenV2);
      await usdc.initialize('USD Coin', 'USDC', 'USD', 6, owner, owner, owner, owner);
      await usdc.configureMinter(owner, usd('1000000'));
      await usdc.mint(owner, usd('1000000'));

      // deploy and configure DAI
      const dai = await deployer.deploy(Dai, 1);
      await dai.mint(owner, ether('1000000'));

      // deploy and configure WBTC
      const wbtc = await deployer.deploy(WBTC);
      await wbtc.mint(owner, btc('1000000'));

      await deployer.deploy(ArbitrageBot, uniswapRouter.address,
        sushiswapRouter.address);

      await dai.approve(uniswapRouter.address, ether('250000'));
      await wbtc.approve(uniswapRouter.address, btc('10'));
      let now = new Date() / 1000 | 0;
      await uniswapRouter.addLiquidity(
        dai.address,
        wbtc.address,
        ether('250000'), // 1 WBTC = 25000 DAI
        btc('10'),
        0,
        0,
        owner,
        now + 6000,
      );
      console.log('dai - wbtc uniswap has been deployed');

      await dai.approve(sushiswapRouter.address, ether('350000'));
      await wbtc.approve(sushiswapRouter.address, btc('10'));
      now = new Date() / 1000 | 0;
      await sushiswapRouter.addLiquidity(
        dai.address,
        wbtc.address,
        ether('350000'), // 1 WBTC = 35,000 DAI
        btc('10'),
        0,
        0,
        owner,
        now + 6000,
      );
      console.log('dai - wbtc sushiswap has been deployed');

      await usdt.approve(uniswapRouter.address, usd('250000'));
      await wbtc.approve(uniswapRouter.address, btc('10'));
      now = new Date() / 1000 | 0;
      await uniswapRouter.addLiquidity(
        usdt.address,
        wbtc.address,
        usd('250000'), // 1 WBTC = 25000 USDT
        btc('10'),
        0,
        0,
        owner,
        now + 6000,
      );
      console.log('usdt - wbtc uniswap has been deployed');

      await usdt.approve(sushiswapRouter.address, usd('350000'));
      await wbtc.approve(sushiswapRouter.address, btc('10'));
      now = new Date() / 1000 | 0;
      await sushiswapRouter.addLiquidity(
        usdt.address,
        wbtc.address,
        usd('350000'), // 1 WBTC = 35,000 USDT
        btc('10'),
        0,
        0,
        owner,
        now + 6000,
      );
      console.log('usdt - wbtc sushiswap has been deployed');

      await usdc.approve(uniswapRouter.address, usd('250000'));
      await wbtc.approve(uniswapRouter.address, btc('10'));
      now = new Date() / 1000 | 0;
      await uniswapRouter.addLiquidity(
        usdc.address,
        wbtc.address,
        usd('250000'), // 1 WBTC = 25000 USDC
        btc('10'),
        0,
        0,
        owner,
        now + 6000,
      );
      console.log('usdc - wbtc uniswap has been deployed');

      await usdc.approve(sushiswapRouter.address, usd('350000'));
      await wbtc.approve(sushiswapRouter.address, btc('10'));
      now = new Date() / 1000 | 0;
      await sushiswapRouter.addLiquidity(
        usdc.address,
        wbtc.address,
        usd('350000'), // 1 WBTC = 35,000 USDC
        btc('10'),
        0,
        0,
        owner,
        now + 6000,
      );
      console.log('usdc - wbtc sushiswap has been deployed');
    } else {
      console.error(`Unsupported network: ${network}`);
    }
  });
};
