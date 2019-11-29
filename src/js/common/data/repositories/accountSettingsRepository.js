const {runQuery} = require('../query');
const {unwrapCypherSingleResult, normalizeParams} = require('../utils');

const readAccountSettings = async userId => {
  try {
    const result = await runQuery(
      `
        MATCH (u:User {userId:"${userId}"})-[:HAS_SETTINGS]->(as:AccountSettings)
        return {
          is2FAEnabled:as.is2FAEnabled,
          otpAuthUrl:as.otpAuthUrl
        } as as
      `
    );

    return unwrapCypherSingleResult(result, 'as');
  }
  catch(error) {
    throw new Error(`Error reading account settings for ${userId}: ${error.message}`);
  }
};

const createOtpSettings = async (userId, otpData) => {
  try {
    const result = await runQuery(
      `
        MATCH (u:User {userId:"${userId}"})
        CREATE (u)-[:HAS_SETTINGS]->(as:AccountSettings {
          otpSecret: "${otpData.otpSecret}",
          otpAuthUrl: "${otpData.otpAuthUrl}"
        })
        return as
      `
    );

    return unwrapCypherSingleResult(result, 'as');
  }
  catch(error) {
    throw new Error(`Error reading account settings for ${userId}: ${error.message}`);
  }
};

const updateAccountSettings = async (userId, accountSettings) => {
  try {
    const {is2FAEnabled} = accountSettings;
    const result = await runQuery(
      `
        MATCH (u:User {userId:"${userId}"})-[:HAS_SETTINGS]->(as:AccountSettings)
        SET as.is2FAEnabled=${is2FAEnabled}
        return {
          is2FAEnabled:as.is2FAEnabled,
          otpAuthUrl:as.otpAuthUrl
        } as as
      `
    );

    return unwrapCypherSingleResult(result, 'as');
  }
  catch(error) {
    throw new Error(`Error reading account settings for ${userId}: ${error.message}`);
  }
};

const readAccountOTPSecret = async userId => {
  try {
    const result = await runQuery(
      `
        MATCH (u:User {userId:"${userId}"})-[:HAS_SETTINGS]->(as:AccountSettings)
        return {
          otpSecret:as.otpSecret
        } as as
      `
    );

    return unwrapCypherSingleResult(result, 'as');
  }
  catch(error) {
    throw new Error(`Error reading account settings for ${userId}: ${error.message}`);
  }
};

module.exports = {
  createOtpSettings: normalizeParams(createOtpSettings),
  readAccountSettings: normalizeParams(readAccountSettings),
  updateAccountSettings: normalizeParams(updateAccountSettings),
  readAccountOTPSecret: normalizeParams(readAccountOTPSecret)
};
