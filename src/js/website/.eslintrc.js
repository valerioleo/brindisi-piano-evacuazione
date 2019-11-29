
const path = require('path');
const {parseLinterGlobals} = require('../common/helpers/env');

const envPath = path.join(__dirname, './.env');
const globals = parseLinterGlobals(envPath);

module.exports = {
  settings: {
    'import/resolver': 'webpack'
  },
  globals
}   
