const {runQuery} = require('../query');
const {
  unwrapCypherResult,
  normalizeParams,
  unwrapCypherSingleResult
} = require('../utils');

const storeVestingContractsBatch = async vestings => {
  try {
    const result = await runQuery(
      ` 
        UNWIND $vestings AS vesting
        MERGE (vc:VestingContract {address: vesting.tokenVesting})
        ON CREATE SET vc += {
          beneficiary: vesting.beneficiary,
          txHash: vesting.txHash,
          softDeleted: false
        }
        WITH vesting, vc

        MATCH (u:User)-[:HAS_TOKEN_RECIPIENT_ADDRESS]->(tr:TokenRecipientAddress {address: vesting.beneficiary})
        MERGE (u)-[:HAS_VESTING_CONTRACT]->(vc)
        RETURN vc {
          .*
        }
      `,
      {vestings}
    );

    return unwrapCypherResult(result, 'vc');
  }
  catch(error) {
    throw new Error(`Error saving vesting contract due to ${error.message}`);
  }
};

const storeVestingContract = async (address, beneficiary, txHash) => {
  try {
    const result = await runQuery(
      ` 
        MERGE (vc:VestingContract {address: '${address}'})
        ON CREATE SET vc += {
          beneficiary: '${beneficiary}',
          txHash: '${txHash}',
          softDeleted: false
        }
        WITH vc

        MATCH (u:User)-[:HAS_TOKEN_RECIPIENT_ADDRESS]->(tr:TokenRecipientAddress {address: '${beneficiary}'})
        MERGE (u)-[:HAS_VESTING_CONTRACT]->(vc)
        RETURN vc {
          .*
        }
      `
    );

    return unwrapCypherResult(result, 'vc');
  }
  catch(error) {
    throw new Error(`Error saving vesting contract due to ${error.message}`);
  }
};

const getVestingContracts = async (skip = 0, limit = 100000) => {
  try {
    const result = await runQuery(
      `
        MATCH (vc:VestingContract {softDeleted: false})<-[r:HAS_VESTING_CONTRACT]-(u:User)
        RETURN vc{
          .*,
          userId: u.userId
        }
        SKIP ${skip}
        LIMIT ${limit}
      `
    );

    return unwrapCypherResult(result, 'vc');
  }
  catch(error) {
    throw new Error(`Error getting vesting contract due to ${error.message}`);
  }
};

const getAllVestingContracts = async () => {
  try {
    const result = await runQuery(
      `
        MATCH (vc:VestingContract)<-[r:HAS_VESTING_CONTRACT]-(u:User)
        RETURN vc{
          .*,
          userId: u.userId
        }
      `
    );

    return unwrapCypherResult(result, 'vc');
  }
  catch(error) {
    throw new Error(`Error getting vesting contracts due to ${error.message}`);
  }
};

const deleteVestingContract = async address => {
  try {
    const result = await runQuery(
      `
        MATCH (vc:VestingContract {address: '${address}'})
        SET vc.softDeleted=true
        RETURN vc
      `
    );

    return unwrapCypherSingleResult(result, 'vc');
  }
  catch(error) {
    throw new Error(`Error deleting vesting contract due to ${error.message}`);
  }
};

const getLastSuccessfullBlock = async () => {
  try {
    const result = await runQuery(
      `
      MATCH (height:VestingDeployment)
      RETURN height
      `
    );
    return unwrapCypherResult(result);
  }
  catch(error) {
    throw new Error(`Error getting max block height due to ${error.message}`);
  }
};

const saveLastSuccessFullBlock = async (height = 0) => {
  try {
    const result = await runQuery(
      `
      MERGE (td:VestingDeployment {exists:true})
      ON CREATE SET td.lastSuccessfullHeight=${height}
      ON MATCH SET td.lastSuccessfullHeight=${height}
      RETURN td
      `
    );
    return unwrapCypherResult(result);
  }
  catch(error) {
    throw new Error(`Error saving max block height due to ${error.message}`);
  }
};

const hardDeleteVestingContracts = async () => {
  try {
    const result = await runQuery(
      `
        MATCH (vc:VestingContract)
        DELETE vc
      `
    );

    return unwrapCypherResult(result);
  }
  catch(error) {
    throw new Error(`Error hard deleting vesting contracts due to ${error.message}`);
  }
};

module.exports = {
  storeVestingContractsBatch: normalizeParams(storeVestingContractsBatch),
  storeVestingContract: normalizeParams(storeVestingContract),
  getVestingContracts: normalizeParams(getVestingContracts),
  deleteVestingContract: normalizeParams(deleteVestingContract),
  getLastSuccessfullBlock: normalizeParams(getLastSuccessfullBlock),
  saveLastSuccessFullBlock: normalizeParams(saveLastSuccessFullBlock),
  hardDeleteVestingContracts: normalizeParams(hardDeleteVestingContracts),
  getAllVestingContracts: normalizeParams(getAllVestingContracts)
};
