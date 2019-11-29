const Maybe = require('folktale/maybe');
const {runQuery} = require('../query');
const {
  unwrapCypherSingleResult,
  createPaginationResult,
  getCount,
  normalizeParams
} = require('../utils');

const createBounty = async bounty => {
  try {
    const result = await runQuery(
      `
      MERGE (b:Bounty {
        campaignName:"${bounty.campaignName}", 
        description:"${bounty.description}",
        startDate:${bounty.startDate},
        endDate:${bounty.endDate},
        tokensAllocated:${bounty.tokensAllocated},
        reward:${bounty.reward},
        isActive: true
      })
      RETURN b{.*, id:id(b)}
      `
    );

    return unwrapCypherSingleResult(result, 'b');
  }
  catch(error) {
    throw new Error(`Error creating a new bounty ${error.message}`);
  }
};

const deleteBounty = async bountyId => {
  try {
    await runQuery(
      `
      MATCH (b:Bounty)
      WHERE ID(b)=${bountyId}
      OPTIONAL MATCH ()-[hs:HAS_SUBMITTED]->(b)
      DETACH DELETE b, hs
      `
    );
    return Maybe.Just({bountyId});
  }
  catch(error) {
    throw new Error(`Error deleting bounty with bountyId ${bountyId}: ${error.message}`);
  }
};

const deleteBounties = async () => {
  try {
    const result = await runQuery(
      `
      MATCH (p:Bounty)
      DETACH DELETE p
      RETURN COUNT(p) as count
      `
    );

    return getCount(result);
  }
  catch(error) {
    throw new Error(`Error deleting bounties due to ${error.message}`);
  }
};

const readPartialBounties = async (query = {}) => {
  const {
    skip = 0,
    limit = 1000000
  } = query;

  try {
    const result = await runQuery(
      `
      MATCH (b:Bounty)
      OPTIONAL MATCH ()-[hs:HAS_SUBMITTED {isApproved:true}]->(b)
      RETURN b {.*, id:id(b), tokenRewards:COUNT(hs) * b.reward}
      ORDER BY b.startDate DESC
      SKIP ${skip}
      LIMIT ${limit}
      `
    );

    const countResult = await runQuery(
      `
      MATCH (b:Bounty)
      WITH count(b) AS bountiesCount
      RETURN bountiesCount as total
    `
    );

    return createPaginationResult(
      'bounties',
      result,
      countResult,
      'b'
    );
  }
  catch(error) {
    throw new Error(`Error reading bounties: ${error.message}`);
  }
};

const updateBountyStatus = async (bountyId, data) => {
  const {isActive} = data;

  try {
    const result = await runQuery(
      `
      MATCH (b:Bounty)
      WHERE ID(b)=${bountyId}
      SET b += {
        isActive:${isActive}
      }
      RETURN b{.*, id:ID(b)}
      `
    );
    return unwrapCypherSingleResult(result, 'b');
  }
  catch(error) {
    throw new Error(`Error updating bounty ${bountyId} status ${error.message}`);
  }
};

const updateFieldsBounty = async (bountyId, data) => {
  const {
    campaignName,
    description,
    reward,
    tokensAllocated
  } = data;
  const startDate = new Date(data.startDate).getTime();
  const endDate = new Date(data.endDate).getTime();

  try {
    const result = await runQuery(
      `
      MATCH (b:Bounty)
      WHERE ID(b)=${bountyId}
      SET b += {
        campaignName:"${campaignName}",
        description:"${description}",
        endDate:${endDate},
        reward:${reward},
        startDate:${startDate},
        tokensAllocated:${tokensAllocated}
      }
      RETURN b{.*, id:id(b)}
      `
    );

    return unwrapCypherSingleResult(result, 'b');
  }
  catch(error) {
    throw new Error(`Error updating bountyId ${bountyId} ${error.message}`);
  }
};

const getBountyById = async bountyId => {
  try {
    const result = await runQuery(
      `
      MATCH (b:Bounty)
      WHERE ID(b)=${bountyId}
      OPTIONAL MATCH ()-[hs:HAS_SUBMITTED {isApproved:true}]->(b)
      RETURN b {.*, id:id(b), tokenRewards:COUNT(hs) * b.reward}
      `
    );

    return unwrapCypherSingleResult(result, 'b');
  }
  catch(error) {
    throw new Error(`Error reading bounty ${bountyId}: ${error.message}`);
  }
};

const readUserBountyApplications = async (userId, query = {}) => {
  try {
    const {skip = 0, limit = 1000000} = query;

    const result = await runQuery(
      `
        MATCH (u:User {userId:"${userId}"})-[hs:HAS_SUBMITTED]->(b:Bounty)
        RETURN b {
          .*,
          application: hs {.*, id :ID(hs)},
          id: ID(b)
        }
        SKIP ${skip}
        LIMIT ${limit}
      `
    );

    const countResult = await runQuery(
      `
        MATCH (User {userId:"${userId}"})-[hs:HAS_SUBMITTED]->(Bounty)
        RETURN count(hs) AS total
      `
    );

    return createPaginationResult(
      'list',
      result,
      countResult,
      'b'
    );
  }
  catch(error) {
    throw new Error(`Error reading the bounty applications for ${userId} due to ${error.message}`);
  }
};

const readBountyApplications = async (bountyId, query) => {
  try {
    const {skip = 0, limit = 1000000} = query;

    const result = await runQuery(
      `
      MATCH (u:User)-[hs:HAS_SUBMITTED]->(b:Bounty)
      WHERE ID(b)=${bountyId}
      RETURN hs{.*, id: ID(b), userId:u.userId, applicationId:ID(hs)}
      SKIP ${skip}
      LIMIT ${limit}
      `
    );

    const countResult = await runQuery(
      `
      MATCH (u:User)-[hs:HAS_SUBMITTED]->(b:Bounty)
      WHERE ID(b)=${bountyId}
      RETURN count(hs) AS total
      `
    );

    return createPaginationResult(
      'list',
      result,
      countResult,
      'hs'
    );
  }
  catch(error) {
    throw new Error(`Error reading bounty applications for Bounty ${bountyId} ${error.message}`);
  }
};

const updateApproveBountyApplication = async ({
  bountyId, userId, isApproved, applicationId
}) => {
  try {
    const result = await runQuery(
      `
      MATCH (u:User {userId:"${userId}"})-[hs:HAS_SUBMITTED]->(b:Bounty)
      WHERE ID(b)=${bountyId} AND ID(hs)=${applicationId}
      SET hs += {isApproved:${isApproved}}
      RETURN hs{.*, applicationId:ID(hs), isApproved:${isApproved}}
      `
    );

    return unwrapCypherSingleResult(result, 'hs');
  }
  catch(error) {
    throw new Error(`Error updating the bounty application ${bountyId} ${error.message}`);
  }
};

const createBountyApplication = async (userId, {bountyId, link, message}) => {
  try {
    const result = await runQuery(
      `
      MATCH (u:User {userId:"${userId}"}), (b:Bounty {isActive:true})
      WHERE ID(b)=${bountyId}
      CREATE (u)-[hs:HAS_SUBMITTED {
        isApproved:false,
        link:"${link}",
        message:"${message}"
      }]->(b)
      RETURN hs{.*, applicationId:ID(hs)}
      `
    );

    return unwrapCypherSingleResult(result, 'hs');
  }
  catch(error) {
    throw new Error(`Error creating a new bounty application for user ${userId} ${error.message}`);
  }
};

const updateBountyApplication = async (userId, {applicationId, link, message}) => {
  try {
    const result = await runQuery(
      `
      MATCH (u:User {userId:"${userId}"})-[hs:HAS_SUBMITTED]->(b:Bounty)
      WHERE ID(hs)=${applicationId}
      SET hs += { 
        isApproved:false,
        link:"${link}",
        message:"${message}"
      }
      RETURN hs{.*, applicationId:ID(hs)}
      `
    );

    return unwrapCypherSingleResult(result, 'hs');
  }
  catch(error) {
    throw new Error(`Error updating bounty application ${applicationId} for user ${userId} ${error.message}`);
  }
};

const readUserApplicationForBounty = async (userId, bountyId) => {
  try {
    const result = await runQuery(
      `
      MATCH (u:User {userId:"${userId}"})-[hs:HAS_SUBMITTED]->(b:Bounty)
      WHERE ID(b)=${bountyId}
      RETURN hs {.*, id:ID(hs)}
      `
    );

    return unwrapCypherSingleResult(result, 'hs');
  }
  catch(error) {
    throw new Error(`Error user's ${userId} applications for bounty ${bountyId} ${error.message}`);
  }
};

const readTotalBountyTokensAssigned = async userId => {
  try {
    const matchStr = userId
      ? `{userId: "${userId}"}`
      : '';

    const result = await runQuery(
      `
        MATCH (User ${matchStr})-[HAS_SUBMITTED {isApproved: true}]->(b:Bounty {isActive: true})
        WITH sum(b.reward) as totalBountyTokensAssigned
        RETURN totalBountyTokensAssigned
      `
    );

    return unwrapCypherSingleResult(result, 'totalBountyTokensAssigned');
  }
  catch(error) {
    throw new Error(`Impossible reading the total bounty tokens assigned due to: ${error.message}`);
  }
};

module.exports = {
  createBounty: normalizeParams(createBounty),
  deleteBounty: normalizeParams(deleteBounty),
  deleteBounties: normalizeParams(deleteBounties),
  readPartialBounties: normalizeParams(readPartialBounties),
  updateBountyStatus: normalizeParams(updateBountyStatus),
  getBountyById: normalizeParams(getBountyById),
  updateFieldsBounty: normalizeParams(updateFieldsBounty),
  createBountyApplication: normalizeParams(createBountyApplication),
  updateBountyApplication: normalizeParams(updateBountyApplication),
  readBountyApplications: normalizeParams(readBountyApplications),
  updateApproveBountyApplication: normalizeParams(updateApproveBountyApplication),
  readUserBountyApplications: normalizeParams(readUserBountyApplications),
  readUserApplicationForBounty: normalizeParams(readUserApplicationForBounty),
  readTotalBountyTokensAssigned: normalizeParams(readTotalBountyTokensAssigned)
};
