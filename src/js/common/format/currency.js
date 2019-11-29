const {round} = require('mathjs');
const {fromFinney} = require('../../eth-utils/core/v1');
const {fromSatoshi} = require('../../bitcoin-utils/format');
const {Currencies} = require('../data/constants');

const fromCents = amount => Number(amount) / 100;
const toCents = amount => Number(amount) * 100;
const toLocaleString = (number, maximumFractionDigits = 2) => Number(number).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits});
const normalizeFiatValue = value => fromCents(Math.floor(value));

const getCurrencyDecimals = currency => {
  switch(currency) {
    case Currencies.BTC:
      return 5;
    case Currencies.Ether:
    case Currencies.DAI:
    case Currencies['True USD']:
    case Currencies['Gemini USD']:
      return 3;
    default:
      return 2;
  }
};

const dropDecimals = (value, currency) => {
  const decimals = getCurrencyDecimals(currency);

  return round(value, decimals);
};

const formatCurrencySize = (amount, currency) => {
  const decimals = getCurrencyDecimals(currency);

  return toLocaleString(amount, decimals);
};

const toCurrencyBaseUnit = (value, currency) => {
  switch(currency) {
    case Currencies.BTC:
      return fromSatoshi(value);
    case Currencies.Ether:
    case Currencies.DAI:
    case Currencies['True USD']:
    case Currencies['Gemini USD']:
    case 'TOKEN':
      return fromFinney('ether', value);
    case Currencies.FIAT:
      return fromCents(value);
    default:
      return value;
  }
};

module.exports = {
  toCurrencyBaseUnit,
  fromCents,
  toCents,
  dropDecimals,
  toLocaleString,
  normalizeFiatValue,
  formatCurrencySize
};

