const {runQuery} = require('../query');
const {unwrapCypherSingleResult, normalizeParams} = require('../utils');

const readKycFromEthAddress = async ethAddress => {
  try {
    const result = await runQuery(
      `
        MATCH (k:KYC)<-[:HAS_KYC]-(u:User)-[:HAS_TOKEN_RECIPIENT_ADDRESS]->(e:TokenRecipientAddress {address: "${ethAddress}"})
        RETURN k{
          .*,
          userId: u.userId
        }
      `
    );

    return unwrapCypherSingleResult(result, 'k');
  }
  catch(error) {
    throw new Error(`Error looking up ethereum address ${ethAddress}: ${error.message}`);
  }
};

module.exports = {
  readKycFromEthAddress: normalizeParams(readKycFromEthAddress)
};
