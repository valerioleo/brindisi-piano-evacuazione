const {runQuery} = require('../query');
const {
  unwrapCypherResult,
  unwrapCypherSingleResult,
  normalizeParams,
  constructCreateMatchString
} = require('../utils');
const {ZERO_ADDRESS} = require('../../../eth-utils/data/v1/address');

const getTransfers = async params => {
  const {
    tokenAddress,
    fromDate = 0,
    toDate = Date.now(),
    senders = [],
    receivers = [],
    inclusive = true
  } = params;

  const filterByUsers = `AND (t.from IN $senders ${inclusive ? 'AND' : 'OR'} t.to IN $receivers)`;

  try {
    const result = await runQuery(
      `
        MATCH (n:Token ${constructCreateMatchString({address: tokenAddress})})-[HAS_TRANSFER]->(t:TokenTransfer)
        WHERE t.createdAt >= ${fromDate} AND t.createdAt <= ${toDate}
        ${senders.length || receivers.length ? filterByUsers : ''}
        RETURN t {
          .*,
          id: ID(t)
        }
        ORDER BY t.createdAt DESC
        `, {senders, receivers}
    );

    return unwrapCypherResult(result, 't');
  }
  catch(error) {
    throw Error(`Failed getting the transfers: ${error.message}`);
  }
};

const getTokenHolders = async (tokenAddress, limit = 10, skip = 0) => {
  try {
    const result = await runQuery(
      `
      MATCH (n:Token {address: '${tokenAddress.toLowerCase()}'})-[HAS_HOLDER]->(h:TokenHolder)
      WHERE NOT h.address = '${ZERO_ADDRESS}'
      RETURN h
      ORDER BY h.balance DESC
      SKIP ${skip}
      LIMIT ${limit}
      `
    );

    return unwrapCypherResult(result, 'h');
  }
  catch(error) {
    throw Error(`Failed getting Token Holders: ${error.message}`);
  }
};

const getTokenHoldersTillDate = async (tokenAddress, date) => {
  try {
    const result = await runQuery(
      `
      MATCH (n:Token {address: '${tokenAddress.toLowerCase()}'})-[HAS_TRANSFER]->(t:TokenTransfer)
      WHERE t.createdAt < ${date}
      WITH t.from as from, t.to as to
      UNWIND [from, to] as holders
      RETURN DISTINCT holders
      `
    );

    return unwrapCypherResult(result, 'holders');
  }
  catch(error) {
    throw Error(`Failed getting the the token Holders: ${error.message}`);
  }
};

const getTokenHolderLastTransferOnDate = async (tokenAddress, tokenHolder, date) => {
  try {
    const result = await runQuery(
      `
      MATCH (n:Token {address: '${tokenAddress.toLowerCase()}'})-[HAS_TRANSFER]->(t:TokenTransfer)
      WHERE (t.from='${tokenHolder}' OR t.to='${tokenHolder}') AND t.createdAt <= ${date}
      RETURN t
      ORDER BY t.createdAt DESC
      LIMIT 1
      `
    );

    return unwrapCypherSingleResult(result, 't');
  }
  catch(error) {
    throw Error(`Failed getting the the token Holders: ${error.message}`);
  }
};

module.exports = {
  getTransfers: normalizeParams(getTransfers),
  getTokenHolders: normalizeParams(getTokenHolders),
  getTokenHoldersTillDate: normalizeParams(getTokenHoldersTillDate),
  getTokenHolderLastTransferOnDate: normalizeParams(getTokenHolderLastTransferOnDate)
};
