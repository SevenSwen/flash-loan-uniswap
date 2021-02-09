const { BN, ether, time } = require('@openzeppelin/test-helpers');

const chai = require('chai');
chai.use(require('chai-as-promised'));

const { expect } = chai;

const FiatTokenV2 = artifacts.require('FiatTokenV2'); // USDC
const Dai = artifacts.require('Dai'); // DAI
const TetherToken = artifacts.require('TetherToken'); // USDT
const WBTC = artifacts.require('WBTC'); // WBTC

const WETH9 = artifacts.require('WETH9');
const UniswapV2Factory = artifacts.require('UniswapV2Factory');
// const UniswapV2Pair = artifacts.require('UniswapV2Pair');
const UniswapV2Router02 = artifacts.require('UniswapV2Router02');
const ArbitrageBot = artifacts.require('ArbitrageBot');

const usd = (n) => new BN(web3.utils.toWei(n, 'Mwei')); // decimals 6
const btc = (n) => (new BN(web3.utils.toWei(n, 'Gwei'))).div(new BN('10')); // decimals 8

contract('UniswapFlashSwapper', ([owner, alice]) => {
  beforeEach(async () => {
    // deploy uniswap protocol
    const uniswapFactory = await UniswapV2Factory.new(owner);
    const weth = await WETH9.new();
    this.uniswapRouter = await UniswapV2Router02.new(uniswapFactory.address, weth.address);

    const sushiswapFactory = await UniswapV2Factory.new(owner);
    this.sushiswapRouter = await UniswapV2Router02.new(sushiswapFactory.address, weth.address);

    // deploy and configure USDT
    this.usdt = await TetherToken.new(usd('1000000'), 'Tether USD', 'USDT', 6);

    // deploy and configure USDC
    this.usdc = await FiatTokenV2.new();
    await this.usdc.initialize('USD Coin', 'USDC', 'USD', 6, owner, owner, owner, owner);
    await this.usdc.configureMinter(owner, usd('1000000'));
    await this.usdc.mint(owner, usd('1000000'));

    // deploy and configure DAI
    this.dai = await Dai.new(1);
    await this.dai.mint(owner, ether('1000000'));

    // deploy and configure WBTC
    this.wbtc = await WBTC.new();
    await this.wbtc.mint(owner, btc('1000000'));

    this.arbitrageBot = await ArbitrageBot.new(this.uniswapRouter.address,
      this.sushiswapRouter.address);
  });

  it('run flash loan (wbtc-dai)', async () => {
    await this.dai.approve(this.uniswapRouter.address, ether('250000'));
    await this.wbtc.approve(this.uniswapRouter.address, btc('10'));
    await this.uniswapRouter.addLiquidity(
      this.dai.address,
      this.wbtc.address,
      ether('250000'), // 1 WBTC = 25000 DAI
      btc('10'),
      0,
      0,
      alice,
      (await time.latest()).add(time.duration.minutes('10')),
    );

    await this.dai.approve(this.sushiswapRouter.address, ether('350000'));
    await this.wbtc.approve(this.sushiswapRouter.address, btc('10'));
    await this.sushiswapRouter.addLiquidity(
      this.dai.address,
      this.wbtc.address,
      ether('350000'), // 1 WBTC = 35,000 DAI
      btc('10'),
      0,
      0,
      alice,
      (await time.latest()).add(time.duration.minutes('10')),
    );

    expect(await this.dai.balanceOf(alice)).to.be.bignumber.equal('0');
    expect(await this.wbtc.balanceOf(alice)).to.be.bignumber.equal('0');
    await this.arbitrageBot.startSwap(this.wbtc.address, btc('0.87'), this.dai.address, { from: alice });

    expect(await this.wbtc.balanceOf(alice)).to.be.bignumber.equal('0');
    const balance = await this.dai.balanceOf(alice);
    console.log('(swap 1 WBTC) DAI balance:', web3.utils.fromWei(balance));
  });

  it('run flash loan (wbtc-usdt)', async () => {
    await this.usdt.approve(this.uniswapRouter.address, usd('250000'));
    await this.wbtc.approve(this.uniswapRouter.address, btc('10'));
    await this.uniswapRouter.addLiquidity(
      this.usdt.address,
      this.wbtc.address,
      usd('250000'), // 1 WBTC = 25000 USDT
      btc('10'),
      0,
      0,
      alice,
      (await time.latest()).add(time.duration.minutes('10')),
    );

    await this.usdt.approve(this.sushiswapRouter.address, usd('350000'));
    await this.wbtc.approve(this.sushiswapRouter.address, btc('10'));
    await this.sushiswapRouter.addLiquidity(
      this.usdt.address,
      this.wbtc.address,
      usd('350000'), // 1 WBTC = 35,000 USDT
      btc('10'),
      0,
      0,
      alice,
      (await time.latest()).add(time.duration.minutes('10')),
    );

    expect(await this.usdt.balanceOf(alice)).to.be.bignumber.equal('0');
    expect(await this.wbtc.balanceOf(alice)).to.be.bignumber.equal('0');
    await this.arbitrageBot.startSwap(this.wbtc.address, btc('0.87'), this.usdt.address, { from: alice });

    expect(await this.wbtc.balanceOf(alice)).to.be.bignumber.equal('0');
    const balance = await this.usdt.balanceOf(alice);
    console.log('(swap 1 WBTC) USDT balance:', web3.utils.fromWei(balance, 'Mwei'));
  });

  it('run flash loan (wbtc-usdc)', async () => {
    await this.usdc.approve(this.uniswapRouter.address, usd('250000'));
    await this.wbtc.approve(this.uniswapRouter.address, btc('10'));
    await this.uniswapRouter.addLiquidity(
      this.usdc.address,
      this.wbtc.address,
      usd('250000'), // 1 WBTC = 25000 USDT
      btc('10'),
      0,
      0,
      alice,
      (await time.latest()).add(time.duration.minutes('10')),
    );

    await this.usdc.approve(this.sushiswapRouter.address, usd('350000'));
    await this.wbtc.approve(this.sushiswapRouter.address, btc('10'));
    await this.sushiswapRouter.addLiquidity(
      this.usdc.address,
      this.wbtc.address,
      usd('350000'), // 1 WBTC = 35,000 USDT
      btc('10'),
      0,
      0,
      alice,
      (await time.latest()).add(time.duration.minutes('10')),
    );

    expect(await this.usdc.balanceOf(alice)).to.be.bignumber.equal('0');
    expect(await this.wbtc.balanceOf(alice)).to.be.bignumber.equal('0');
    await this.arbitrageBot.startSwap(this.wbtc.address, btc('0.87'), this.usdc.address, { from: alice });

    expect(await this.wbtc.balanceOf(alice)).to.be.bignumber.equal('0');
    const balance = await this.usdc.balanceOf(alice);
    console.log('(swap 1 WBTC) USDC balance:', web3.utils.fromWei(balance, 'Mwei'));
  });
});
