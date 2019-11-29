const {runQuery} = require('../query');
const {
  constructCreateMatchString,
  unwrapCypherSingleResult,
  normalizeParams
} = require('../utils');

// This is the data that user provides through the form;
// Note this is not the final KYC data; that will be saved with saveInitiatedKycApplication below
const createUserProvidedKycData = async (userId, kycData) => {
  try {
    const {
      first_name,
      last_name,
      country,
      nationality,
      postal_address,
      email
    } = kycData;

    await runQuery(
      `
        MATCH (u:User {userId:"${userId}"})
        MERGE (u)-[:HAS_PROVIDED_KYC_DATA]->(k:KYC)
        ON MATCH SET k +={
          givenNames: "${first_name}",
          countryOfResidence: "${country}",
          familyName: "${last_name}",
          nationality: "${nationality}",
          postalAddress: "${postal_address}",
          email: "${email}"
        }
        ON CREATE SET k +={
          givenNames: "${first_name}",
          countryOfResidence: "${country}",
          familyName: "${last_name}",
          nationality: "${nationality}",
          postalAddress: "${postal_address}",
          email: "${email}"
        }
      `
    );
  }
  catch(error) {
    throw new Error(`Error creating user procided kyc data for partial user ${userId}: ${error.message}`);
  }
};

const readUserProvidedKycData = async userId => {
  try {
    const result = await runQuery(
      `
        MATCH (u:User {userId:"${userId}"})-[h:HAS_PROVIDED_KYC_DATA]->(k:KYC)
        RETURN k
      `
    );

    return unwrapCypherSingleResult(result, 'k');
  }
  catch(error) {
    throw new Error(`Error reading user provided kyc data for partial user ${userId}: ${error.message}`);
  }
};

const readInitiatedKycApplications = async userId => {
  try {
    const result = await runQuery(
      `
        MATCH (u:User {userId:"${userId}"})-[h:HAS_INITIATED_KYC]->(k:KYC)
        RETURN k {
          .*,
          hasFailedKyc: h.hasFailedKyc
        }
      `
    );

    return unwrapCypherSingleResult(result, 'k');
  }
  catch(error) {
    throw new Error(`Error reading initiated kyc data for partial user ${userId}: ${error.message}`);
  }
};

const saveInitiatedKycApplication = async (userId, kycData) => {
  try {
    await runQuery(
      `
        MATCH (u:User {userId:"${userId}"})-[:HAS_PROVIDED_KYC_DATA]->(k:KYC)
        MERGE (u)-[:HAS_INITIATED_KYC]->(k)
        SET u.countryOfResidence = "${kycData.countryOfResidence}"
        SET k +={
          givenNames: "${kycData.givenNames}",
          countryOfResidence: "${kycData.countryOfResidence}",
          familyName: "${kycData.familyName}",
          nationality: "${kycData.nationality}",
          fullName: "${kycData.fullName}",
          id: "${kycData.id}",
          vendorName: "${kycData.vendorName}"
        }
      `
    );
  }
  catch(error) {
    throw new Error(`Error saving initiated kyc data for partial user ${userId}: ${error.message}`);
  }
};

const saveCompletedKycApplication = async (userId, receiptId) => {
  try {
    await runQuery(
      `
        MATCH (u:User {userId:"${userId}"})-[:HAS_INITIATED_KYC]->(k:KYC)
        MERGE (u)-[:HAS_KYC]->(k)
        SET k.receiptId='${receiptId}'
      `
    );
  }
  catch(error) {
    throw new Error(`Error saving completed check result for partial user ${userId}: ${error.message}`);
  }
};

const saveFailedKycApplication = async userId => {
  try {
    await runQuery(
      `
        MATCH (u:User {userId:"${userId}"})-[h:HAS_INITIATED_KYC]->(KYC)
        SET h.hasFailedKyc = true
      `
    );
  }
  catch(error) {
    throw new Error(`Error saving failed kyc result for partial user ${userId}: ${error.message}`);
  }
};

const kycProfileExists = async userId => {
  try {
    const result = await runQuery(
      `
      MATCH (u:User {userId:"${userId}"})-[:HAS_KYC]->(kyc:KYC)
      RETURN exists(u.userId)
      `
    );

    return unwrapCypherSingleResult(result, 'exists(u.userId)');
  }
  catch(error) {
    throw new Error(`Error checking if kyc profile exists for user ${userId} due to ${error.message}`);
  }
};

const amlResultExists = async userId => {
  try {
    const result = await runQuery(
      `
      MATCH (u:User {userId:"${userId}"})-[:HAS_AML]->(aml:AML)
      RETURN exists(u.userId)
      `
    );

    return unwrapCypherSingleResult(result, 'exists(u.userId)');
  }
  catch(error) {
    throw new Error(`Error checking if aml result exists for user ${userId} due to ${error.message}`);
  }
};

const saveKycProfile = async (
  userId,
  kycProfile,
  receiptId = kycProfile.receiptId,
  vendorName = kycProfile.vendorName
) => {
  try {
    const result = await runQuery(
      `
        MATCH (u:User {userId:"${userId}"})
        MERGE (u)-[:HAS_KYC]->(kyc:KYC ${constructCreateMatchString({...kycProfile, receiptId, vendorName})})
        RETURN u{
          .*,
          kyc: kyc
        }
      `
    );

    return unwrapCypherSingleResult(result, 'u');
  }
  catch(error) {
    throw new Error(`Error saving if kyc data for user ${userId} due to ${error.message}`);
  }
};

const saveAmlResult = async (userId, {isOnPepList, isOnFraudList, isOnWatchList}) => {
  try {
    const result = await runQuery(
      `
        MATCH (u:User {userId:"${userId}"})
        MERGE (u)-[:HAS_AML]->(aml: AML {
          isOnPepList: ${isOnPepList},
          isOnFraudList: ${isOnFraudList},
          isOnWatchList: ${isOnWatchList}
        })
        RETURN u{
          .*,
          aml:aml
        }
      `
    );

    return unwrapCypherSingleResult(result, 'u');
  }
  catch(error) {
    throw new Error(`Error saving if aml result for user ${userId} due to ${error.message}`);
  }
};

const saveCountryOfResidence = async (userId, countryOfResidence) => {
  try {
    return await runQuery(
      `
      MATCH (u:User {userId: "${userId}"})
      SET u.countryOfResidence="${countryOfResidence}"
      `
    );
  }
  catch(error) {
    throw new Error(`Error saving country if recidence for user ${userId}: ${error.message}`);
  }
};

const readKycAmlData = async userId => {
  try {
    const profileResult = await runQuery(
      `
        MATCH (aml:AML)<-[:HAS_AML]-(u:User {userId:'${userId}'})-[:HAS_KYC]->(kyc:KYC)
        return u {
          .*,
          aml: aml { .* },
          kyc: kyc { .* }
        }
      `
    );

    return unwrapCypherSingleResult(profileResult, 'u');
  }
  catch(error) {
    throw new Error(`Error kyc/aml data for ${userId} due to ${error.message}`);
  }
};

module.exports = {
  createUserProvidedKycData: normalizeParams(createUserProvidedKycData),
  readUserProvidedKycData: normalizeParams(readUserProvidedKycData),
  readInitiatedKycApplications: normalizeParams(readInitiatedKycApplications),
  saveInitiatedKycApplication: normalizeParams(saveInitiatedKycApplication),
  saveCompletedKycApplication: normalizeParams(saveCompletedKycApplication),
  saveFailedKycApplication: normalizeParams(saveFailedKycApplication),
  kycProfileExists: normalizeParams(kycProfileExists),
  amlResultExists: normalizeParams(amlResultExists),
  saveKycProfile: normalizeParams(saveKycProfile),
  saveAmlResult: normalizeParams(saveAmlResult),
  saveCountryOfResidence: normalizeParams(saveCountryOfResidence),
  readKycAmlData: normalizeParams(readKycAmlData)
};
