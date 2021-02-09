#!/bin/bash

generate_truffle_config() {
  SOLC_VERSION=$1
  CONTRACT_DIR=$2
  OPTIMIZATION_KEY=$3
  RUN_KEY=$4
  # remove previous config file
  rm -f $CONFIG_NAME
  touch $CONFIG_NAME
  cat "./truffle-config-template.js" >> $CONFIG_NAME
  sed -i -e "s/solcVersion/$SOLC_VERSION/g" $CONFIG_NAME
  sed -i -e "s/contractsDirectory/$CONTRACT_DIR/g" $CONFIG_NAME
  if [ $# -ge 3 ]; then
    sed -i -e "s/enabled: false/enabled: $OPTIMIZATION_KEY/g" $CONFIG_NAME
  fi
  if [ $# -ge 4 ]; then
    sed -i -e "s/runs: 200/runs: $RUN_KEY/g" $CONFIG_NAME
  fi
}
