const {runQuery} = require('../query');
const {
  unwrapCypherResult,
  unwrapCypherSingleResult,
  normalizeParams
} = require('../utils');

const createDistributionContract = async distAddress => {
  try {
    const result = await runQuery(
      `
        CREATE (dc:DistributionContract {address: "${distAddress}", softDeleted: false})
        RETURN dc {
          .*,
          id: ID(dc)
        }
      `
    );
    return unwrapCypherSingleResult(result, 'dc');
  }
  catch(error) {
    throw new Error(`Error saving new DistributionContract with address ${distAddress} due to: ${error.message}`);
  }
};

const readDistributionContracts = async () => {
  try {
    const result = await runQuery(
      `
        MATCH (dc:DistributionContract)
        RETURN dc {
          .*,
          id: ID(dc)
        }
      `
    );

    return unwrapCypherResult(result, 'dc');
  }
  catch(error) {
    throw new Error(`Error reading distribution contracts: ${error.message}`);
  }
};

const deleteDistributionContracts = async () => {
  try {
    await runQuery(
      `
        MATCH (dc:DistributionContract)
        DETACH DELETE dc
      `
    );
  }
  catch(error) {
    throw new Error(`Error deleting all DistributionContracts due to: ${error.message}`);
  }
};

const hardDeleteDistributionEvents = async () => {
  try {
    await runQuery(
      `
        MATCH (de:DistributionEvent)
        OPTIONAL MATCH (de)-[]-(n)
        DETACH DELETE de, n
      `
    );
  }
  catch(error) {
    throw new Error(`Error deleting all DistributionEvents due to: ${error.message}`);
  }
};

const deleteDistributionEvents = async () => {
  try {
    await runQuery(
      `
        MATCH (de:DistributionEvent)
        OPTIONAL MATCH (de)-[]-(n)
        SET de.softDeleted=true
      `
    );
  }
  catch(error) {
    throw new Error(`Error deleting all DistributionEvents due to: ${error.message}`);
  }
};

const createDistributionFile = async (
  userId,
  name,
  filePath,
  numOfTokens,
  numOfTransfers
) => {
  try {
    const result = await runQuery(
      `
        MATCH (u:User {userId: "${userId}"})
        MERGE (u)-[:HAS_DISTRIBUTION_FILE]->(df:DistributionFile {
          softDeleted:false,
          path:"${filePath}", 
          name: "${name}",
          numOfTokens:${numOfTokens},
          numOfTransfers:${numOfTransfers}
        })
        RETURN df {
          .*,
          id: ID(df)
        }
      `
    );

    return unwrapCypherSingleResult(result, 'df');
  }
  catch(error) {
    throw new Error(`Error saving distribution file ${filePath} for user ${userId} due to: ${error.message}`);
  }
};

const createDistributionEvent = async (userId, distAddress, fileId) => {
  const appendFileQuery = () => (
    fileId
      ? (
        `
          WITH de
          MATCH (df:DistributionFile)
          WHERE ID(df)=${Number(fileId)}
          MERGE (de)-[:HAS_DISTRIBUTION_FILE]->(df)
        `
      )
      : ''
  );

  try {
    const result = await runQuery(
      `
        MATCH (dc:DistributionContract {address: "${distAddress}"})
        CREATE (dc)-[:HAS_DISTRIBUTION_EVENT]->(de:DistributionEvent {
          initiatedBy: "${userId}", 
          timestamp: ${Date.now()},
          status:'pending',
          softDeleted: false
        })

        ${appendFileQuery()}

        RETURN de {
          .*,
          id:ID(de)
        }
      `
    );
    return unwrapCypherSingleResult(result, 'de');
  }
  catch(error) {
    throw new Error(`Error saving distribution event from user ${userId} due to: ${error.message}`);
  }
};

const cloneDistributionEvent = async (userId, eventId) => {
  try {
    const result = await runQuery(
      `
        MATCH (dc:DistributionContract)-[:HAS_DISTRIBUTION_EVENT]->(de:DistributionEvent)
        WHERE ID(de)=${eventId}
        CREATE (newEvent:DistributionEvent {
          status: "pending",
          initiatedBy: "${userId}",
          timestamp: ${Date.now()},
          softDeleted: false
        })
        CREATE (dc)-[:HAS_DISTRIBUTION_EVENT]->(newEvent)-[:IS_COPY_OF]->(de)
        WITH de, newEvent

        MATCH(de)-[:HAS_DISTRIBUTION_BATCH]->(db:DistributionBatch)
        MERGE (newEvent)-[:HAS_DISTRIBUTION_BATCH {status: 0}]->(db)
        WITH de, newEvent

        OPTIONAL MATCH (de)-[:HAS_DISTRIBUTION_FILE]->(df:DistributionFile)
        WITH newEvent, collect(df) as distributionFiles

        FOREACH(f in distributionFiles |
          MERGE (newEvent)-[:HAS_DISTRIBUTION_FILE]->(f)
        )

        RETURN newEvent{
          .*,
          id: ID(newEvent)
        }
      `
    );

    return unwrapCypherSingleResult(result, 'newEvent');
  }
  catch(error) {
    throw new Error(`Error while cloning event ${eventId} for user ${userId} due to: ${error.message}`);
  }
};

const readDistributionEventFile = async eventId => {
  try {
    const result = await runQuery(
      `
        MATCH (de:DistributionEvent {softDeleted: false})
        WHERE ID(de)=${Number(eventId)}

        MATCH (de)-[:HAS_DISTRIBUTION_FILE]->(df:DistributionFile)

        RETURN df {
          .*,
          id: ID(df)
        }
      `
    );

    return unwrapCypherSingleResult(result, 'df');
  }
  catch(error) {
    throw new Error(`Error reading distribution files: ${error.message}`);
  }
};

const readDistributionFiles = async () => {
  try {
    const result = await runQuery(
      `
        MATCH (df:DistributionFile)
        OPTIONAL MATCH (df)<-[:HAS_DISTRIBUTION_FILE]-(de:DistributionEvent)

        RETURN df{
          .*,
          id: ID(df),
          usedInEvent: collect(ID(de))
        }
      `
    );

    return unwrapCypherResult(result, 'df');
  }
  catch(error) {
    throw new Error(`Error reading distribution files: ${error.message}`);
  }
};

const readDistributionFile = async fileId => {
  try {
    const result = await runQuery(
      `
        MATCH (df:DistributionFile)
        WHERE ID(df)=${Number(fileId)}
        OPTIONAL MATCH (df)<-[:HAS_DISTRIBUTION_FILE]-(de:DistributionEvent)
        RETURN df{
          .*,
          id:ID(df),
          usedInEvent: collect(ID(de))
        }
      `
    );

    return unwrapCypherSingleResult(result, 'df');
  }
  catch(error) {
    throw new Error(`Error reading distribution file ${fileId}: ${error.message}`);
  }
};

const readDistributionEvents = async distAddress => {
  try {
    const result = await runQuery(
      `
        MATCH (dc:DistributionContract {address: "${distAddress}"})-[HAS_DISTRIBUTION_EVENT]->(de:DistributionEvent {softDeleted: false})
        OPTIONAL MATCH success=(de)-[:HAS_DISTRIBUTION_BATCH {status: 3}]->(db:DistributionBatch)
        WITH de, COUNT(success) AS success
        OPTIONAL MATCH failures=(de)-[:HAS_DISTRIBUTION_BATCH {status: 4}]->(db:DistributionBatch)
        WITH de, success, COUNT(failures) AS failures
        OPTIONAL MATCH (de)-[:HAS_DISTRIBUTION_FILE]->(df:DistributionFile)
        WITH de, success, failures, df
        ORDER BY de.timestamp DESC
        RETURN de {
          .*,
          id: ID(de),
          distributionFileId: ID(df),
          distributionFileName: df.name,
          success:success,
          failures:failures,
          status: de.status
        }
      `
    );

    return unwrapCypherResult(result, 'de');
  }
  catch(error) {
    throw new Error(`Error reading distribution events: ${error.message}`);
  }
};

const readDistributionEvent = async eventId => {
  try {
    const result = await runQuery(
      `
        MATCH (dc:DistributionContract)-[:HAS_DISTRIBUTION_EVENT]->(de:DistributionEvent {softDeleted: false})
        WHERE ID(de)=${Number(eventId)}

        OPTIONAL MATCH completed=(de)-[:HAS_DISTRIBUTION_BATCH {status: 3}]->(db:DistributionBatch)
        WITH dc, de, SUM(SIZE(db.addresses)) AS completedBatches

        OPTIONAL MATCH signed=(de)-[hdb:HAS_DISTRIBUTION_BATCH]->(db:DistributionBatch)
        WHERE EXISTS(hdb.batchSignature)
        WITH dc, de, completedBatches, COUNT(signed) AS signed

        OPTIONAL MATCH (de)-[hdb:HAS_DISTRIBUTION_BATCH]->(db:DistributionBatch)
        WITH dc, de, db, signed, completedBatches, hdb

        OPTIONAL MATCH (de)-[:HAS_DISTRIBUTION_FILE]->(df:DistributionFile)
        WITH dc, de, db,  signed, completedBatches, df, hdb,
          CASE
            WHEN db IS NULL THEN NULL
            ELSE { 
              id: ID(db),
              blockNumber:db.blockNumber,
              status:hdb.status,
              txHash:hdb.txHash,
              addressCount:SIZE(db.addresses),
              batchSignature:hdb.batchSignature
              } 
            END
        as distributionBatches 

        ORDER BY de.timestamp DESC
        RETURN de {
          .*,
          id:ID(de),
          signed:signed,
          addressCount:SUM(SIZE(db.addresses)),
          transfersCompleted:completedBatches,
          distributionValue:SUM(db.batchValue),
          distributionFileId: ID(df),
          distributionFileName: df.name,
          distributionBatches: collect(distributionBatches),
          distributionContract: dc.address,
          status: de.status
        }
      `
    );

    return unwrapCypherSingleResult(result, 'de');
  }
  catch(error) {
    throw new Error(`Error reading distribution event ${eventId}: ${error.message}`);
  }
};

const createDistributionBatch = async (distributionEventId, addresses, balances, batchValue) => {
  try {
    const result = await runQuery(
      `
        MATCH (de:DistributionEvent {softDeleted: false})
        WHERE ID(de)=${Number(distributionEventId)}
        MERGE (de)-[hdb:HAS_DISTRIBUTION_BATCH {status: 0}]->(db:DistributionBatch {
          addresses:[value in ${JSON.stringify(addresses)} | toString(value)],
          balances:[value in ${JSON.stringify(balances)} | toString(value)],
          batchValue: ${batchValue}
        })
        RETURN db{
          .*,
          id:ID(db),
          status: hdb.status
        }
      `
    );

    return unwrapCypherSingleResult(result, 'db');
  }
  catch(error) {
    throw new Error(`Error creating distribution batch: ${error.message}`);
  }
};

const readBatchByAddresses = async (distributionEventId, addresses) => {
  try {
    const result = await runQuery(
      `
        MATCH (d:DistributionEvent)-[hdb:HAS_DISTRIBUTION_BATCH]->(db:DistributionBatch)
        WHERE ID(d)=${Number(distributionEventId)} 
          AND [value in ${JSON.stringify(addresses)} | toString(value)] = db.addresses
        RETURN db {
          .*,
          id: ID(db),
          blockNumber:hdb.blockNumber,
          status:hdb.status,
          txHash:hdb.txHash,
          addressCount:SIZE(db.addresses),
          input:hdb.input
        }
      `
    );

    return unwrapCypherSingleResult(result, 'db');
  }
  catch(error) {
    throw new Error(`Error reading distribution batch by addresses: ${error.message}`);
  }
};

const updateDistributionBatch = async (eventId, batchId, txHash, txData, status) => {
  try {
    const {
      blockNumber,
      input,
      transactionIndex
    } = txData;

    const result = await runQuery(
      `
        MATCH (de:DistributionEvent {softDeleted: false})-[hdb:HAS_DISTRIBUTION_BATCH]->(db:DistributionBatch)
        WHERE ID(de)=${eventId} AND ID(db)=${batchId}
        SET hdb += {
          status:${Number(status)},
          blockNumber:${Number(blockNumber)},
          transactionIndex:${Number(transactionIndex)},
          input: "${input}",
          txHash: "${txHash}"
        }
        RETURN hdb{
          .*,
          batchValue: db.batchValue,
          balances: db.balances,
          addresses: db.addresses,
          id:ID(db)
        }
      `
    );

    return unwrapCypherSingleResult(result, 'hdb');
  }
  catch(error) {
    throw new Error(`Error updating distribution batch for ${txHash}: ${error.message}`);
  }
};

const readDistributionBatch = async (distributionEventId, batchId) => {
  try {
    const result = await runQuery(
      `
        MATCH (de:DistributionEvent {softDeleted: false})-[hdb:HAS_DISTRIBUTION_BATCH]->(db:DistributionBatch)
        WHERE ID(de)=${distributionEventId} AND ID(db)=${Number(batchId)}
        RETURN hdb{
          .*,
          id: ID(db),
          blockNumber: hdb.blockNumber,
          transactionIndex: hdb.transactionIndex,
          input: hdb.input,
          txHash: hdb.txHash,
          batchSignature: hdb.batchSignature,
          addressCount:SIZE(db.addresses),
          addresses: db.addresses,
          balances: db.balances,
          batchValue: db.batchValue,
          input: hdb.input
        }
      `
    );

    return unwrapCypherSingleResult(result, 'hdb');
  }
  catch(error) {
    throw new Error(`Error reading distribution batch ${batchId}: ${error.message}`);
  }
};

const readDistributionBatchByAddress = async (distributionEventId, address) => {
  try {
    const result = await runQuery(
      `
        MATCH (de:DistributionEvent {softDeleted: false})-[hdb:HAS_DISTRIBUTION_BATCH]->(db:DistributionBatch)
        WHERE ID(de)=${distributionEventId} AND "${address}" in db.addresses
        RETURN hdb{
          .*,
          id: ID(db),
          blockNumber: hdb.blockNumber,
          transactionIndex: hdb.transactionIndex,
          input: hdb.input,
          txHash: hdb.txHash,
          batchSignature: hdb.batchSignature,
          addressCount:SIZE(db.addresses),
          addresses: db.addresses,
          balances: db.balances,
          batchValue: db.batchValue,
          input: hdb.input
        }
      `
    );

    return unwrapCypherSingleResult(result, 'hdb');
  }
  catch(error) {
    throw new Error(`Error reading distribution batches: ${error.message}`);
  }
};

const deleteDistributionFile = async fileId => {
  try {
    await runQuery(
      `
        MATCH (d:DistributionFile)
        WHERE ID(d)=${Number(fileId)}
        SET d.softDeleted=true
        RETURN d
      `
    );
  }
  catch(error) {
    throw new Error(`Error deleting distribution file ${fileId}: ${error.message}`);
  }
};

const deleteDistributionFiles = async () => {
  try {
    await runQuery(
      `
        MATCH (d:DistributionFile)
        DETACH DELETE d
      `
    );
  }
  catch(error) {
    throw new Error(`Error deleting distribution files: ${error.message}`);
  }
};

const saveDistributionContractsBatch = async distributions => {
  try {
    const result = await runQuery(
      `
      UNWIND $distributions AS distribution
      MERGE (dc:DistributionContract {address: distribution.tokenDistribution})
      ON CREATE SET dc += {
        tokenAddress: distribution.token,
        txHash: distribution.txHash,
        softDeleted:false,
        nonce:0
      }
      RETURN dc
      `,
      {distributions}
    );

    return unwrapCypherSingleResult(result, 'dc');
  }
  catch(error) {
    throw new Error(`Error saving distribution contract: ${error.message}`);
  }
};

const saveDistributionContract = async (distAddress, tokenAddress, txHash) => {
  try {
    const result = await runQuery(
      `
      MERGE (dc:DistributionContract {address: '${distAddress}'})
      ON CREATE SET dc += {
        tokenAddress: '${tokenAddress}',
        txHash: '${txHash}',
        softDeleted:false,
        nonce:0
      }
      RETURN dc
      `
    );

    return unwrapCypherSingleResult(result, 'dc');
  }
  catch(error) {
    throw new Error(`Error saving distribution contract: ${error.message}`);
  }
};

const getDistributionContracts = async (skip = 0, limit = 100000) => {
  try {
    const result = await runQuery(
      `
      MATCH (dc:DistributionContract {softDeleted: false})
      RETURN dc
      SKIP ${skip}
      LIMIT ${limit}
      `
    );

    return unwrapCypherResult(result, 'dc');
  }
  catch(error) {
    throw new Error(`Error loading distribution contracts due to ${error.message}`);
  }
};

const saveLastDistributionSuccessfullBlock = async height => {
  try {
    const result = await runQuery(
      `
        MERGE (dd:DistributionDeployment {exists:true})
        ON CREATE SET dd.lastSuccessfullHeight=${height}
        ON MATCH SET dd.lastSuccessfullHeight=${height}
        RETURN dd
      `
    );

    return unwrapCypherSingleResult(result, 'dd');
  }
  catch(error) {
    throw new Error(`Error getting max block height due to ${error.message}`);
  }
};

const getLastDistributionSuccessfullBlock = async () => {
  try {
    const result = await runQuery(
      `
      MATCH (dd:DistributionDeployment)
      RETURN dd
      `
    );

    return unwrapCypherSingleResult(result, 'dd');
  }
  catch(error) {
    throw new Error(`Error getting last block height due to ${error.message}`);
  }
};

const deleteDistributionContract = async distAddress => {
  try {
    const result = await runQuery(
      `
      MATCH (dc:DistributionContract {address: '${distAddress}'})
      SET dc.softDeleted=true
      RETURN dc
      `
    );

    return unwrapCypherSingleResult(result, 'dc');
  }
  catch(error) {
    throw new Error(`Error removing Distribution Contract with address ${distAddress} due to ${error.message}`);
  }
};

const hardDeleteDistributionContract = async distAddress => {
  try {
    const result = await runQuery(
      `
      MATCH (dc:DistributionContract {address: '${distAddress}'})
      DETACH DELETE dc
      `
    );

    return unwrapCypherSingleResult(result, 'dc');
  }
  catch(error) {
    throw new Error(`Error hard deleting Distribution Contract with address ${distAddress} due to ${error.message}`);
  }
};

const hardDeleteDistributionContracts = async () => {
  try {
    const result = await runQuery(
      `
      MATCH (dc:DistributionContract)
      DETACH DELETE dc
      `
    );
    return unwrapCypherSingleResult(result, 'dc');
  }
  catch(error) {
    throw new Error(`Error deleting Distribution Contracts due to ${error.message}`);
  }
};

const getDistributionContract = async distributionAddress => {
  try {
    const result = await runQuery(
      `
      MATCH (dc:DistributionContract {address: '${distributionAddress}', softDeleted: false})
      RETURN dc
      `
    );

    return unwrapCypherSingleResult(result, 'dc');
  }
  catch(error) {
    throw new Error(`Error loading distribution contracts due to ${error.message}`);
  }
};

const readDistributionNonce = async distAddress => {
  try {
    const result = await runQuery(
      `
       MATCH (dc:DistributionContract {address: '${distAddress}'})
       RETURN dc.nonce
      `
    );
    return unwrapCypherSingleResult(result, 'dc.nonce');
  }
  catch(error) {
    throw new Error(`Error reading distribution nonce due to ${error.message}`);
  }
};

const storeBatchSignature = async (distributionEventId, batchId, signature, nonce) => {
  try {
    const result = await runQuery(
      `
        MATCH (de:DistributionEvent {softDeleted: false})-[hdb:HAS_DISTRIBUTION_BATCH]->(db:DistributionBatch)
        WHERE ID(de)=${distributionEventId} AND ID(db)=${batchId}
        SET hdb += {
          batchSignature:'${signature}',
          nonce: '${nonce}',
          status: 1
        }
        WITH de, hdb, db

        MATCH (dc:DistributionContract)-[:HAS_DISTRIBUTION_EVENT]->(de)
        WHERE ID(de)=${distributionEventId} 
        SET dc.nonce=dc.nonce+1

        RETURN hdb{
          .*,
          batchValue: db.batchValue,
          balances: db.balances,
          addresses: db.addresses
        }
      `
    );
    return unwrapCypherSingleResult(result, 'hdb');
  }
  catch(error) {
    throw new Error(`Error storing batch signature due to ${error.message}`);
  }
};

const updateDistributionEventStatus = async (eventId, status) => {
  try {
    const result = await runQuery(
      `
        MATCH (de:DistributionEvent)
        WHERE ID(de)=${eventId}
        SET de += {
          status:'${status}'
        }
        RETURN de
      `
    );
    return unwrapCypherSingleResult(result, 'de');
  }
  catch(error) {
    throw new Error(`Error updating distribution event status for event ${eventId} due to: ${error.message}`);
  }
};

const getRunningDistributions = async () => {
  try {
    const result = await runQuery(
      `
        MATCH (de:DistributionEvent {status: 'executing', softDeleted: false})
        RETURN de {
          .*,
          id: ID(de)
        }
        ORDER BY de.id DESC
      `
    );
    return unwrapCypherResult(result, 'de');
  }
  catch(error) {
    throw new Error(`Error reading running distributions due to: ${error.message}`);
  }
};

const deleteDistributionEvent = async eventId => {
  try {
    await runQuery(
      `
        MATCH (de:DistributionEvent {status: 'pending'})
        OPTIONAL MATCH (de)-[]-(n)
        WHERE ID(de)=${eventId}
        SET de.softDeleted=true
      `
    );
  }
  catch(error) {
    throw new Error(`Error deleting DistributionEvents ${eventId} due to: ${error.message}`);
  }
};

module.exports = {
  createDistributionContract: normalizeParams(createDistributionContract),
  readDistributionContracts: normalizeParams(readDistributionContracts),
  deleteDistributionContract: normalizeParams(deleteDistributionContract),
  hardDeleteDistributionContract: normalizeParams(hardDeleteDistributionContract),
  deleteDistributionContracts: normalizeParams(deleteDistributionContracts),
  deleteDistributionEvents: normalizeParams(deleteDistributionEvents),
  createDistributionFile: normalizeParams(createDistributionFile),
  readDistributionFiles: normalizeParams(readDistributionFiles),
  createDistributionEvent: normalizeParams(createDistributionEvent),
  cloneDistributionEvent: normalizeParams(cloneDistributionEvent),
  readDistributionEvents: normalizeParams(readDistributionEvents),
  readDistributionFile: normalizeParams(readDistributionFile),
  readDistributionEvent: normalizeParams(readDistributionEvent),
  readDistributionEventFile: normalizeParams(readDistributionEventFile),
  createDistributionBatch: normalizeParams(createDistributionBatch),
  updateDistributionBatch: normalizeParams(updateDistributionBatch),
  readDistributionBatch: normalizeParams(readDistributionBatch),
  readBatchByAddresses: normalizeParams(readBatchByAddresses),
  deleteDistributionFile: normalizeParams(deleteDistributionFile),
  deleteDistributionFiles: normalizeParams(deleteDistributionFiles),
  saveDistributionContractsBatch: normalizeParams(saveDistributionContractsBatch),
  saveDistributionContract: normalizeParams(saveDistributionContract),
  getDistributionContracts: normalizeParams(getDistributionContracts),
  saveLastDistributionSuccessfullBlock: normalizeParams(saveLastDistributionSuccessfullBlock),
  getLastDistributionSuccessfullBlock: normalizeParams(getLastDistributionSuccessfullBlock),
  hardDeleteDistributionContracts: normalizeParams(hardDeleteDistributionContracts),
  storeBatchSignature: normalizeParams(storeBatchSignature),
  readDistributionNonce: normalizeParams(readDistributionNonce),
  updateDistributionEventStatus: normalizeParams(updateDistributionEventStatus),
  getDistributionContract: normalizeParams(getDistributionContract),
  getRunningDistributions: normalizeParams(getRunningDistributions),
  deleteDistributionEvent: normalizeParams(deleteDistributionEvent),
  hardDeleteDistributionEvents: normalizeParams(hardDeleteDistributionEvents),
  readDistributionBatchByAddress: normalizeParams(readDistributionBatchByAddress)
};
