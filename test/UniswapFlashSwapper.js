const { expectRevert, ether, BN, time } = require('@openzeppelin/test-helpers');

const chai = require('chai');
chai.use(require('chai-as-promised'));

const { expect, assert } = chai;

const WETH9 = artifacts.require('WETH9');
const UniswapV2Factory = artifacts.require('UniswapV2Factory');
// const UniswapV2Pair = artifacts.require('UniswapV2Pair');
const UniswapV2Router02 = artifacts.require('UniswapV2Router02');
const MockERC20 = artifacts.require('MockERC20');
const ArbitrageBot = artifacts.require('ArbitrageBot');

contract('UniswapFlashSwapper', ([owner, alice]) => {
  beforeEach(async () => {
    // deploy uniswap protocol
    const uniswapFactory = await UniswapV2Factory.new(owner);
    const weth = await WETH9.new();
    this.uniswapRouter = await UniswapV2Router02.new(uniswapFactory.address, weth.address);

    const sushiswapFactory = await UniswapV2Factory.new(owner);
    this.sushiswapRouter = await UniswapV2Router02.new(sushiswapFactory.address, weth.address);

    this.dai = await MockERC20.new('DAI', 'DAI', ether('1000000'));
    this.wbtc = await MockERC20.new('Wrapper BTC', 'WBTC', ether('1000000'));

    await this.dai.approve(this.uniswapRouter.address, ether('250000'));
    await this.wbtc.approve(this.uniswapRouter.address, ether('10'));
    await this.uniswapRouter.addLiquidity(
      this.dai.address,
      this.wbtc.address,
      ether('250000'), // 1 WBTC = 25000 DAI
      ether('10'),
      0,
      0,
      alice,
      (await time.latest()).add(time.duration.minutes('10')),
    );

    await this.dai.approve(this.sushiswapRouter.address, ether('350000'));
    await this.wbtc.approve(this.sushiswapRouter.address, ether('10'));
    await this.sushiswapRouter.addLiquidity(
      this.dai.address,
      this.wbtc.address,
      ether('350000'), // 1 WBTC = 35,000 DAI
      ether('10'),
      0,
      0,
      alice,
      (await time.latest()).add(time.duration.minutes('10')),
    );

    this.arbitrageBot = await ArbitrageBot.new(this.uniswapRouter.address,
      this.sushiswapRouter.address);
  });

  it('run flash loan', async () => {
    expect(await this.dai.balanceOf(alice)).to.be.bignumber.equal('0');
    expect(await this.wbtc.balanceOf(alice)).to.be.bignumber.equal('0');
    await this.arbitrageBot.startSwap(this.wbtc.address, ether('0.87'), this.dai.address, { from: alice });

    expect(await this.wbtc.balanceOf(alice)).to.be.bignumber.equal('0');
    const daiBalance = await this.dai.balanceOf(alice);
    console.log('(swap 1 WBTC) daiBalance:', web3.utils.fromWei(daiBalance));
  });
});
