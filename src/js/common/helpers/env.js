const dotenv = require('dotenv');
const fs = require('fs');

const parseEnv = envPath => {
  const parsed = fs.readFileSync(envPath, 'utf8');
  const buf = Buffer.from(parsed);
  const envObj = dotenv.parse(buf);

  return envObj;
};

const parseStringifiedEnv = envPath => {
  const stringifiedEnv = Object.keys(parseEnv(envPath))
    .reduce((acc, curr) => ({
      ...acc,
      [curr]: JSON.stringify(process.env[curr])
    }), {});

  return stringifiedEnv;
};

const parseLinterGlobals = envPath => {
  const linterGlobals = Object.keys(parseEnv(envPath))
    .reduce((acc, curr) => ({
      ...acc,
      [curr]: true
    }), {});

  return linterGlobals;
};

module.exports = {
  parseEnv,
  parseStringifiedEnv,
  parseLinterGlobals
};
