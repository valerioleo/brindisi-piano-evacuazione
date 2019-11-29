const {runQuery} = require('../query');
const {
  unwrapCypherResult,
  unwrapCypherSingleResult,
  constructCreateMatchString,
  normalizeQueries
} = require('../utils');
const {
  validateCreateClaimsRegistry,
  validateCreateClaim,
  validateReadClaims,
  validateCreateRegistryAccount
} = require('./validations/claimValidations');

const createClaimsRegistry = async ({address}) => {
  try {
    const result = await runQuery(
      `
        MERGE (cr:ClaimsRegistry {address: "${address}"})
        RETURN cr
      `
    );

    return unwrapCypherSingleResult(result, 'cr');
  }
  catch(error) {
    throw new Error(`Error creating Claims Registry: ${error.message}`);
  }
};

const readClaimsRegistry = async () => {
  try {
    const result = await runQuery(
      `
        MATCH (cr:ClaimsRegistry)
        RETURN cr
      `
    );

    return unwrapCypherSingleResult(result, 'cr');
  }
  catch(error) {
    throw new Error(`Error reading Claims Registry: ${error.message}`);
  }
};

const createClaimsRegistryAccount = async (accountData = {}) => {
  const {accountId, holderAddress} = accountData;

  try {
    const result = await runQuery(
      `
      MATCH (cr:ClaimsRegistry)
      MERGE (cr)-[:HAS_ACCOUNT]->(cra:ClaimsRegistryAccount {accountId: $accountId})
      WITH cr, cra
      MERGE (h:Holder {address: $holderAddress})-[:HAS_CLAIMS_REGISTRY_ACCOUNT]->(cra)
      WITH cr, cra
      MATCH (hh:Holder)-[:HAS_CLAIMS_REGISTRY_ACCOUNT]->(cra)

      RETURN cra {
        .*,
        holderAddresses: collect(hh.address),
        claimsRegistryAddress: cr.address
      }
      `, {
        holderAddress,
        accountId
      }
    );

    return unwrapCypherSingleResult(result, 'cra');
  }
  catch(error) {
    throw new Error(`Error creating ClaimsRegistry Account ${accountId}: ${error.message}`);
  }
};

const readClaimsRegistryAccounts = async () => {
  try {
    const result = await runQuery(
      `
      MATCH (cr:ClaimsRegistry)
      MATCH (cr)-[:HAS_ACCOUNT]->(cra:ClaimsRegistryAccount)<-[:HAS_CLAIMS_REGISTRY_ACCOUNT]-(h:Holder)
      RETURN cra {
        .*,
        holderAddresses: collect(h.address),
        claimsRegistryAddress: cr.address
      }
      `
    );

    return unwrapCypherResult(result, 'cra');
  }
  catch(error) {
    throw new Error(`Error reading ClaimsRegistry Accounts: ${error.message}`);
  }
};

const createClaim = async (claim = {}) => {
  const {
    key,
    value,
    issuer,
    accountId,
    provider = '',
    providerProof = '',
    validTo
  } = claim;

  const queryParams = {
    key,
    accountId,
    value,
    issuer,
    provider,
    providerProof,
    validTo
  };

  try {
    const result = await runQuery(
      `
      MATCH (cr:ClaimsRegistry)-[:HAS_ACCOUNT]->(cra:ClaimsRegistryAccount {accountId: $accountId})
      WITH DISTINCT cra, cr
      MERGE (cra)-[:HAS_CLAIM]->(c:Claim {key: toString($key)})
      ON MATCH SET c += {
        value: toString($value),
        issuer: toString($issuer),
        provider: toString($provider),
        providerProof: toString($providerProof),
        validTo: $validTo
      }
      ON CREATE SET c += {
        value: toString($value),
        issuer: toString($issuer),
        provider: toString($provider),
        providerProof: toString($providerProof),
        validTo: $validTo
      }
      RETURN c {
        .*,
        claimsRegistryAccountId: cra.accountId,
        claimsRegistryAddress: cr.address
      }
      `,
      queryParams
    );

    return unwrapCypherSingleResult(result, 'c');
  }
  catch(error) {
    throw new Error(`Error creating Claim: ${error.message}`);
  }
};

const readClaims = async (filters = {}) => {
  const {holderAddress, accountId, ...rest} = filters;
  const accountFilter = constructCreateMatchString({accountId});
  const addressFilter = constructCreateMatchString({address: holderAddress});
  const claimDataFilter = constructCreateMatchString(rest);

  try {
    const result = await runQuery(
      `
      MATCH (cr:ClaimsRegistry)
      MATCH (cr)-[:HAS_ACCOUNT]->(
        cra:ClaimsRegistryAccount ${accountFilter}
      )<-[:HAS_CLAIMS_REGISTRY_ACCOUNT]-(
        h:Holder ${addressFilter}
      )
      MATCH (cra)-[:HAS_CLAIM]->(c:Claim ${claimDataFilter})

      WITH DISTINCT h, cr, c, cra

      RETURN c {
        .*,
        claimsRegistryAccountId: cra.accountId,
        claimsRegistryAddress: cr.address,
        holderAddresses: collect(h.address)
      }
      `
    );

    return unwrapCypherResult(result, 'c');
  }
  catch(error) {
    throw new Error(`Error getting Claims with filter ${JSON.stringify(filters)}: ${error.message}`);
  }
};

module.exports = normalizeQueries({
  createClaimsRegistry: (createClaimsRegistry)['∘'](validateCreateClaimsRegistry),
  readClaimsRegistry,
  readClaimsRegistryAccounts,
  createClaimsRegistryAccount: (createClaimsRegistryAccount)['∘'](validateCreateRegistryAccount),
  createClaim: (createClaim)['∘'](validateCreateClaim),
  readClaims: (readClaims)['∘'](validateReadClaims)
});
