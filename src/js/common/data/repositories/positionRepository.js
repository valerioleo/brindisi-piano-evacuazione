const {List} = require('immutable');
const Maybe = require('folktale/maybe');
const logger = require('../../helpers/logger');
const {maybeValueReturn} = require('../../fn');
const {runQuery} = require('../query');
const {
  unwrapCypherResult,
  unwrapCypherSingleResult,
  constructCreateMatchString,
  createPaginationResult,
  getInteger,
  createMatchString,
  normalizeParams
} = require('../utils');

const createPosition = async (userId, token, size, currency, tokenAmount, txHash = '') => {
  try {
    const result = await runQuery(
      `
        CREATE (ps:Position {
          createdBy: '${userId}',
          token: '${token}',
          size: ${size},
          currency: '${currency}',
          state: 'open',
          softDeleted: false,
          createdAt: ${Date.now()},
          txHash: '${txHash}',
          tokenAmount: ${tokenAmount}
        })
        RETURN ps {
          .*,
          id: ID(ps)
        }
      `
    );
    return unwrapCypherResult(result, 'ps')
      .map(data => data.get(0));
  }
  catch(error) {
    throw new Error(`Error creating position due to ${error.message}`);
  }
};

const readPositions = async (query = {}, skip, limit, order = 'desc', orderBy = 'createdAt') => {
  try {
    const matchString = query
      ? constructCreateMatchString({...query, softDeleted: false})
      : '{softDeleted:false}';

    const result = await runQuery(
      `
        MATCH (ps:Position ${matchString})
        OPTIONAL MATCH (t:Token {address: ps.token})
        WITH t, ps
        OPTIONAL MATCH (u:User {userId: ps.createdBy})
        WITH t, ps, u 
        OPTIONAL MATCH (u:User {userId: ps.createdBy})-[r:HAS_TOKEN_RECIPIENT_ADDRESS]->(a)
        WITH t, ps, u, a
        RETURN ps {
          .*,
          userAddress: a.address,
          tokenAddress: t.address,
          name: t.name,
          userName: u.name,
          id: ID(ps)
        }
        ORDER BY ps['${orderBy}'] ${order}
        SKIP ${skip}
        LIMIT ${limit}
      `
    );

    const countResult = await runQuery(
      `
      MATCH (ps:Position ${matchString})
      RETURN count(ps)
      `
    );

    const tokenAmount = await runQuery(
      `
      MATCH (ps:Position ${matchString})
      RETURN SUM(ps.tokenAmount)
      `
    );

    return Maybe.Just({
      positions: unwrapCypherResult(result, 'ps').getOrElse(List([])),
      count: getInteger(countResult[0].get('count(ps)')),
      tokens: getInteger(tokenAmount[0].get('SUM(ps.tokenAmount)'))
    });
  }
  catch(error) {
    throw new Error(`Error getting open positions: ${error.message}`);
  }
};

const readPositionBalances = async (query = {}) => {
  const matchString = query
    ? constructCreateMatchString({...query, softDeleted: false})
    : '{softDeleted:false}';

  try {
    const result = await runQuery(
      `
        MATCH (ps:Position ${matchString})
        WITH ps.currency as currency, sum(ps.size) as size
        RETURN {currency: currency, size: size}
      `
    );

    return unwrapCypherResult(result, '{currency: currency, size: size}');
  }
  catch(error) {
    throw new Error(`Error getting positions balances: ${error.message}`);
  }
};

const readPositionsByUser = async (
  userId,
  {
    skip,
    limit,
    order = 'desc',
    orderBy = 'createdAt'
  }
) => {
  try {
    const result = await runQuery(
      `
        MATCH (ps:Position {
          softDeleted:false,
          createdBy:'${userId}'
        })
        MATCH (t:Token {address: ps.token})
        WITH ps, t
        RETURN ps {
          .*,
          name: t.name,
          id: ID(ps)
        }
        ORDER BY ps['${orderBy}'] ${order}
        SKIP ${skip}
        LIMIT ${limit}
      `
    );

    const countResult = await runQuery(
      `
        MATCH (ps:Position {
          softDeleted:false,
          createdBy:'${userId}'
        })
        RETURN count(ps) as total
      `
    );

    return createPaginationResult(
      'positions',
      result,
      countResult,
      'ps'
    );
  }
  catch(error) {
    throw new Error(`Error getting open positions due to ${error.message}`);
  }
};

const readPositionsByTokenAndState = async (token, query = {}) => {
  const matchString = query
    ? constructCreateMatchString({...query, softDeleted: false})
    : '{softDeleted:false}';

  try {
    const result = await runQuery(
      `
        MATCH (ps:Position ${matchString})
        WHERE ps.token='${token}'
        OPTIONAL MATCH (u:User {userId: ps.createdBy})-[r:HAS_TOKEN_RECIPIENT_ADDRESS]->(a)
        WITH ps, a, u
        RETURN ps {
          .*,
          userAddress: a.address,
          userName: u.name,
          id: ID(ps)
        }
        ORDER BY ps.createdAt DESC
      `
    );
    return unwrapCypherResult(result, 'ps');
  }
  catch(error) {
    throw new Error(`Error getting open positions due to ${error.message}`);
  }
};

const readPositionsByCurrencyAndUser = async (userId, currency, state) => {
  try {
    const result = await runQuery(
      `
        MATCH (ps:Position {
          state:'${state}',
          createdBy: '${userId}',
          currency: '${currency}',
          softDeleted:false
        })
        RETURN ps {
          .*,
          id: ID(ps)
        }
      `
    );
    return unwrapCypherResult(result, 'ps');
  }
  catch(error) {
    throw new Error(`Error getting ${currency} positions for ${userId} due to ${error.message}`);
  }
};

const readPositionsBalanceByCurrencyAndUser = async (userId, currency, state) => {
  try {
    const result = await runQuery(
      `
        MATCH (ps:Position {
          state:'${state}',
          createdBy: '${userId}',
          currency: '${currency}',
          softDeleted:false
        })
        RETURN SUM(ps.size) as total
      `
    );

    return unwrapCypherResult(result).map(r => r.get(0));
  }
  catch(error) {
    throw new Error(`Error getting ${currency} positions balance for ${userId} due to ${error.message}`);
  }
};

const readPosition = async id => {
  try {
    const result = await runQuery(
      `
        MATCH (ps:Position)
        WHERE ID(ps)=${id}
        RETURN ps {
          .*,
          id: ID(ps)
        }
      `
    );
    return unwrapCypherResult(result, 'ps')
      .map(v => v.get(0));
  }
  catch(error) {
    throw new Error(`Error getting position due to ${error.message}`);
  }
};

const readPositionByTxHash = async txHash => {
  try {
    const result = await runQuery(
      `
        MATCH (ps:Position {txHash: '${txHash}'})
        RETURN ps {
          .*,
          id: ID(ps)
        }
      `
    );
    return unwrapCypherSingleResult(result, 'ps');
  }
  catch(error) {
    throw new Error(`Error getting position with txHash ${txHash}: ${error.message}`);
  }
};

const updatePositionStateBatch = async (positions, state) => {
  try {
    const result = await runQuery(
      ` 
        UNWIND $positions AS position
        MATCH (ps:Position {txHash: position.txHash})
        SET ps += {
          state: '${state}',
          updatedAt: ${Date.now()}
        }
        RETURN ps {
          .*,
          id: ID(ps)
        }
      `,
      {positions}
    );
    return unwrapCypherResult(result, 'ps');
  }
  catch(error) {
    throw new Error(`Error updating position due to ${error.message}`);
  }
};

const deletePosition = async id => {
  try {
    const result = await runQuery(
      `
        MATCH (ps:Position)
        WHERE ID(ps)=${id}
        SET ps += {
          softDeleted: true
        }
        RETURN ps {
          .*,
          id: ID(ps)
        }
      `
    );
    return unwrapCypherResult(result, 'ps');
  }
  catch(error) {
    throw new Error(`Error getting position due to ${error.message}`);
  }
};

const hardDeletePositions = async () => {
  try {
    const result = await runQuery(
      `
        MATCH (ps:Position)
        DELETE ps
      `
    );
    return unwrapCypherResult(result);
  }
  catch(error) {
    throw new Error(`Error hard deleting positions due to ${error.message}`);
  }
};

const updatePositionFillingHash = async (id, txHash) => {
  try {
    const result = await runQuery(
      `
        MATCH (ps:Position)
        WHERE ID(ps)=${id}
        SET ps += {
          txHash: '${txHash}',
          status: 'pending',
          updatedAt: ${Date.now()}
        }
        RETURN ps {
          .*,
          id: ID(ps)
        }
      `
    );
    return unwrapCypherResult(result, 'ps');
  }
  catch(error) {
    throw new Error(`Error getting position due to ${error.message}`);
  }
};

const updatePosition = async (positionId, properties) => {
  try {
    const result = await runQuery(
      ` 
        MATCH (ps:Position)
        WHERE ID(ps) = ${positionId}
        SET ps += {
          ${createMatchString(properties)},
          updatedAt: ${Date.now()}
        }
        RETURN ps {
          .*,
          id: ID(ps)
        }
      `
    );
    return unwrapCypherResult(result, 'ps');
  }
  catch(error) {
    throw new Error(`Error updating position ${error.message}`);
  }
};

const getPendingPositions = async () => {
  try {
    const result = await runQuery(
      `
        MATCH (ps:Position {
          state: 'open',
          status: 'pending',
          softDeleted: ${false}
        })
        RETURN ps {
          .*,
          id: ID(ps)
        }
      `
    );
    return unwrapCypherResult(result, 'ps');
  }
  catch(error) {
    throw new Error(`Error getting pending positions ${error.message}`);
  }
};

module.exports = {
  createPosition: normalizeParams(createPosition),
  readPositions: normalizeParams(readPositions),
  readPosition: normalizeParams(readPosition),
  updatePositionStateBatch: normalizeParams(updatePositionStateBatch),
  deletePosition: normalizeParams(deletePosition),
  hardDeletePositions: normalizeParams(hardDeletePositions),
  readPositionsByCurrencyAndUser: normalizeParams(readPositionsByCurrencyAndUser),
  updatePositionFillingHash: normalizeParams(updatePositionFillingHash),
  readPositionsByUser: normalizeParams(readPositionsByUser),
  readPositionsByTokenAndState: normalizeParams(readPositionsByTokenAndState),
  updatePosition: normalizeParams(updatePosition),
  getPendingPositions: normalizeParams(getPendingPositions),
  readPositionsBalanceByCurrencyAndUser: normalizeParams(readPositionsBalanceByCurrencyAndUser),
  readPositionBalances: normalizeParams(readPositionBalances),
  readPositionByTxHash: normalizeParams(readPositionByTxHash)
};
