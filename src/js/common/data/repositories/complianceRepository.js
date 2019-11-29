const {runQuery} = require('../query');
const {unwrapCypherResult, normalizeParams} = require('../utils');

const readPendingCheckpoints = async () => {
  try {
    const result = await runQuery(
      `
        MATCH (cp:Checkpoint)
        WHERE cp.status = 'pending'
        RETURN cp
      `
    );
    return unwrapCypherResult(result, 'cp');
  }
  catch(error) {
    throw new Error(`Error finding pending checkpoints due to: ${error.message}`);
  }
};

const updatePendingCheckpoint = async checkpointAddress => {
  try {
    const result = await runQuery(
      `
        MATCH (cp:Checkpoint {checkpointAddress: '${checkpointAddress}'})
        WHERE cp.status = 'pending'
        SET cp.status = 'ready'
      `
    );
    return unwrapCypherResult(result, 'cp');
  }
  catch(error) {
    throw new Error(`Error updating pending checkpoint with address ${checkpointAddress} due to: ${error.message}`);
  }
};

const readTokenCheckpoints = async tokenAddress => {
  try {
    const result = await runQuery(
      `
        MATCH (n:Token {address: '${tokenAddress}'})-[:HAS_CHECKPOINT]->(cp)
        RETURN cp{
          .*,
          checkpointAddress: cp.checkpointAddress,
          tclRepositoryAddress: n.tclRepositoryAddress,
          tokenAddress: n.address
        }
      `
    );
    return unwrapCypherResult(result, 'cp');
  }
  catch(error) {
    throw new Error(`Error finding checkpoints for token ${tokenAddress} due to ${error.message}`);
  }
};

const saveCheckpoint = async (
  tokenAddress,
  checkpointName,
  checkpointCode,
  checkpointInterface,
  checkpointAddress
) => {
  try {
    const result = await runQuery(
      `
        MATCH (n:Token {address: '${tokenAddress}'})
        CREATE (n)-[:HAS_CHECKPOINT]->(cp:Checkpoint {
          checkpointAddress: '${checkpointAddress}',
          checkpointName: '${checkpointName}',
          checkpointCode: ${Number(checkpointCode)},
          checkpointInterface: '${checkpointInterface}',
          status: 'pending'
        })
      `
    );
    return unwrapCypherResult(result);
  }
  catch(error) {
    throw new Error(`Error linking checkpoint ${checkpointName} to token ${tokenAddress} due to ${error.message}`);
  }
};

const saveCheckpointsBatch = async checkpoints => {
  try {
    const result = await runQuery(
      `
        UNWIND $checkpoints AS checkpoint
        MATCH (n:Token {address: checkpoint.token})
        CREATE (n)-[:HAS_CHECKPOINT]->(cp:Checkpoint {
          checkpointAddress: checkpoint.checkpointAddress,
          checkpointName: checkpoint.checkpointName,
          checkpointCode: checkpoint.checkpointCode,
          checkpointInterface: checkpoint.checkpointInterface,
          status: 'ready'
        })
      `,
      {checkpoints}
    );
    return unwrapCypherResult(result);
  }
  catch(error) {
    throw new Error('Error saving checkpoints batch');
  }
};

const hardDeleteCheckpoints = async () => {
  try {
    const result = await runQuery(
      `
        MATCH (cp:Checkpoint)
        DETACH DELETE cp
      `
    );
    return unwrapCypherResult(result);
  }
  catch(error) {
    throw new Error('Error hard deleting checkpoints');
  }
};

module.exports = {
  readPendingCheckpoints: normalizeParams(readPendingCheckpoints),
  updatePendingCheckpoint: normalizeParams(updatePendingCheckpoint),
  readTokenCheckpoints: normalizeParams(readTokenCheckpoints),
  saveCheckpoint: normalizeParams(saveCheckpoint),
  hardDeleteCheckpoints: normalizeParams(hardDeleteCheckpoints),
  saveCheckpointsBatch: normalizeParams(saveCheckpointsBatch)
};
