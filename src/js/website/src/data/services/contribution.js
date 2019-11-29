export const contributionExists = (contributions = [], {txHash, currency}) => {
  const contribs = contributions.filter(c => c.currency === currency);
  const prop = 'txHash';
  const value = txHash;

  return contribs.some(c => c[prop] === value);
}

// returns the sum of fiat value of stablecoin contributions
export const getStablecoinSum = (currency, contributions = []) => contributions
  .get(currency)
  .reduce((acc, c) => c.get('fiatValue') +  acc, 0);
