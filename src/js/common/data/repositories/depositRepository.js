const Maybe = require('folktale/maybe');
const {List, fromJS} = require('immutable');
const {constant} = require('../../fn');
const {runQuery} = require('../query');
const {Currencies} = require('../../../common/data/constants');
const {ORGANIC_CONTRIBUTION_TYPE} = require('../../../common/constants');
const {
  constructCreateMatchString,
  unwrapCypherResult,
  unwrapCypherSingleResult,
  createPaginationResult,
  normalizeParams
} = require('../utils');

const saveBatchEthDeposit = async deposits => {
  try {
    const result = await runQuery(
      `
        UNWIND $deposits AS deposit
        MATCH (u:User)-[:HAS_ETH]->(e:ETH)
        WHERE e.address = deposit.beneficiary
        MERGE (u)-[:HAS_ETH_DEPOSIT]->(d:Deposit {txHash:deposit.txHash})
        ON CREATE SET d += {
          size:deposit.size, 
          currency:deposit.currency,
          time:deposit.time,
          softDeleted: false,
          createdAt:${Date.now()}
        } 
        RETURN d { .*, 
          userId: u.userId
        }
      `,
      {deposits}
    );

    return unwrapCypherResult(result, 'd');
  }
  catch(error) {
    throw new Error(`Error saving batch ETH deposits due to ${error.message}`);
  }
};

const saveBatchBtcDeposit = async deposits => {
  try {
    const result = await runQuery(
      `
        UNWIND $deposits AS deposit
        MATCH (u:User)-[:HAS_BTC]->(b:BTC {address:deposit.address})
        MERGE (u)-[:HAS_BTC_DEPOSIT]->(d:Deposit {txHash:deposit.txHash})
        ON CREATE SET d += {
          size:deposit.size, 
          currency:deposit.currency,
          time:deposit.time,
          status:deposit.status,
          softDeleted: false,
          createdAt:${Date.now()}
        } 
        ON MATCH SET d += {
          status:deposit.status,
          updatedAt:${Date.now()}
        }
        RETURN d { .*, 
          userId: u.userId
        }
      `,
      {deposits}
    );

    return unwrapCypherResult(result, 'd');
  }
  catch(error) {
    throw new Error(`Error saving batch BTC deposits due to ${error.message}`);
  }
};

const saveBatchFiatDeposit = async deposits => {
  try {
    const result = await runQuery(
      `
        UNWIND $deposits AS deposit
        MATCH (u:User {userId:deposit.userId})
        MERGE (u)-[:HAS_FIAT_DEPOSIT]->(d:Deposit {txHash:deposit.txHash})
        ON CREATE SET d += {
          softDeleted:false,
          size:deposit.size, 
          currency:deposit.currency,
          time:deposit.time,
          type:"${ORGANIC_CONTRIBUTION_TYPE}",
          createdAt:${Date.now()}
        } 
        RETURN d {.*, userId: u.userId}
      `,
      {deposits}
    );

    return unwrapCypherResult(result, 'd');
  }
  catch(error) {
    throw new Error(`Error saving batch FIAT deposits: ${error.message}`);
  }
};

const readDeposits = async userId => {
  try {
    const matchStr = userId
      ? constructCreateMatchString({userId})
      : '';

    const result = await runQuery(
      `
      MATCH (u:User ${matchStr})-[:HAS_FIAT_DEPOSIT]->(d:Deposit)
      RETURN d {.*, userId: u.userId}
      ORDER BY d.time DESC
      UNION
      MATCH (u:User ${matchStr})-[:HAS_BTC_DEPOSIT]->(d:Deposit)
      RETURN d {.*, userId: u.userId}
      ORDER BY d.time DESC
      UNION
      MATCH (u:User ${matchStr})-[:HAS_ETH_DEPOSIT]->(d:Deposit)
      RETURN d {.*, userId: u.userId}
      ORDER BY d.time DESC
      `
    );

    return unwrapCypherResult(result, 'd')
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
    throw new Error(`Error loading deposits for ${userId}: ${error.message}`);
  }
};

const readRawDeposits = async (userId, {
  skip,
  limit,
  order = 'desc',
  orderBy = 'time'
}) => {
  try {
    const matchStr = userId
      ? constructCreateMatchString({userId})
      : '';

    const result = await runQuery(
      `
      MATCH (u:User ${matchStr})-[]->(d:Deposit)
      RETURN d {.*, userId: u.userId}
      ORDER BY d['${orderBy}'] ${order}
      SKIP ${skip}
      LIMIT ${limit}     
      `
    );

    const countResult = await runQuery(
      `
      MATCH (u:User ${matchStr})-[]->(d:Deposit)
      RETURN count(d) as total
      `
    );

    return createPaginationResult(
      'deposits',
      result,
      countResult,
      'd'
    );
  }
  catch(error) {
    throw new Error(`Error loading raw deposits for ${userId}: ${error.message}`);
  }
};

const readCurrencyDeposits = depositType => async (userId, currency) => {
  try {
    const matchStr = userId
      ? constructCreateMatchString({userId})
      : '';

    const depositMatchStr = currency
      ? constructCreateMatchString({currency})
      : '';

    const result = await runQuery(
      `
        MATCH (u:User ${matchStr})-[:HAS_${depositType}_DEPOSIT]->(d:Deposit ${depositMatchStr})
        RETURN d {.*, userId: u.userId}
        ORDER BY d.time DESC
      `
    );

    return unwrapCypherResult(result, 'd');
  }
  catch(error) {
    throw new Error(`Error loading deposits for ${userId}: ${error.message}`);
  }
};

const readCurrencyDepositsTotal = depositType => async (userId, currency) => {
  try {
    const matchStr = userId
      ? constructCreateMatchString({userId})
      : '';

    const depositMatchStr = currency
      ? constructCreateMatchString({currency})
      : '';

    const result = await runQuery(
      `
        MATCH (u:User ${matchStr})-[:HAS_${depositType}_DEPOSIT]->(d:Deposit ${depositMatchStr})
        RETURN {total: SUM(d.size)} as total
      `
    );

    return unwrapCypherSingleResult(result, 'total');
  }
  catch(error) {
    throw new Error(`Error loading deposits total for ${userId}: ${error.message}`);
  }
};

const readAllDepositsForCurrency = async currency => {
  try {
    const result = await runQuery(
      `
      MATCH (u:User)-[:HAS_FIAT_DEPOSIT]->(d:Deposit)
      RETURN d {.*, userId: u.userId}
      ORDER BY d.time DESC
      UNION
      MATCH (u:User)-[:HAS_BTC_DEPOSIT]->(d:Deposit)
      RETURN d {.*, userId: u.userId}
      ORDER BY d.time DESC
      UNION
      MATCH (u:User)-[:HAS_ETH_DEPOSIT]->(d:Deposit)
      RETURN d {.*, userId: u.userId}
      ORDER BY d.time DESC
      `
    );

    return unwrapCypherResult(result, 'd').matchWith({
      Just: ({value}) => value.filter(c => c.get('currency') === currency),
      Nothing: () => ([])
    });
  }
  catch(error) {
    throw new Error(`Error reading deposits for ${currency}: ${error.message}`);
  }
};

const readDepositsForCurrencies = async (currencies, {
  skip,
  limit,
  order = 'desc',
  orderBy = 'time'
}) => {
  try {
    const result = await runQuery(
      `
      MATCH (u:User)-[]->(d:Deposit)
      WHERE d.currency IN ["${currencies.join('","')}"]
      RETURN d {.*, userId: u.userId}
      ORDER BY d['${orderBy}'] ${order}
      SKIP ${skip}
      LIMIT ${limit}
      `
    );

    const countResult = await runQuery(
      `
      MATCH (u:User)-[]->(d:Deposit)
      WHERE d.currency IN ["${currencies.join('","')}"]
      RETURN count(d) as total
      `
    );

    return createPaginationResult(
      'deposits',
      result,
      countResult,
      'd'
    );
  }
  catch(error) {
    throw new Error(`Error reading deposits for ${currencies}: ${error.message}`);
  }
};

module.exports = {
  saveBatchEthDeposit: normalizeParams(saveBatchEthDeposit),
  saveBatchBtcDeposit: normalizeParams(saveBatchBtcDeposit),
  saveBatchFiatDeposit: normalizeParams(saveBatchFiatDeposit),
  readDeposits: normalizeParams(readDeposits),
  readBtcDeposits: normalizeParams(readCurrencyDeposits(Currencies.BTC)),
  readEthDeposits: normalizeParams(readCurrencyDeposits(Currencies.Ether)),
  readFiatDeposits: normalizeParams(readCurrencyDeposits(Currencies.FIAT)),
  readBtcDepositsTotal: normalizeParams(readCurrencyDepositsTotal(Currencies.BTC)),
  readEthDepositsTotal: normalizeParams(readCurrencyDepositsTotal(Currencies.Ether)),
  readFiatDepositsTotal: normalizeParams(readCurrencyDepositsTotal(Currencies.FIAT)),
  readCurrencyDeposits: normalizeParams(readCurrencyDeposits),
  readRawDeposits: normalizeParams(readRawDeposits),
  readAllDepositsForCurrency: normalizeParams(readAllDepositsForCurrency),
  readDepositsForCurrencies: normalizeParams(readDepositsForCurrencies)
};
