const {runQuery} = require('../query');
const {
  unwrapCypherSingleResult,
  unwrapCypherResult,
  normalizeParams
} = require('../utils');

const getStages = async () => {
  try {
    const result = await runQuery(
      `
      MATCH (:Parameter)-[:HAS_STAGE]->(s:Stage)
      WITH s
      ORDER BY s.startDate, s.lowLimit
      RETURN s { .*, id: ID(s)}
      `
    );

    return unwrapCypherResult(result, 's');
  }
  catch(error) {
    throw new Error(`Error while reading the current ICO stages due to ${error.message}`);
  }
};

const updateStages = async stages => {
  try {
    // remove the old stages
    await runQuery(
      `
      OPTIONAL MATCH (p:Parameter)-[:HAS_STAGE]->(r:Stage)
      DETACH DELETE r
      `
    );

    await runQuery(
      `
      UNWIND $stages AS stage
      MATCH (p:Parameter)
      CREATE (p)-[:HAS_STAGE]->(r:Stage {
        label:stage.label, 
        lowLimit:stage.lowLimit, 
        highLimit:stage.highLimit, 
        startDate:stage.startDate, 
        endDate:stage.endDate, 
        price:stage.price, 
        bonus:stage.bonus
      })
      RETURN r
      `,
      {stages}
    );
  }
  catch(error) {
    throw new Error(`Error while writting the ICO stages due to${error.message}`);
  }
};

// save general parameters
const createParameters = async parameters => {
  try {
    const ifString = value => typeof value === 'string'
      ? `"${value}"`
      : Array.isArray(value)
        ? `[${value.map(ifString)}]`
        : value;

    const stringified = Object.entries(parameters)
      .reduce((acc, [key, value]) => [...acc, `p.${key}=${ifString(value)}`], []);
    const setter = stringified
      .join(',');

    const result = await runQuery(
      `
      MERGE (p:Parameter)  
      SET ${setter}
      RETURN p
      `
    );

    return unwrapCypherSingleResult(result, 'p');
  }
  catch(error) {
    throw new Error(`Error while writing parameters due to ${error.message}`);
  }
};

const deleteParameters = async () => {
  try {
    const result = await runQuery(
      `
      MATCH (p:Parameter)
      OPTIONAL MATCH (p)-[]->(n)
      DETACH DELETE p, n
      `
    );

    return unwrapCypherResult(result);
  }
  catch(error) {
    throw new Error(`Error deleting parameters due to ${error.message}`);
  }
};

const readParameters = async () => {
  try {
    const parameterResult = await runQuery(
      `
      MATCH (p:Parameter)
      RETURN p
      `
    );

    return unwrapCypherSingleResult(parameterResult, 'p');
  }
  catch(error) {
    throw new Error(`Error while reading the current ICO parameters due to ${error.message}`);
  }
};

const readPublicParameters = async () => {
  try {
    const parameterResult = await runQuery(
      `
        MATCH(p: Parameter)
        RETURN {
          openingDate:p.openingDate,
          closingDate:p.closingDate,
          softCap:p.softCap,
          ticker:p.ticker,
          hardCap:p.hardCap,
          coinName:p.coinName,
          countryRestriction:p.countryRestriction,
          initiatorReward:p.initiatorReward,
          isBountyEnabled:p.isBountyEnabled,
          isReferralEnabled:p.isReferralEnabled,
          followerReward:p.followerReward,
          referralAllocation:p.referralAllocation
        } as param
      `
    );

    return unwrapCypherSingleResult(parameterResult, 'param');
  }
  catch(error) {
    throw new Error(`Error while loading public parameters due to ${error.message}`);
  }
};

const updateReferralAndBountyStatus = async (isReferralEnabled, isBountyEnabled) => {
  try {
    const result = await runQuery(
      `
        MATCH(p:Parameter)
        SET p += {
          isReferralEnabled:${isReferralEnabled},
          isBountyEnabled:${isBountyEnabled}
        }
        RETURN p
      `
    );

    return unwrapCypherSingleResult(result, 'p');
  }
  catch(error) {
    throw new Error(`Error while update referral and bounty status due to ${error.message}`);
  }
};

const updateReferalSettings = async data => {
  try {
    const {referralAllocation, initiatorReward, followerReward} = data;

    const result = await runQuery(
      `
        MATCH(p:Parameter)
        SET p += {
          referralAllocation:${referralAllocation},
          initiatorReward:${initiatorReward},
          followerReward:${followerReward}
        }
        RETURN p
      `
    );

    return unwrapCypherSingleResult(result, 'p');
  }
  catch(error) {
    throw new Error(`Error while update referal settings due to ${error.message}`);
  }
};

const createBankDetails = async details => {
  try {
    const ifString = value => typeof value === 'string'
      ? `"${value}"`
      : Array.isArray(value)
        ? `[${value.map(ifString)}]`
        : typeof value === 'object'
          ? `"${value.value}"`
          : value;

    const stringified = Object.entries(details)
      .reduce((acc, [key, value]) => [...acc, `${key}:${ifString(value)}`], []);
    const setter = stringified
      .join(',');

    const result = await runQuery(
      `
      MERGE (p:BankDetails)  
      SET p={${setter}}
      RETURN p {
        .*
      }
      `
    );

    return unwrapCypherResult(result, 'p');
  }
  catch(error) {
    throw new Error(`Error while writing bankDetails due to ${error.message}`);
  }
};

const readBankDetails = async () => {
  try {
    const bankDetailsResult = await runQuery(
      `
      MATCH (p:BankDetails)
      RETURN p
      `
    );
    return unwrapCypherSingleResult(bankDetailsResult, 'p');
  }
  catch(error) {
    throw new Error(`Error while reading the current ICO bank details due to ${error.message}`);
  }
};

const deleteBankDetails = async () => {
  try {
    const result = await runQuery(
      `
      MATCH (p:BankDetails)
      DELETE p
      `
    );

    return unwrapCypherResult(result);
  }
  catch(error) {
    throw new Error(`Error deleting bank details due to ${error.message}`);
  }
};

module.exports = {
  getStages: normalizeParams(getStages),
  updateStages: normalizeParams(updateStages),
  createParameters: normalizeParams(createParameters),
  deleteParameters: normalizeParams(deleteParameters),
  readPublicParameters: normalizeParams(readPublicParameters),
  updateReferalSettings: normalizeParams(updateReferalSettings),
  updateReferralAndBountyStatus: normalizeParams(updateReferralAndBountyStatus),
  readParameters: normalizeParams(readParameters),
  createBankDetails: normalizeParams(createBankDetails),
  readBankDetails: normalizeParams(readBankDetails),
  deleteBankDetails: normalizeParams(deleteBankDetails)
};
