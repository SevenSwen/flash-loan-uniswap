const fse = require('fs-extra');

module.exports = {
  skipFiles: ['Migrations.sol'],
  onCompileComplete: async function(config){
    await fse.copySync(config.working_directory + '/build/contracts', config.contracts_build_directory);
  }
};
