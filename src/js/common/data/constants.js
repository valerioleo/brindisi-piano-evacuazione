const StageStrategies = {
  TIME_AND_TOKEN_BOUNDARY_STRATEGY: 0,
  TIME_BOUNDARY_STRATEGY: 1,
  TOKEN_BOUNDARY_STRATEGY: 2
};

const SettlementStatuses = {
  // The contribution is within the current stage restriction i.e. time and/or tokens raised
  STAGE_MATCH: 0,

  // The contribution is not within the current stage but meets the requirements of the next stage
  STAGE_MISMATCH: 1,

  // The contribution is not within the current stage and there is no other stage to allow this to be included in
  STAGE_NOT_FOUND: 2
};

const fromSettlementStatus = settlementStatus => {
  const {STAGE_MATCH, STAGE_MISMATCH, STAGE_NOT_FOUND} = SettlementStatuses;

  const cases = {
    [STAGE_MATCH]: 'Settled',
    [STAGE_MISMATCH]: 'Settled in different Stage',
    [STAGE_NOT_FOUND]: 'To be refunded'
  };

  return cases[settlementStatus];
};

const DistributionBatchStatuses = {
  PENDING: 0,
  SIGNED: 1,
  EXECUTING: 2,
  COMPLETED: 3,
  FAILED: 4
};

const distributionBatchStatus = batchStatus => {
  const {
    PENDING,
    SIGNED,
    EXECUTING,
    COMPLETED,
    FAILED
  } = DistributionBatchStatuses;

  const cases = {
    [PENDING]: 'Pending',
    [SIGNED]: 'Signed',
    [EXECUTING]: 'Executing',
    [COMPLETED]: 'Completed',
    [FAILED]: 'Failed'
  }

  return cases[batchStatus];
}

const Currencies = {
  BTC: 'BTC',
  FIAT: 'FIAT',
  Ether: 'ETH',
  DAI: 'DAI',
  'True USD': 'TrueUSD',
  'Gemini USD': 'GUSD'
};

const CurrencySymbols = Object.entries(Currencies).map(([k, v]) => v);
const currencyExists = currency => CurrencySymbols.includes(currency);
const isStablecoin = currency => currency === Currencies.DAI
  || currency === Currencies['True USD']
  || currency === Currencies['Gemini USD'];

const isEther = currency => currency === Currencies.Ether;

const getCurrencyName = currency => Object.entries(Currencies)
  .find(([_, value]) => value === currency)
  [0];

module.exports = {
  SettlementStatuses,
  StageStrategies,
  fromSettlementStatus,
  Currencies,
  CurrencySymbols,
  currencyExists,
  isStablecoin,
  getCurrencyName,
  isEther,
  distributionBatchStatus,
  DistributionBatchStatuses
};
