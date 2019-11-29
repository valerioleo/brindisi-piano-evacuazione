const uuid4 = require('uuid/v4');
const {runQuery} = require('../query');
const {
  unwrapCypherResult,
  unwrapCypherSingleResult,
  constructCreateMatchString,
  normalizeQueries
} = require('../utils');
const {TRANSACTION_STATES} = require('../../constants');

const createTransaction = async (transactionData = {}) => {
  try {
    const {
      tags = [],
      ...rest
    } = transactionData;
    const properties = constructCreateMatchString({
      status: TRANSACTION_STATES.WAITING_FOR_TX_HASH,
      ...rest
    });

    const result = await runQuery(
      `
        CREATE (t:Transaction ${properties})
        SET t += {
          tags: $tags,
          id: $id
        }
        RETURN t
      `,
      {tags, id: uuid4()}
    );

    return unwrapCypherSingleResult(result, 't');
  }
  catch(error) {
    throw new Error(`Error creating transaction: ${error.message}`);
  }
};

const readTransactions = async (filters = {}) => {
  const transactionsFilter = constructCreateMatchString(filters);

  try {
    const result = await runQuery(
      `
      MATCH (t:Transaction ${transactionsFilter})
      RETURN t
      ORDER BY t.createdAt DESC
      `
    );
    return unwrapCypherResult(result, 't');
  }
  catch(error) {
    throw new Error(`Error reading Transactions with filter ${JSON.stringify(filters)}: ${error.message}`);
  }
};

const updateTransaction = async (id, update) => {
  try {
    const idString = constructCreateMatchString({id});
    const properties = constructCreateMatchString(update);

    const result = await runQuery(
      `
        MATCH (t:Transaction ${idString})
        SET t += ${properties}
        RETURN t
      `
    );

    return unwrapCypherSingleResult(result, 't');
  }
  catch(error) {
    throw new Error(`Error updating Transaction ${id}: ${error.message}`);
  }
};

const updateTransactionsStatusBatch = async (transactions, status) => {
  try {
    const result = await runQuery(
      `
        UNWIND $transactions AS transaction
        MATCH (t:Transaction {id: transaction.id})
        SET t.status=${status}
        RETURN t
     `,
      {transactions}
    );

    return unwrapCypherResult(result, 't');
  }
  catch(error) {
    throw new Error(`Error updating transaction batch: ${error.message}`);
  }
};

const connectTransactionTokenBatch = async pairs => {
  try {
    const result = await runQuery(
      `
        UNWIND $pairs AS pair
        MATCH (tr:Transaction {id: pair.transactionId})
        MATCH (tk:Token {address: pair.tokenAddress})
        MERGE (tr)<-[:TRIGGERED_BY]-(tk)
        WITH {
          transaction: tr,
          token: tk
        } AS res
        RETURN res 
      `,
      {pairs}
    );

    return unwrapCypherSingleResult(result, 'res');
  }
  catch(error) {
    throw new Error(`Error creating transaction-token connection: ${error.message}`);
  }
};

const connectTransactionPositionBatch = async positions => {
  try {
    const result = await runQuery(
      `
        UNWIND $positions AS position
        MATCH (tr:Transaction {txHash: position.txHash})
        MATCH (p:Position {txHash: position.txHash})
        MERGE (tr)<-[:TRIGGERED_BY]-(p)
        WITH {
          transaction: tr,
          position: p
        } AS res
        RETURN res 
      `,
      {positions}
    );

    return unwrapCypherSingleResult(result, 'res');
  }
  catch(error) {
    throw new Error(`Error creating transaction-position connection: ${error.message}`);
  }
};

const readTransaction = async (filters = {}) => {
  const transactionsFilter = constructCreateMatchString(filters);

  try {
    const result = await runQuery(
      `
        MATCH (t:Transaction ${transactionsFilter})
        RETURN t
      `
    );

    return unwrapCypherSingleResult(result, 't');
  }
  catch(error) {
    throw new Error(`Error reading Transaction with filter ${JSON.stringify(filters)}: ${error.message}`);
  }
};

const connectTransactionCheckpointBatch = async pairs => {
  try {
    const result = await runQuery(
      `
        UNWIND $pairs AS pair
        MATCH (tr:Transaction)
        WHERE ID(tr)=pair.transactionId
        MATCH (cp:Checkpoint {checkpointAddress: pair.checkpointAddress})
        MERGE (tr)<-[:TRIGGERED_BY]-(cp)
        WITH {
          transaction: tr,
          checkpoint: cp
        } AS res
        RETURN res 
      `,
      {pairs}
    );

    return unwrapCypherSingleResult(result, 'res');
  }
  catch(error) {
    throw new Error(`Error creating transaction-checkpoint connection: ${error.message}`);
  }
};

const readTransactionAction = async id => {
  try {
    const result = await runQuery(
      `
        MATCH (tr:Transaction {id: $id})
        MATCH (tr)<-[:TRIGGERED_BY]-(a)
        WITH {
          transaction: tr,
          triggered: a {
            .*,
            id: ID(a)
          }
        } AS res
        RETURN res 
      `,
      {id}
    );

    return unwrapCypherSingleResult(result, 'res');
  }
  catch(error) {
    throw new Error(`Error reading action for transaction ${id}: ${error.message}`);
  }
};

module.exports = normalizeQueries({
  createTransaction,
  readTransactions,
  updateTransaction,
  updateTransactionsStatusBatch,
  connectTransactionTokenBatch,
  readTransaction,
  readTransactionAction,
  connectTransactionPositionBatch,
  connectTransactionCheckpointBatch
});
