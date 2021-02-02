#!/bin/bash

if [[ $1 = "+fast" ]]; then
  echo "Run tests without build!"

  #remove +fast parameter
  shift
else
  # remove previous build
  rm -rf ./build
  mkdir -p ./build/contracts

  truffle compile

  cp ./node_modules/@uniswap/v2-core/build/UniswapV2Pair.json ./build/contracts
  cp ./node_modules/@uniswap/v2-core/build/UniswapV2Factory.json ./build/contracts
  cp ./node_modules/@uniswap/v2-periphery/build/WETH9.json ./build/contracts
  cp ./node_modules/@uniswap/v2-periphery/build/TransferHelper.json ./build/contracts
  cp ./node_modules/@uniswap/v2-periphery/build/UniswapV2Router02.json ./build/contracts
fi

# run tests
truffle test
