#!/bin/bash

export CONFIG_NAME="./truffle-config.js"
source ./scripts/utils/generate_truffle_config.sh

# remove previous build
rm -rf ./build

# build third party contracts
./scripts/third_party_build.sh

# build our contracts
generate_truffle_config "0.6.6" ".\/contracts"
truffle compile

# remove config file
rm -f $CONFIG_NAME
