const {Map} = require('immutable');
const {SettlementStatuses: {STAGE_NOT_FOUND}} = require('../constants');
const {unwrapCypherResult} = require('../utils');

const validFiatContributions = (userNode = 'u', matchClause = '') => `
  ${matchClause}
  MATCH (${userNode})-[:HAS_FIAT_CONTRIBUTION]->(fiat:Contribution {softDeleted: false})
  WHERE fiat.settlementStatus <> ${STAGE_NOT_FOUND}
`;

const validBTCContributions = (userNode = 'u', matchClause = '') => `
  ${matchClause}
  MATCH (${userNode})-[:HAS_BTC_CONTRIBUTION]->(btc:Contribution {status: "confirmed"})
  WHERE btc.settlementStatus <> ${STAGE_NOT_FOUND}
`;

const validETHContributions = (userNode = 'u', matchClause = '') => `
  ${matchClause}
  MATCH (${userNode})-[:HAS_ETH_CONTRIBUTION]->(eth:Contribution)
  WHERE eth.settlementStatus <> ${STAGE_NOT_FOUND}
`;

// returns a single entry what finds the sums for this currency
const validFiatContributionsAgg = (userNode = 'u', matchClause = '', returnValues = '') => `
    ${matchClause}
    MATCH (${userNode})-[:HAS_FIAT_CONTRIBUTION]->(fiat:Contribution {softDeleted: false})
    WHERE fiat.settlementStatus <> ${STAGE_NOT_FOUND}
    RETURN sum(fiat.tokens) as tokens,
      sum(fiat.bonus) as bonusTokens, 
      sum(fiat.referralTokens) AS referralTokens, 
      sum(fiat.size) AS fiatValue, 
      sum(fiat.size) AS size,
      fiat.currency as currency
      ${returnValues}
  `;

// returns a single entry what finds the sums for this currency
const validBTCContributionsAgg = (userNode = 'u', matchClause = '', returnValues = '') => `
  ${matchClause}
  MATCH (${userNode})-[:HAS_BTC_CONTRIBUTION]->(btc:Contribution {status: "confirmed"})
  WHERE btc.settlementStatus <> ${STAGE_NOT_FOUND}
  RETURN sum(btc.tokens) as tokens,
    sum(btc.bonus) as bonusTokens,
    sum(btc.referralTokens) AS referralTokens, 
    sum(btc.fiatValue) AS fiatValue, 
    sum(btc.size) AS size,
    btc.currency as currency 
    ${returnValues}
`;

// returns a single entry what finds the sums for the different currencies i.e. eth, dai ...
const validETHContributionsAgg = (userNode = 'u', matchClause = '', returnValues = '') => `
  ${matchClause}
  MATCH (${userNode})-[:HAS_ETH_CONTRIBUTION]->(eth:Contribution)
  WHERE eth.settlementStatus <> ${STAGE_NOT_FOUND}
  RETURN sum(eth.tokens) as tokens,
    sum(eth.bonus) as bonusTokens,
    sum(eth.referralTokens) AS referralTokens,  
    sum(eth.fiatValue) AS fiatValue, 
    sum(eth.size) AS size,
    eth.currency as currency 
    ${returnValues}
`;

const contributionAggregate = (userNode = 'u', matchClause = '', returnValues = '') => `
  ${validFiatContributionsAgg(userNode, matchClause, returnValues)}
  UNION
  ${validBTCContributionsAgg(userNode, matchClause, returnValues)}
  UNION
  ${validETHContributionsAgg(userNode, matchClause, returnValues)}
`;

const groupByCurrency = result => {
  const getTotalTokens = v => v.get('tokens')
    + v.get('bonusTokens')
    + v.get('referralTokens');

  const sumReducer = (acc, v) => acc
    .set('tokens', acc.get('tokens', 0) + v.get('tokens'))
    .set('bonusTokens', acc.get('bonusTokens', 0) + v.get('bonusTokens'))
    .set('referralTokens', acc.get('referralTokens', 0) + v.get('referralTokens'))
    .set('fiatValue', acc.get('fiatValue', 0) + v.get('fiatValue'))
    .set('size', acc.get('size', 0) + v.get('size'))
    .set('totalTokens', acc.get('totalTokens', 0) + getTotalTokens(v));

  return unwrapCypherResult(result)
    .map(totals => totals
      .groupBy(v => v.get('currency'))
      .map(currencyContributions => currencyContributions.reduce(sumReducer, Map())));
};

const groupByTokenRecipientAddress = result => {
  const sumReducer = (acc, v) => acc
    + v.get('tokens')
    + v.get('bonusTokens')
    + v.get('referralTokens');

  return unwrapCypherResult(result)
    .map(totals => totals
      .groupBy(v => v.get('recipientAddress'))
      .map((currencyContributions, recipientAddress) => Map({
        recipientAddress,
        tokens: currencyContributions.reduce(sumReducer, 0)
      })).valueSeq());
};

const getTokensPlusBonus = result => {
  const sumReducer = (acc, v) => acc
  + v.get('tokens')
  + v.get('bonusTokens');

  return groupByCurrency(result)
    .map(totals => {
      const totalTokens = totals.reduce(sumReducer, 0);
      return Map({totalTokens});
    });
};

const getTotalTokens = contributionTotals => {
  const sumReducer = (acc, v) => acc
    + v.get('tokens')
    + v.get('bonusTokens')
    + v.get('referralTokens');

  return contributionTotals
    .map(totals => {
      const totalTokens = totals.reduce(sumReducer, 0);
      return Map({totalTokens});
    });
};

module.exports = {
  validFiatContributions,
  validBTCContributions,
  validETHContributions,
  contributionAggregate,
  getTokensPlusBonus,
  getTotalTokens,
  groupByCurrency,
  groupByTokenRecipientAddress
};
