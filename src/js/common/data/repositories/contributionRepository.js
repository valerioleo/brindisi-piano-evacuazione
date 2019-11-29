const Maybe = require('folktale/maybe');
const {List, fromJS} = require('immutable');
const {constant} = require('../../fn');
const {runQuery} = require('../query');
const {startOfDay, duration} = require('../../helpers/time');
const {Currencies} = require('../../../common/data/constants');
const {
  unwrapCypherSingleResult,
  constructCreateMatchString,
  createPaginationResult,
  unwrapCypherResult,
  constructFilters,
  normalizeParams
} = require('../utils');
const {ORGANIC_CONTRIBUTION_TYPE} = require('../../../common/constants');
const {SettlementStatuses: {STAGE_NOT_FOUND}} = require('../constants');
const {
  contributionAggregate,
  groupByCurrency,
  getTokensPlusBonus
} = require('./queryHelper');

const defaultFrom = () => {
  const now = new Date();

  return startOfDay(now) - duration.years(100);
};

const defaultUntil = () => {
  const now = new Date();

  return startOfDay(now) + duration.years(100);
};

const saveBatchBtcContribution = async contribs => {
  try {
    const result = await runQuery(
      `
        UNWIND $contribs AS contrib
        MATCH (u:User)-[:HAS_BTC]->(b:BTC {address:contrib.address})
        MERGE (u)-[:HAS_BTC_CONTRIBUTION]->(c:Contribution {txHash: contrib.txHash})
        ON CREATE SET c += {
          status:contrib.status,
          tokens:contrib.tokens,
          fiatValue:contrib.fiatValue,
          currency:contrib.currency,
          size:contrib.size,
          time:contrib.time,
          tokensSold:contrib.tokensSold,
          bonus:contrib.bonus,
          bonusPercentage:contrib.bonusPercentage,
          settlementStatus:contrib.settlementStatus,
          referralTokens:contrib.referralTokens,
          createdAt:${Date.now()}
        } 
        ON MATCH SET c += {
          status:contrib.status,
          tokens:contrib.tokens,
          fiatValue:contrib.fiatValue,
          currency:contrib.currency,
          size:contrib.size,
          time:contrib.time,
          tokensSold:contrib.tokensSold,
          bonus:contrib.bonus,
          bonusPercentage:contrib.bonusPercentage,
          settlementStatus:contrib.settlementStatus,
          referralTokens:contrib.referralTokens,
          updatedAt:${Date.now()}
        } 
        RETURN c { .*, 
          userId: u.userId, 
          fiatValue:contrib.fiatValue, 
          tokens:contrib.tokens, 
          currency: contrib.currency,
          size:contrib.size, 
          status:contrib.status, 
          time:contrib.time,
          tokensSold:contrib.tokensSold,
          bonus:contrib.bonus,
          bonusPercentage:contrib.bonusPercentage,
          settlementStatus:contrib.settlementStatus,
          referralTokens:contrib.referralTokens
        }
      `,
      {contribs}
    );

    return unwrapCypherResult(result, 'c');
  }
  catch(error) {
    throw new Error(`Error saving batch btc contributions due to ${error.message}`);
  }
};

const saveBatchEthContribution = async contribs => {
  try {
    const result = await runQuery(
      `
        UNWIND $contribs AS contrib
        MATCH (u:User)-[:HAS_ETH]->(e:ETH)
        WHERE e.address = contrib.beneficiary
        MERGE (u)-[:HAS_ETH_CONTRIBUTION]->(c:Contribution {txHash: contrib.txHash})
        ON CREATE SET c += {
          tokens:contrib.tokens, 
          fiatValue:contrib.fiatValue,
          currency:contrib.currency,
          size:contrib.size, 
          time:contrib.time,
          currency:contrib.currency,
          tokensSold:contrib.tokensSold,
          bonus:contrib.bonus,
          bonusPercentage:contrib.bonusPercentage,
          settlementStatus:contrib.settlementStatus,
          referralTokens:contrib.referralTokens
        } 
        RETURN c { .*, 
          userId: u.userId,
          fiatValue:contrib.fiatValue, 
          txHash:contrib.txHash, 
          tokens:contrib.tokens, 
          size:contrib.size, 
          time:contrib.time,
          currency:contrib.currency,
          tokensSold:contrib.tokensSold,
          bonus:contrib.bonus,
          bonusPercentage:contrib.bonusPercentage,
          settlementStatus:contrib.settlementStatus,
          referralTokens:contrib.referralTokens
        }
      `,
      {contribs}
    );

    return unwrapCypherResult(result, 'c');
  }
  catch(error) {
    throw new Error(`Error saving batch ETH contributions due to ${error.message}`);
  }
};

const saveBatchFiatContribution = async contribs => {
  try {
    const result = await runQuery(
      `
        UNWIND $contribs AS contrib
        MATCH (u:User {userId:contrib.userId})
        MERGE (u)-[:HAS_FIAT_CONTRIBUTION]->(c:Contribution {txHash:contrib.txHash})
        ON CREATE SET c += {
          softDeleted:false,
          tokens:contrib.tokens, 
          size:contrib.size, 
          currency:contrib.currency,
          time:contrib.time,
          type:"${ORGANIC_CONTRIBUTION_TYPE}",
          tokensSold:contrib.tokensSold,
          bonus:contrib.bonus,
          bonusPercentage:contrib.bonusPercentage,
          settlementStatus:contrib.settlementStatus,
          referralTokens:contrib.referralTokens
        } 
        RETURN c { .*, 
          userId: u.userId
        }
      `,
      {contribs}
    );

    return unwrapCypherResult(result, 'c');
  }
  catch(error) {
    throw new Error(`Error saving batch FIAT contributions due to ${error.message}`);
  }
};

const saveFiatContribution = async contribution => {
  const {
    userId,
    size,
    tokens,
    txHash,
    currency,
    time,
    tokensSold,
    bonus,
    bonusPercentage,
    settlementStatus,
    type = ORGANIC_CONTRIBUTION_TYPE,
    referralTokens = 0
  } = contribution;

  try {
    const result = await runQuery(
      `
        MATCH (u:User {userId:"${userId}"})
        MERGE (u)-[:HAS_FIAT_CONTRIBUTION]->(c:Contribution {txHash:"${txHash}"}) 
        ON CREATE SET c += {
          softDeleted:false,
          tokens:${tokens}, 
          size:${size}, 
          currency:"${currency}",
          time:${time},
          type:"${type}",
          tokensSold:${tokensSold},
          bonus:${bonus},
          bonusPercentage:${bonusPercentage},
          settlementStatus:${settlementStatus},
          referralTokens:${referralTokens}
        } 
        WITH c
        RETURN c{ .*, 
          softDeleted:false,
          userId:"${userId}", 
          txHash:"${txHash}", 
          size:${size}, 
          currency:"${currency}",
          tokensSold:${tokensSold},
          bonus:${bonus},
          bonusPercentage:${bonusPercentage},
          settlementStatus:${settlementStatus}
        }
      `
    );

    return unwrapCypherSingleResult(result, 'c');
  }
  catch(error) {
    throw new Error(`Error saving fiat contribution for ${userId} due to ${error.message}`);
  }
};

const setManualContributionStatus = async ({txHash, softDeleted}) => {
  try {
    const result = await runQuery(
      `
        MATCH (c:Contribution {txHash: "${txHash}"})
        SET c.softDeleted = ${softDeleted}
        RETURN c
      `
    );

    return unwrapCypherSingleResult(result, 'c');
  }
  catch(error) {
    throw new Error(`Error updating manual contribution status for contribution ${txHash} due to ${error.message}`);
  }
};

const saveFiatFailure = async (size, userId, txHash, currency, time) => {
  try {
    const result = await runQuery(
      `
        MERGE (f:FiatFailure ${constructCreateMatchString({
    size, userId, txHash, currency, time
  })}) 
        WITH f
        MATCH (u:User ${constructCreateMatchString({userId})})
        MERGE (u)-[:HAS_FIAT_FAILURE]->(f)
        RETURN f{ .*, size: ${size}, userId: "${userId}", txHash: "${txHash}", currency: "${currency}", time: ${time}}
      `
    );

    return unwrapCypherSingleResult(result, 'f');
  }
  catch(error) {
    throw new Error(`Error saving a fiat failure record for ${userId} due to ${error.message}`);
  }
};

const loadFiatFailures = async userId => {
  try {
    const matchStr = userId
      ? constructCreateMatchString({userId})
      : '';

    const result = await runQuery(
      `
      MATCH (u:User ${matchStr})-[:HAS_FIAT_FAILURE]->(f:FiatFailure)
      WITH f
      ORDER BY f.time DESC
      RETURN f{.*, id: ID(f)}
      `
    );

    return unwrapCypherResult(result, 'f');
  }
  catch(error) {
    throw new Error(`Error loading all fiat failures due to ${error.message}`);
  }
};

const loadFiatFailure = async failureId => {
  try {
    const result = await runQuery(
      `
      MATCH (f:FiatFailure)
      WHERE ID(f) = ${failureId}
      RETURN f{.*, id: ID(f)}
      `
    );

    return unwrapCypherSingleResult(result, 'f');
  }
  catch(error) {
    throw new Error(`Error loading fiat failure ${failureId} due to ${error.message}`);
  }
};

const deleteFiatFailure = async failureId => {
  try {
    return await runQuery(
      `
      MATCH (f:FiatFailure)
      WHERE ID(f)=${failureId}
      DETACH DELETE f
      `
    );
  }
  catch(error) {
    throw new Error(`Error deleting fiat failure ${failureId} due to ${error.message}`);
  }
};

const loadContributions = async userId => {
  try {
    const matchStr = userId
      ? constructCreateMatchString({userId})
      : '';

    const result = await runQuery(
      `
      MATCH (u:User ${matchStr})-[:HAS_FIAT_CONTRIBUTION]->(c:Contribution)
      RETURN c
      ORDER BY c.time DESC
      UNION
      MATCH (u:User ${matchStr})-[:HAS_BTC_CONTRIBUTION]->(c:Contribution)
      RETURN c
      ORDER BY c.time DESC
      UNION
      MATCH (u:User ${matchStr})-[:HAS_ETH_CONTRIBUTION]->(c:Contribution)
      RETURN c
      ORDER BY c.time DESC
      `
    );

    return unwrapCypherResult(result, 'c')
      .map(value => fromJS({
        [Currencies.FIAT]: value.filter(c => c.get('currency') === Currencies.FIAT),
        [Currencies.BTC]: value.filter(c => c.get('currency') === Currencies.BTC),
        [Currencies.Ether]: value.filter(c => c.get('currency') === Currencies.Ether),
        [Currencies.DAI]: value.filter(c => c.get('currency') === Currencies.DAI),
        [Currencies['True USD']]: value.filter(c => c.get('currency') === Currencies['True USD']),
        [Currencies['Gemini USD']]: value.filter(c => c.get('currency') === Currencies['Gemini USD'])
      }))
      .orElse(constant(Maybe.Just(
        fromJS({
          [Currencies.FIAT]: List([]),
          [Currencies.BTC]: List([]),
          [Currencies.Ether]: List([]),
          [Currencies.DAI]: List([]),
          [Currencies['True USD']]: List([]),
          [Currencies['Gemini USD']]: List([])
        })
      )));
  }
  catch(error) {
    throw new Error(`Error loading contributions for ${userId} due to ${error.message}`);
  }
};

const readContributions = currency => async (query = {}) => {
  try {
    const {
      from = defaultFrom(),
      until = defaultUntil(),
      skip = 0,
      limit = 1000000,
      ...filters
    } = query;

    const searchFilter = constructFilters('c', filters);
    const filterClause = searchFilter !== ''
      ? `
        ${searchFilter}
        AND c.time > ${from} AND c.time <= ${until}
      `
      : `WHERE c.time > ${from} AND c.time <= ${until}`;

    const contributionsResult = await runQuery(
      `
        MATCH (u:User)-[:HAS_${currency}_CONTRIBUTION]->(c:Contribution)
        WITH c
        ${filterClause}
        RETURN c
        ORDER BY c.time DESC
        SKIP ${skip}
        LIMIT ${limit}
      `
    );

    const countResult = await runQuery(
      `
        MATCH (c:Contribution)-[:HAS_${currency}_CONTRIBUTION]-(u:User)
        ${filterClause}
        WITH count(c) AS transactionsCount
        RETURN transactionsCount as total
      `
    );

    return createPaginationResult(
      'contributions',
      contributionsResult,
      countResult,
      'c'
    );
  }
  catch(error) {
    throw new Error(`Error reading ${currency} contributions due to ${error.message}`);
  }
};

const readOrphanContributions = async (query = {}) => {
  try {
    const {
      from = defaultFrom(),
      until = defaultUntil(),
      skip = 0,
      limit = 1000000,
      ...filters
    } = query;

    const searchFilter = constructFilters('c', filters);
    const filterClause = searchFilter !== ''
      ? `
        ${searchFilter}
        AND c.time > ${from} AND c.time <= ${until}
      `
      : `WHERE c.time > ${from} AND c.time <= ${until}`;

    const result = await runQuery(
      `
        MATCH (c:Contribution {settlementStatus: ${STAGE_NOT_FOUND}})
        ${filterClause}
        RETURN c
        ORDER BY c.time DESC
        SKIP ${skip}
        LIMIT ${limit}
      `
    );

    return unwrapCypherResult(result, 'c');
  }
  catch(error) {
    throw new Error(`Error reading orphan contributions due to ${error.message}`);
  }
};

// This is mainly used by the btc explorer; let's not mix it with
// readBtcContributions. We can turn it to one function
const readAllBtcContributions = async status => {
  try {
    const result = await runQuery(
      `
        MATCH (c:Contribution {status:"${status}"}), (u:User)
        WHERE (c)-[:HAS_BTC_CONTRIBUTION]-(u)
        RETURN c
      `
    );

    return unwrapCypherResult(result, 'c');
  }
  catch(error) {
    throw new Error(`Error loading BTC contributions due to ${error.message}`);
  }
};

// This is mainly used by the eth explorer; let's not mix it with
// readEthContributions. We can turn it to one function
const readAllEthContributions = async () => {
  try {
    const result = await runQuery(
      `
        MATCH (c:Contribution), (u:User)
        WHERE (c)-[:HAS_ETH_CONTRIBUTION]-(u)
        RETURN c
      `
    );

    return unwrapCypherResult(result, 'c');
  }
  catch(error) {
    throw new Error(`Error loading ETH contributions due to ${error.message}`);
  }
};

const readTokensAndBonus = async () => {
  try {
    const result = await runQuery(contributionAggregate());
    return getTokensPlusBonus(result);
  }
  catch(error) {
    throw new Error(`Error reding the tokens and bonuses sum ${error.message}`);
  }
};

const readContributionTotals = async userId => {
  try {
    const matchClause = userId
      ? `MATCH (u:User {userId: "${userId}"}) WITH u`
      : '';

    const result = await runQuery(contributionAggregate('u', matchClause));

    return groupByCurrency(result);
  }
  catch(error) {
    throw new Error(`Error loading contribution totals due to ${error.message}`);
  }
};

module.exports = {
  loadContributions: normalizeParams(loadContributions),
  saveBatchBtcContribution: normalizeParams(saveBatchBtcContribution),
  saveBatchEthContribution: normalizeParams(saveBatchEthContribution),
  saveBatchFiatContribution: normalizeParams(saveBatchFiatContribution),
  saveFiatContribution: normalizeParams(saveFiatContribution),
  setManualContributionStatus: normalizeParams(setManualContributionStatus),
  saveFiatFailure: normalizeParams(saveFiatFailure),
  loadFiatFailures: normalizeParams(loadFiatFailures),
  loadFiatFailure: normalizeParams(loadFiatFailure),
  deleteFiatFailure: normalizeParams(deleteFiatFailure),
  readAllBtcContributions: normalizeParams(readAllBtcContributions),
  readAllEthContributions: normalizeParams(readAllEthContributions),
  readOrphanContributions: normalizeParams(readOrphanContributions),
  readContributions: normalizeParams(readContributions),
  readContributionTotals: normalizeParams(readContributionTotals),
  readTokensAndBonus: normalizeParams(readTokensAndBonus)
};
