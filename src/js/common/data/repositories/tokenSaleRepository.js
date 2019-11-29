const {runQuery} = require('../query');
const {immutableGet} = require('../../fn');
const {
  getInteger,
  unwrapCypherResult,
  normalizeParams,
  unwrapCypherSingleResult
} = require('../utils');
const {
  contributionAggregate,
  groupByCurrency,
  groupByTokenRecipientAddress,
  getTotalTokens
} = require('./queryHelper');

const readContributorsCount = async () => {
  try {
    const countResult = await runQuery(
      `
        MATCH (u:User)-[:HAS_TOKEN_RECIPIENT_ADDRESS]->(tr:TokenRecipientAddress)
        WITH count(u) AS contributorsCount
        RETURN contributorsCount
      `
    );

    return getInteger(countResult[0].get('contributorsCount'));
  }
  catch(error) {
    throw new Error(`Error loading count of contributors due to ${error.message}`);
  }
};

const readTokensToMint = async () => {
  try {
    const result = await runQuery(contributionAggregate());
    const totals = groupByCurrency(result);

    return getTotalTokens(totals)
      .map(immutableGet('totalTokens'));
  }
  catch(error) {
    throw new Error(`Error reading tokens sold due to ${error.message}`);
  }
};

const loadTokensToSend = async (skip = 0, limit = 1000000) => {
  try {
    const matchClause = `
      MATCH (u:User {isVested: false})-[:HAS_TOKEN_RECIPIENT_ADDRESS]->(tr:TokenRecipientAddress)
      WITH u, tr
      SKIP ${skip}
      LIMIT ${limit}
    `;
    const result = await runQuery(
      `
        ${contributionAggregate('u', matchClause, ', tr.address AS recipientAddress')}
      `
    );

    return groupByTokenRecipientAddress(result);
  }
  catch(error) {
    throw new Error(`Error loading tokens to send due to ${error.message}`);
  }
};

const updateTokenSale = async (tokenAddress, {price, isOpen, fillPositionAutomatically}) => {
  try {
    const result = await runQuery(
      `
        MATCH (n:Token {address: '${tokenAddress}'})
        MERGE (n)-[r:HAS_SALE_INFO]->(b:TokenSale)
        ON MATCH SET b += {
          isOpen: ${isOpen},
          price: ${price},
          fillPositionAutomatically: ${fillPositionAutomatically}
        }
        ON CREATE SET b += {
          isOpen: ${isOpen},
          price: ${price},
          fillPositionAutomatically: ${fillPositionAutomatically}
        }
      `
    );
    return unwrapCypherResult(result);
  }
  catch(error) {
    throw new Error(`Error updating token sale due to: ${error.message}`);
  }
};

const readTokenSale = async tokenAddress => {
  try {
    const result = await runQuery(
      `
        MATCH (n:Token {address: '${tokenAddress}'})-[r:HAS_SALE_INFO]->(b:TokenSale)
        RETURN b {
          .*,
          id: ID(b)
        }
      `
    );
    return unwrapCypherSingleResult(result, 'b');
  }
  catch(error) {
    throw new Error(`Error reading token sale due to: ${error.message}`);
  }
};

const createTokenSaleBatch = async tokenAddresses => {
  try {
    const result = await runQuery(
      `
        UNWIND $tokenAddresses as tokenAddress
        MATCH (n:Token {address: tokenAddress})
        MERGE (n)-[r:HAS_SALE_INFO]->(b:TokenSale {
          isOpen: false,
          price: 1,
          fillPositionAutomatically: false
        })
      `,
      {tokenAddresses}
    );
    return unwrapCypherResult(result);
  }
  catch(error) {
    throw new Error(`Error creating token sale due to: ${error.message}`);
  }
};

module.exports = {
  loadTokensToSend: normalizeParams(loadTokensToSend),
  readContributorsCount: normalizeParams(readContributorsCount),
  readTokensToMint: normalizeParams(readTokensToMint),
  readTokenSale: normalizeParams(readTokenSale),
  updateTokenSale: normalizeParams(updateTokenSale),
  createTokenSaleBatch: normalizeParams(createTokenSaleBatch)
};
