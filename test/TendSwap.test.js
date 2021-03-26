const { BN, ether, time } = require('@openzeppelin/test-helpers');

const chai = require('chai');
chai.use(require('chai-as-promised'));

const { expect } = chai;

const FiatTokenV2 = artifacts.require('FiatTokenV2'); // USDC
const Dai = artifacts.require('Dai'); // DAI
const TetherToken = artifacts.require('TetherToken'); // USDT
const WBTC = artifacts.require('WBTC'); // WBTC
const TendToken = artifacts.require('TendToken'); // Tend
const kEther = artifacts.require('kEther'); // kEther
const LiquidityPoolV2 = artifacts.require('LiquidityPoolV2'); // Ethers pool
const BorrowerProxy = artifacts.require('BorrowerProxy'); // Borrower for Ethers pool

const WETH9 = artifacts.require('WETH9');
const UniswapV2Factory = artifacts.require('UniswapV2Factory');
// const UniswapV2Pair = artifacts.require('UniswapV2Pair');
const UniswapV2Router02 = artifacts.require('UniswapV2Router02');

const TendSwapBot = artifacts.require('TendSwapBot');

const usd = (n) => new BN(web3.utils.toWei(n, 'Mwei')); // decimals 6
const btc = (n) => (new BN(web3.utils.toWei(n, 'Gwei'))).div(new BN('10')); // decimals 8

contract('TendSwapper', ([owner, alice, bob]) => {
  beforeEach(async () => {
    // deploy uniswap protocol
    const uniswapFactory = await UniswapV2Factory.new(owner);
    const weth = await WETH9.new();
    this.uniswapRouter = await UniswapV2Router02.new(uniswapFactory.address, weth.address);

    // deploy and configure USDT
    this.usdt = await TetherToken.new(usd('1000000'), 'Tether USD', 'USDT', 6);

    // deploy and configure Tend
    this.tend = await TendToken.new(ether('1000000'), weth.address, uniswapFactory.address, { from: bob });
    await this.tend.unpause({ from: bob });
    await this.tend.setUniswapPool({ from: bob });

    this.kether = await kEther.new();
    this.ethPool = await LiquidityPoolV2.new();
    this.borrower = await BorrowerProxy.new();

    await this.kether.initialize(await this.ethPool.ETHEREUM.call());
    await this.ethPool.initialize('rinkeby-123', this.borrower.address);
    await this.ethPool.updateDepositFee('64');
    await this.ethPool.updatePoolFee('10000');
    await this.ethPool.register(this.kether.address);
    await this.kether.addMinter(this.ethPool.address);
    await this.ethPool.deposit(await this.ethPool.ETHEREUM.call(), ether('9501'), { value: ether('9501') });

    await this.tend.approve(this.uniswapRouter.address, ether('137205.495339347944754858'), { from: bob });
    await this.uniswapRouter.addLiquidityETH(
      this.tend.address,
      ether('137205.495339347944754858'),
      0,
      0,
      bob,
      (await time.latest()).add(time.duration.minutes('10')),
      { from: bob, value: ether('7.830377550026664124') },
    );

    this.bot = await TendSwapBot.new(
      this.ethPool.address,
      this.borrower.address,
      this.tend.address,
      this.uniswapRouter.address,
      weth.address,
    );
    await this.bot.transferOwnership(alice);
    this.WETH = weth;
  });

  it('test swap with Tend tokens 9500 12h', async () => {
    await time.increase(time.duration.hours('12'));
    // await this.uniswapRouter.swapExactETHForTokens(
    //   0,
    //   [this.WETH.address, this.tend.address],
    //   alice,
    //   (await time.latest()).add(time.duration.minutes('10')),
    //   { from: alice, value: ether('9500') },
    // );
    // const aliceBalance = await this.tend.balanceOf(alice);
    // console.log('aliceBalance:', web3.utils.fromWei(aliceBalance, 'ether').toString());
    //
    // await this.tend.grillPool({ from: alice });
    //
    // const aliceAfterGrillBalance = await this.tend.balanceOf(alice);
    // console.log('aliceAfterGrillBalance:', web3.utils.fromWei(aliceAfterGrillBalance, 'ether').toString());
    // await this.tend.approve(this.uniswapRouter.address, aliceAfterGrillBalance, { from: alice });
    // await this.uniswapRouter.swapExactTokensForETH(
    //   aliceAfterGrillBalance,
    //   0,
    //   [this.tend.address, this.WETH.address],
    //   alice,
    //   (await time.latest()).add(time.duration.minutes('10')),
    //   { from: alice },
    // );

    const aliceETHBalance = new BN(await web3.eth.getBalance(alice));
    console.log('aliceETHBalance before swap:', web3.utils.fromWei(aliceETHBalance, 'ether').toString());
    const botETHBalance = new BN(await web3.eth.getBalance(this.bot.address));
    console.log('botETHBalance before swap:', web3.utils.fromWei(botETHBalance, 'ether').toString());

    await this.bot.run(ether('9500'), { from: alice });

    const aliceETHBalance2 = new BN(await web3.eth.getBalance(alice));
    console.log('aliceETHBalance after swap:', web3.utils.fromWei(aliceETHBalance2, 'ether').toString());
    console.log('sub:', web3.utils.fromWei(aliceETHBalance.sub(aliceETHBalance2), 'ether').toString());
    const botETHBalance2 = new BN(await web3.eth.getBalance(this.bot.address));
    console.log('botETHBalance after swap:', web3.utils.fromWei(botETHBalance2, 'ether').toString());
  });

  it('test swap with Tend tokens 8500 12h', async () => {
    await time.increase(time.duration.hours('12'));

    const aliceETHBalance = new BN(await web3.eth.getBalance(alice));
    console.log('aliceETHBalance before swap:', web3.utils.fromWei(aliceETHBalance, 'ether').toString());
    const botETHBalance = new BN(await web3.eth.getBalance(this.bot.address));
    console.log('botETHBalance before swap:', web3.utils.fromWei(botETHBalance, 'ether').toString());

    await this.bot.run(ether('8500'), { from: alice });

    const aliceETHBalance2 = new BN(await web3.eth.getBalance(alice));
    console.log('aliceETHBalance after swap:', web3.utils.fromWei(aliceETHBalance2, 'ether').toString());
    console.log('sub:', web3.utils.fromWei(aliceETHBalance.sub(aliceETHBalance2), 'ether').toString());
    const botETHBalance2 = new BN(await web3.eth.getBalance(this.bot.address));
    console.log('botETHBalance after swap:', web3.utils.fromWei(botETHBalance2, 'ether').toString());
  });

  it('test swap with Tend tokens 9500 24h', async () => {
    await time.increase(time.duration.hours('24'));

    const aliceETHBalance = new BN(await web3.eth.getBalance(alice));
    console.log('aliceETHBalance before swap:', web3.utils.fromWei(aliceETHBalance, 'ether').toString());
    const botETHBalance = new BN(await web3.eth.getBalance(this.bot.address));
    console.log('botETHBalance before swap:', web3.utils.fromWei(botETHBalance, 'ether').toString());

    await this.bot.run(ether('9500'), { from: alice });

    const aliceETHBalance2 = new BN(await web3.eth.getBalance(alice));
    console.log('aliceETHBalance after swap:', web3.utils.fromWei(aliceETHBalance2, 'ether').toString());
    console.log('sub:', web3.utils.fromWei(aliceETHBalance.sub(aliceETHBalance2), 'ether').toString());
    const botETHBalance2 = new BN(await web3.eth.getBalance(this.bot.address));
    console.log('botETHBalance after swap:', web3.utils.fromWei(botETHBalance2, 'ether').toString());
  });

  it('test swap with Tend tokens 9500 36h', async () => {
    await time.increase(time.duration.hours('36'));

    const aliceETHBalance = new BN(await web3.eth.getBalance(alice));
    console.log('aliceETHBalance before swap:', web3.utils.fromWei(aliceETHBalance, 'ether').toString());
    const botETHBalance = new BN(await web3.eth.getBalance(this.bot.address));
    console.log('botETHBalance before swap:', web3.utils.fromWei(botETHBalance, 'ether').toString());

    await this.bot.run(ether('9500'), { from: alice });

    const aliceETHBalance2 = new BN(await web3.eth.getBalance(alice));
    console.log('aliceETHBalance after swap:', web3.utils.fromWei(aliceETHBalance2, 'ether').toString());
    console.log('sub:', web3.utils.fromWei(aliceETHBalance.sub(aliceETHBalance2), 'ether').toString());
    const botETHBalance2 = new BN(await web3.eth.getBalance(this.bot.address));
    console.log('botETHBalance after swap:', web3.utils.fromWei(botETHBalance2, 'ether').toString());
  });
});
