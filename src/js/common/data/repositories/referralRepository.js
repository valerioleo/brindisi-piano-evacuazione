const {runQuery} = require('../query');
const {
  validFiatContributions,
  validBTCContributions,
  validETHContributions,
  contributionAggregate
} = require('./queryHelper');
const {
  unwrapCypherSingleResult,
  unwrapCypherResult,
  getCount,
  normalizeParams
} = require('../utils');

const readInitiatorReferral = async userId => {
  try {
    const result = await runQuery(
      `
        MATCH (u:User {userId: "${userId}"})-[:HAS_REFERRAL]->(r:Referral)
        RETURN r.code
      `
    );

    return unwrapCypherSingleResult(result, 'r.code');
  }
  catch(error) {
    throw new Error(`Error reading initiator referral for user ${userId}: ${error.message}`);
  }
};

const createUserReferral = async (userId, referral) => {
  try {
    const result = await runQuery(
      `
        MATCH (u:User {userId: "${userId}"})
        MERGE (u)-[:HAS_REFERRAL]->(r:Referral {code: "${referral}"})
        RETURN r.code
      `
    );

    return unwrapCypherSingleResult(result, 'r.code');
  }
  catch(error) {
    throw new Error(`Error saving referral for user ${userId}: ${error.message}`);
  }
};

const readRegisteredReferral = async userId => {
  try {
    const result = await runQuery(
      `
        MATCH (u:User {userId: "${userId}"})-[:REGISTERED_WITH]->(r:Referral)
        RETURN r
      `
    );

    return unwrapCypherSingleResult(result, 'r');
  }
  catch(error) {
    throw new Error(`COuld not check if user already registered with a referral ${userId}: ${error.message}`);
  }
};

const registerWithReferral = async (userId, referralCode) => {
  try {
    const result = await runQuery(
      `
        MATCH (u:User {userId: "${userId}"}), (r:Referral {code: "${referralCode}"})
        MERGE (u)-[:REGISTERED_WITH]->(r)
        RETURN r
      `
    );

    return unwrapCypherSingleResult(result, 'r');
  }
  catch(error) {
    throw new Error(`Could not register ${userId} with referral ${referralCode}: ${error.message}`);
  }
};

const readNumberOfRegisteredFollowers = async referralCode => {
  try {
    const matchClause = referralCode
      ? `MATCH (u:User)-[rw:REGISTERED_WITH]->(r:Referral {code: "${referralCode}"})`
      : 'MATCH (u:User)-[rw:REGISTERED_WITH]->(r:Referral)';

    const result = await runQuery(
      `
        ${matchClause}
        RETURN COUNT(rw) as count
      `
    );

    return getCount(result);
  }
  catch(error) {
    throw new Error(`Error reading number of registered follower for the referral ${referralCode}: ${error.message}`);
  }
};

// Read the total number of followers that have at least one contribution
const readFollowersWithReferralTokens = async userId => {
  try {
    const matchClause = userId
      ? `MATCH (u:User {userId: "${userId}"})-[:HAS_REFERRAL]->(Referral)<-[:REGISTERED_WITH]-(u2:User) WITH u2`
      : 'MATCH (u:User)-[:HAS_REFERRAL]->(Referral)<-[:REGISTERED_WITH]-(u2:User) WITH u2';

    const result = await runQuery(
      `
        ${validFiatContributions('u2', matchClause)}
        AND fiat.referralTokens > 0
        with COUNT(u2) AS count
        where count > 0
        return count
        union
        ${validBTCContributions('u2', matchClause)}
        AND btc.referralTokens > 0
        with COUNT(u2) AS count
        where count > 0
        return count
        union
        ${validETHContributions('u2', matchClause)}
        AND eth.referralTokens > 0
        with COUNT(u2) AS count
        where count > 0
        return count
      `
    );

    return getCount(result);
  }
  catch(error) {
    throw new Error(`Error reading the total tokens assigned through referral scheme to the initiator users: ${error.message}`);
  }
};

// Read the total count for referral link followers, both for all users or specific user
const readFollowerReferralTokens = async userId => {
  try {
    const matchClause = userId
      ? `MATCH (u:User)-[:HAS_REFERRAL]->(Referral)<-[:REGISTERED_WITH]-(u2:User {userId: "${userId}"}) WITH u2`
      : 'MATCH (u:User)-[:HAS_REFERRAL]->(Referral)<-[:REGISTERED_WITH]-(u2:User) WITH u2';

    const result = await runQuery(contributionAggregate('u2', matchClause));

    return unwrapCypherResult(result)
      .map(
        contributions => contributions
          .reduce((acc, c) => acc + c.get('referralTokens'), 0)
      );
  }
  catch(error) {
    throw new Error(`Error reading the total tokens assigned to referral scheme followers: ${error.message}`);
  }
};

const readInitiatorTokens = async userId => {
  try {
    const matchClause = userId
      ? `MATCH (u:User {userId:"${userId}"})-[:HAS_REFERRAL]->(r:Referral)-[:HAS_INITIATOR_REWARD]->(ir:InitiatorReward)`
      : 'MATCH (u:User)-[:HAS_REFERRAL]->(r:Referral)-[:HAS_INITIATOR_REWARD]->(ir:InitiatorReward)';

    const result = await runQuery(
      `
        ${matchClause}
        RETURN {
          totalTokens:SUM(ir.tokens)
        } as total
      `
    );

    return unwrapCypherSingleResult(result, 'total');
  }
  catch(error) {
    throw new Error(`Could not read the referral tokens that were assigned to the initiator ${userId}: `, error.message);
  }
};

// saves the initiator referral tokens
const updateInitiatorReferralTokens = currency => async contribs => {
  try {
    const result = await runQuery(
      `
        UNWIND $contribs AS contrib
        MATCH (r:Referral)<-[:REGISTERED_WITH]-(u:User)-[:HAS_${currency}_CONTRIBUTION]->(c:Contribution {txHash: contrib.txHash})
        WITH u, r
        MATCH (p:Parameter {isReferralEnabled: true})
        MERGE (r)-[:HAS_INITIATOR_REWARD]->(ir:InitiatorReward {followerId:u.userId})
        ON CREATE SET ir.tokens=p.initiatorReward
        RETURN ir
      `,
      {contribs}
    );

    return unwrapCypherResult(result, 'ir');
  }
  catch(error) {
    throw new Error(`Error updating initiator referral tokens: ${error.message}`);
  }
};

module.exports = {
  readRegisteredReferral: normalizeParams(readRegisteredReferral),
  registerWithReferral: normalizeParams(registerWithReferral),
  createUserReferral: normalizeParams(createUserReferral),
  readInitiatorReferral: normalizeParams(readInitiatorReferral),
  readNumberOfRegisteredFollowers: normalizeParams(readNumberOfRegisteredFollowers),
  readFollowersWithReferralTokens: normalizeParams(readFollowersWithReferralTokens),
  readFollowerReferralTokens: normalizeParams(readFollowerReferralTokens),
  readInitiatorTokens: normalizeParams(readInitiatorTokens),
  updateInitiatorReferralTokens: normalizeParams(updateInitiatorReferralTokens)
};
