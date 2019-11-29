import {Map} from 'immutable';
import {fromSatoshi} from 'BitcoinUtils/format';
import {fromCents, toLocaleString, toCents} from 'Common/format/currency';
import {toFinneyNumber} from 'EthUtils/core/v1';
import {toSatoshi} from 'BitcoinUtils/format';
import {
  Currencies,
  currencyExists,
  isStablecoin,
  isEther
} from 'Common/data/constants';
import {fromFinney} from 'EthUtils/core/v1';

const defaultValue = Map({
  bonusTokens: 0,
  fiatValue: 0,
  referralTokens: 0,
  size: 0,
  tokens: 0,
  totalTokens: 0
});

export const getCurrencyTotal = (totals, currency) => totals.get(currency, defaultValue);

const getStablecoinTotalFiatValue = totals => {
  const totalFiatValue = totals.reduce(
    (acc, v, k) => isStablecoin(k) ? acc + Number(v.get('fiatValue')) : acc,
    0
  );

  return Math.floor(fromCents(totalFiatValue));
};

export const getStablecoinTotalTokens = totals => {
  const totalStableCoinValue = totals.reduce(
    (acc, v, k) => isStablecoin(k) ? acc + (Number(v.get('tokens')) + Number(v.get('bonusTokens'))) : acc,
    0
  );

  return Math.floor(totalStableCoinValue);
};

export const getEtherTotalTokens = totals => {
  const totalEtherValue = totals.reduce(
    (acc, v, k) => isEther(k) ? acc + (Number(v.get('tokens')) + Number(v.get('bonusTokens'))) : acc,
    0
  );

  return Math.floor(totalEtherValue);
};

export const formatTotals = (totals = Map()) => {
  const sizeFormatter = (currency, size) => {
    switch(currency) {
      case Currencies.FIAT:
        return Math.floor(fromCents(size));
      case Currencies.BTC:
        return fromSatoshi(size).toFixed(2);
      case Currencies.Ether:
      case Currencies.DAI:
      case Currencies['True USD']:
      case Currencies['Gemini USD']:
        return Number(fromFinney('ether', size)).toFixed(2);
    }
  };

  const format = currency => {
    const {
      bonusTokens,
      fiatValue,
      referralTokens,
      size,
      tokens,
      totalTokens
    } = getCurrencyTotal(totals, currency).toJS();

    return Map({
      bonusTokens: bonusTokens.toFixed(2),
      fiatValue: Math.floor(fromCents(fiatValue)),
      referralTokens: referralTokens.toFixed(2),
      size: sizeFormatter(currency, size),
      tokens: tokens.toFixed(2),
      totalTokens: totalTokens.toFixed(2)
    });
  };

  const getGrandTotal = () => totals.reduce(
    (acc, v, k) => currencyExists(k) ? acc + v.get('fiatValue') : acc,
    0
  );

  return Map({
    [Currencies.FIAT]: format(Currencies.FIAT),
    [Currencies.BTC]: format(Currencies.BTC),
    [Currencies.Ether]: format(Currencies.Ether),
    [Currencies.DAI]: format(Currencies.DAI),
    [Currencies['True USD']]: format(Currencies['True USD']),
    [Currencies['Gemini USD']]: format(Currencies['Gemini USD']),
    totalTokens: Number(totals.get('totalTokens', 0).toFixed(2)),
    stablecoinsFiatValue: getStablecoinTotalFiatValue(totals),
    grandTotal: Math.floor(fromCents(getGrandTotal(totals)))

  });
};

export const formatCurrency = (amount, currency) => {
  switch(currency) {
    case Currencies.FIAT:
      return Number(amount).toFixed(2);
    case Currencies.BTC:
      return Number(amount).toFixed(5);
    case Currencies.Ether:
    case Currencies.DAI:
    case Currencies['True USD']:
    case Currencies['Gemini USD']:
      return Number(amount).toFixed(5);
    default:
      return amount;
  }
};

export const normalizeCurrency = (amount, currency) => {
  switch(currency) {
    case Currencies.FIAT:
      return toCents(amount);
    case Currencies.BTC:
      return toSatoshi(Number(amount))
    case Currencies.Ether:
    case Currencies.DAI:
    case Currencies['True USD']:
    case Currencies['Gemini USD']:
      return toFinneyNumber('ether', amount);
    default:
      return amount;
  }
};

export const formatPositionSize = (amount, currency) => {
  switch(currency) {
    case Currencies.FIAT:
      return `${toLocaleString(amount, 2)} $`;
    case Currencies.BTC:
      return `${toLocaleString(amount, 5)} BTC`;
    case Currencies.Ether:
      return `${toLocaleString(amount, 5)} ETH`;
    case Currencies.DAI:
      return `${toLocaleString(amount, 5)} DAI`;
    case Currencies['True USD']:
      return `${toLocaleString(amount, 5)} TUSD`;
    case Currencies['Gemini USD']:
      return `${toLocaleString(amount, 5)} GUSD`;
    default:
      return `${amount}`;
  }
};

export const getDepositBalance = (balance, currency) => {
  switch(currency) {
    case Currencies.FIAT:
      return fromCents(formatCurrency(balance, Currencies.FIAT));
    case Currencies.BTC:
      return fromSatoshi(formatCurrency(balance, Currencies.BTC));
    case Currencies.Ether:
      return fromFinney('ether', formatCurrency(balance, Currencies.Ether));
    case Currencies.DAI:
      return fromFinney('ether', formatCurrency(balance, Currencies.DAI));
    case Currencies['True USD']:
      return fromFinney('ether', formatCurrency(balance, Currencies['True USD']));
    case Currencies['Gemini USD']:
      return fromFinney('ether', formatCurrency(balance, Currencies['Gemini USD']));
    default:
      return balance;
  }
};

