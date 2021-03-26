#!/bin/bash

source ./scripts/utils/generate_truffle_config.sh

# build USDT
generate_truffle_config "0.4.17" ".\/third-party-contracts\/USDT"
truffle compile

# build USDC
generate_truffle_config "0.6.12" ".\/third-party-contracts\/USDC" "true" 1
truffle compile

# build Dai
generate_truffle_config "0.5.12" ".\/third-party-contracts\/DAI"
truffle compile

# build WBTC
generate_truffle_config "0.4.24" ".\/third-party-contracts\/WBTC"
truffle compile

# build Tend
generate_truffle_config "0.6.3" ".\/third-party-contracts\/Tend"
truffle compile

# build LiquidityPool
generate_truffle_config "0.5.12" ".\/third-party-contracts\/LiquidityPool"
truffle compile

# copy uniswap artifacts
cp ./node_modules/@uniswap/v2-core/build/UniswapV2Pair.json ./build/contracts
cp ./node_modules/@uniswap/v2-core/build/UniswapV2Factory.json ./build/contracts
cp ./node_modules/@uniswap/v2-periphery/build/WETH9.json ./build/contracts
cp ./node_modules/@uniswap/v2-periphery/build/TransferHelper.json ./build/contracts
cp ./node_modules/@uniswap/v2-periphery/build/UniswapV2Router02.json ./build/contracts
