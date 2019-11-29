const {runQuery, transaction} = require('../query');
const {createNextAddress} = require('./walletRepository');
const {immutableGet} = require('../../fn');
const {
  constructCreateMatchString,
  unwrapCypherSingleResult,
  unwrapCypherResult,
  createPaginationResult,
  constructFilters,
  normalizeParams
} = require('../utils');
const {ORGANIC_USER_TYPE} = require('../../constants');

const createPartialUser = async userData => {
  // creationType is a for automatic and m for manual (added by the admin)
  const {
    email,
    name,
    id,
    countryOfResidence = 'UNKNOWN',
    creationType = ORGANIC_USER_TYPE
  } = userData;

  try {
    const result = await runQuery(
      `
      MERGE (u:User {userId: "${id}"})
      ON MATCH SET u +={
        countryOfResidence:"${countryOfResidence}",
        email:"${email}",
        name: "${name}",
        isVested: false,
        creationType: "${creationType}"
      }
      ON CREATE SET u +={
        countryOfResidence:"${countryOfResidence}",
        email:"${email}",
        name: "${name}",
        isVested: false,
        creationType: "${creationType}"
      }
      RETURN u
      `
    );

    return unwrapCypherSingleResult(result, 'u');
  }
  catch(error) {
    throw new Error(`Error creating a partial user ${id}: ${error.message}`);
  }
};

const createUserVestingSettings = async (userId, isVested = false) => {
  try {
    await runQuery(
      `
        MATCH (u:User {userId: "${userId}"})
        SET u.isVested = ${isVested}
      `
    );
  }
  catch(error) {
    throw new Error(`Error saving vesting settings for partial user ${userId}: ${error.message}`);
  }
};

const createAccount = async userId => {
  let tx;

  try {
    // Start transaction
    tx = transaction();

    // 1. create a new user node
    await tx.run(
      `
        MERGE (u:User {userId:"${userId}"})
        RETURN u
      `
    );

    // 2. create a new BTC address
    const [address, index] = await createNextAddress();
    const result = await tx.run(
      `
        CREATE (btc:BTC ${constructCreateMatchString({address, index})}) 
        WITH btc
        MATCH (u:User {userId:"${userId}"})
        MERGE (u)-[:HAS_BTC]->(btc)
        RETURN u{ .*, btcAddress: btc.address}
      `
    );

    await tx.commit();

    return unwrapCypherSingleResult(result.records, 'u');
  }
  catch(error) {
    throw new Error(`Error creating a new account for user ${userId} due to ${error.message}`);
  }
};

const deleteAccount = async userId => {
  try {
    await runQuery(
      `
        MATCH (u:User {userId:"${userId}"})
        OPTIONAL MATCH (u)-[]->(n)
        WITH u, n
        OPTIONAL MATCH (n)-[]->(m)
        DETACH DELETE u, n, m
      `
    );
  }
  catch(error) {
    throw new Error(`Error deleting account for user ${userId} due to ${error.message}`);
  }
};

const accountExists = async userId => {
  try {
    const result = await runQuery(
      `
      MATCH (u:User ${constructCreateMatchString({userId})})
      RETURN exists(u.userId)
      `
    );

    return unwrapCypherSingleResult(result, 'exists(u.userId)');
  }
  catch(error) {
    throw new Error(`Error checking if account ${userId} exists due to ${error.message}`);
  }
};

const createRole = async (userId, role) => {
  try {
    const result = await runQuery(
      `
        MATCH (u:User {userId:"${userId}"})
        MERGE (u)-[:HAS_ROLE]->(r:Role {name:"${role}"})
        RETURN r
      `
    );

    return unwrapCypherSingleResult(result, 'r');
  }
  catch(error) {
    throw new Error(`Error creating a new role for user ${userId} due to ${error.message}`);
  }
};

const updateRoles = async (userId, roles) => {
  try {
    const result = await runQuery(
      `
        MATCH (u:User {userId:"${userId}"})
        OPTIONAL MATCH (u)-[:HAS_ROLE]->(r:Role)
        DETACH DELETE r
        WITH DISTINCT u
        UNWIND $roles as role
        CREATE (u)-[:HAS_ROLE]->(r:Role {name: role})
        RETURN u
      `,
      {roles}
    );

    return unwrapCypherSingleResult(result, 'u');
  }
  catch(error) {
    throw new Error(`Error updating roles for user ${userId} due to ${error.message}`);
  }
};

const readRoles = async userId => {
  try {
    const result = await runQuery(
      `
        MATCH (u:User {userId:"${userId}"})-[:HAS_ROLE]->(r:Role)
        RETURN r
      `
    );

    return unwrapCypherResult(result, 'r');
  }
  catch(error) {
    throw new Error(`Error fetching account roles for user ${userId} due to ${error.message}`);
  }
};

const getAccount = async userId => {
  try {
    const result = await runQuery(
      `
        MATCH (u:User {userId: "${userId}"})
        OPTIONAL MATCH (u)-[:HAS_BTC]->(btc:BTC)
        with u, btc
        OPTIONAL MATCH (u)-[:HAS_ETH]->(eth:ETH)
        with u, btc, eth
        OPTIONAL MATCH (u)-[:HAS_TOKEN_RECIPIENT_ADDRESS]->(tr:TokenRecipientAddress)
        with u, btc, eth, tr
        OPTIONAL MATCH (u)-[:HAS_ROLE]->(r:Role)
        with u, btc, eth, tr, r
        OPTIONAL MATCH (u)-[h:HAS_INITIATED_KYC]->(initiatedKyc:KYC)
        with u, btc, eth, tr, r, h, initiatedKyc
        OPTIONAL MATCH (u)-[:HAS_KYC]->(kyc:KYC)
        with u, btc, eth, tr, r, h, initiatedKyc, kyc
        OPTIONAL MATCH (u)-[:HAS_AML]->(aml:AML)
        with u, btc, eth, tr, r, h, initiatedKyc, kyc, aml
        RETURN u {
          .*, 
          btcAddress:btc.address, 
          ethAddress:eth.address, 
          tokenRecipientAddress:tr.address, 
          roles:collect(r.name),
          aml: aml { .* },
          initiatedKyc: initiatedKyc { .*, hasFailedKyc: h.hasFailedKyc },
          kyc: kyc { .* }
        }
      `
    );

    return unwrapCypherSingleResult(result, 'u');
  }
  catch(error) {
    throw new Error(`Error fetching account for user ${userId}: ${error.message}`);
  }
};

const getAccountByBtc = async address => {
  try {
    const result = await runQuery(
      `
        MATCH (u:User)-[:HAS_BTC]->(b:BTC {address:"${address}"})
        RETURN u
      `
    );

    return unwrapCypherSingleResult(result, 'u');
  }
  catch(error) {
    throw new Error(`Error getting account by eth or btc address: ${error.message}`);
  }
};

const getAccountByEth = async address => {
  try {
    const result = await runQuery(
      `
        MATCH (u:User)-[:HAS_ETH]->(e:ETH {address:"${address}"})
        RETURN u
      `
    );

    return unwrapCypherSingleResult(result, 'u');
  }
  catch(error) {
    throw new Error(`Error getting account by eth or btc address: ${error.message}`);
  }
};

const readAccountFromBtcAddress = async btcAddress => {
  try {
    const result = await runQuery(
      `
        MATCH (u:User)-[:HAS_BTC]->(b:BTC {address:"${btcAddress}"})
        MATCH (u)-[:HAS_KYC]->(kyc:KYC)
        RETURN u{
          email: u.email,
          kyc: kyc { .* }
        }
      `
    );

    return unwrapCypherSingleResult(result, 'u');
  }
  catch(error) {
    throw new Error(`Error getting user from btc address ${btcAddress} due to ${error.message}`);
  }
};

const readAccountFromEthAddress = async ethAddress => {
  try {
    const result = await runQuery(
      `
        MATCH (u:User)-[:HAS_ETH]->(e:ETH {address:"${ethAddress}"})
        MATCH (u)-[:HAS_KYC]->(kyc:KYC)
        RETURN u{
          email: u.email,
          kyc: kyc { .* }
        }
      `
    );

    return unwrapCypherSingleResult(result, 'u');
  }
  catch(error) {
    throw new Error(`Error getting user from eth address ${ethAddress} due to ${error.message}`);
  }
};

const createTokenRecipientAddress = async (userId, address) => {
  try {
    await runQuery(
      `
        MATCH (u:User {userId:"${userId}"})
        MERGE (u)-[:HAS_TOKEN_RECIPIENT_ADDRESS]->(tr:TokenRecipientAddress {address:"${address}"})
      `
    );
  }
  catch(error) {
    throw new Error(`Error saving token recipient ethereum address ${address} for user ${userId} due to ${error.message}`);
  }
};

const createEthereumAddress = async (userId, address) => {
  try {
    return await runQuery(
      `
        MATCH (u:User {userId:"${userId}"})
        MERGE (u)-[:HAS_ETH]->(e:ETH {address:"${address}"})
      `
    );
  }
  catch(error) {
    throw new Error(`Error saving ethereum address ${address} for user ${userId} due to ${error.message}`);
  }
};

const updateTokenRecipientAddress = async (userId, address) => {
  try {
    return await runQuery(
      `
        MATCH (u:User {userId:"${userId}"})
        MERGE (u)-[:HAS_TOKEN_RECIPIENT_ADDRESS]->(e:TokenRecipientAddress)
        ON CREATE SET e.address="${address}"
        ON MATCH SET e.address="${address}"
        RETURN e
      `
    );
  }
  catch(error) {
    throw new Error(`Error updating token recipient ethereum address ${address} for user ${userId} due to ${error.message}`);
  }
};

const updateEthereumAddress = async (userId, address) => {
  try {
    return await runQuery(
      `
        MATCH (u:User {userId:"${userId}"})
        MERGE (u)-[:HAS_ETH]->(e:ETH)
        ON CREATE SET e.address="${address}"
        ON MATCH SET e.address="${address}"
        RETURN e
      `
    );
  }
  catch(error) {
    throw new Error(`Error updating ethereum address ${address} for user ${userId} due to ${error.message}`);
  }
};

const tokenRecipientAddressExists = async address => {
  try {
    const result = await runQuery(
      `
      MATCH (n:TokenRecipientAddress {address:"${address}"})
      RETURN exists(n.address)
      `
    );

    return unwrapCypherSingleResult(result, 'exists(n.address)');
  }
  catch(error) {
    throw new Error(`Error checking if token recipient address ${address} exists due to ${error.message}`);
  }
};

const ethereumAddressExists = async address => {
  try {
    const result = await runQuery(
      `
      MATCH (n:ETH {address:"${address}"})
      RETURN exists(n.address)
      `
    );

    return unwrapCypherSingleResult(result, 'exists(n.address)');
  }
  catch(error) {
    throw new Error(`Error checking if ethereum address ${address} exists due to ${error.message}`);
  }
};

const readTokenRecipientAddress = async userId => {
  try {
    const result = await runQuery(
      `
        MATCH (u:User ${constructCreateMatchString({userId})})-[:HAS_TOKEN_RECIPIENT_ADDRESS]->(e:TokenRecipientAddress)
        RETURN e.address
      `
    );

    return unwrapCypherSingleResult(result, 'e.address');
  }
  catch(error) {
    throw new Error(`Error reading token recipient ethereum address for user ${userId} due to ${error.message}`);
  }
};

const readEthereumAddress = async userId => {
  try {
    const result = await runQuery(
      `
        MATCH (u:User {userId:"${userId}"})-[:HAS_ETH]->(e:ETH)
        RETURN e.address
      `
    );

    return unwrapCypherSingleResult(result, 'e.address');
  }
  catch(error) {
    throw new Error(`Error reading ethereum address for user ${userId} due to ${error.message}`);
  }
};

const readEthereumAddressByName = async query => {
  try {
    const result = await runQuery(
      `
      MATCH (u:User)-[:HAS_ETH]->(e:ETH)
      WHERE u.name  =~ '(?i).*${query}.*'
      RETURN u{
        name: u.name,
        address: e.address
      }
      LIMIT 5
      `
    );

    return unwrapCypherResult(result, 'u');
  }
  catch(error) {
    throw new Error(`Error reading ethereum address due to ${error.message}`);
  }
};

const deleteEthAddress = async (userId, address) => {
  try {
    await runQuery(
      `
        MATCH (u:User {userId:"${userId}"})-[:HAS_ETH]->(e:ETH {address:"${address}"})
        DETACH DELETE e
      `
    );
  }
  catch(error) {
    throw new Error(`Error deleting ethereum address ${address} for user ${userId} due to ${error.message}`);
  }
};

const readPartialUsers = async query => {
  try {
    const {
      skip = 0,
      limit = 1000000,
      filter,
      order = 'desc',
      orderBy = 'email'
    } = query;

    // Matches any of these values
    const search = filter && {
      familyName: filter,
      givenNames: filter,
      fullName: filter
    };

    const kycFilter = constructFilters('kyc', search);
    const filterClause = kycFilter !== ''
      ? `
          ${kycFilter}
          OR u.email =~ '(?i).*${filter}.*'
          OR (u)-[:HAS_BTC]->(:BTC {address:"${filter}"}) 
          OR (u)-[:HAS_ETH]->(:ETH {address:"${filter}"})
          OR (u)-[:HAS_TOKEN_RECIPIENT_ADDRESS]->(:TokenRecipientAddress {address:"${filter}"})
        `
      : '';

    const result = await runQuery(
      `
        MATCH (u:User)-[:HAS_KYC]->(kyc:KYC)
        OPTIONAL MATCH (u)-[:HAS_TOKEN_RECIPIENT_ADDRESS]->(tr:TokenRecipientAddress)
        WITH u, kyc, tr
        ${filterClause}
        OPTIONAL MATCH (u)-[:HAS_ROLE]->(r:Role)
        WITH u, kyc, tr, r
        RETURN u {
          userId:u.userId, 
          email:u.email,
          givenNames:kyc.givenNames,
          familyName:kyc.familyName,
          fullName: kyc.fullName,
          tokenRecipientAddress:tr.address,
          countryOfResidence: kyc.countryOfResidence,
          roles:collect(r.name)
        }
        ORDER BY u['${orderBy}'] ${order}
        SKIP ${skip}
        LIMIT ${limit}
      `
    );

    const countResult = await runQuery(
      `
        MATCH (u:User)-[:HAS_KYC]->(kyc:KYC)
        WITH count(u) AS usersCount
        RETURN usersCount as total
      `
    );

    return createPaginationResult(
      'users',
      result,
      countResult,
      'u'
    );
  }
  catch(error) {
    throw new Error(`Error reading partial users due to ${error.message}`);
  }
};

const readUsers = async () => {
  try {
    const result = await runQuery(
      `
        MATCH (u:User)
        WITH u, [(u)-[:HAS_BTC]->(btc:BTC) | btc] as btc,
          [(u)-[:HAS_ETH]->(eth:ETH) | eth] as eth,
          [(u)-[:HAS_TOKEN_RECIPIENT_ADDRESS]->(tr:TokenRecipientAddress) | tr] as tr,
          [(u)-[h:HAS_INITIATED_KYC]->(initiatedKyc:KYC) | initiatedKyc] as initiatedKyc,
          [(u)-[h:HAS_INITIATED_KYC]->(initiatedKyc:KYC) | initiatedKyc] as h,
          [(u)-[:HAS_KYC]->(kyc:KYC) | kyc] as kyc,
          [(u)-[:HAS_AML]->(aml:AML) | aml] as aml

        WHERE NOT EXISTS ((u)-[:HAS_ROLE]->())
        WITH u, btc, eth, tr, kyc, aml, initiatedKyc[0] as initKyc, h
        RETURN distinct u {
            .*, 
            btcAddress:btc[0].address, 
            ethAddress:eth[0].address,
            tokenRecipientAddress:tr[0].address, 
            aml: aml[0],
            initiatedKyc: initKyc {.*, hasFailed: h[0].hasFailedKyc},
            kyc: kyc[0]
        }
      `
    );

    return unwrapCypherResult(result, 'u');
  }
  catch(error) {
    throw new Error(`Error reading users due to ${error.message}`);
  }
};

const readUsersCountries = async () => {
  try {
    const result = await runQuery(
      `
        MATCH (u:User)-[:HAS_KYC]->(k:KYC)
        WITH k.countryOfResidence as countryOfResidence, count(DISTINCT k) as countryCount
        WITH collect([countryOfResidence, countryCount]) as countriesList

        RETURN countriesList
      `
    );

    return unwrapCypherResult(result, 'countriesList')
      .map(immutableGet(0));
  }
  catch(error) {
    throw new Error(`Error reading user countries: ${error.message}`);
  }
};

module.exports = {
  createPartialUser: normalizeParams(createPartialUser),
  createUserVestingSettings: normalizeParams(createUserVestingSettings),
  accountExists: normalizeParams(accountExists),
  createAccount: normalizeParams(createAccount),
  deleteAccount: normalizeParams(deleteAccount),
  readRoles: normalizeParams(readRoles),
  createRole: normalizeParams(createRole),
  updateRoles: normalizeParams(updateRoles),
  getAccount: normalizeParams(getAccount),
  getAccountByBtc: normalizeParams(getAccountByBtc),
  getAccountByEth: normalizeParams(getAccountByEth),
  readAccountFromBtcAddress: normalizeParams(readAccountFromBtcAddress),
  readAccountFromEthAddress: normalizeParams(readAccountFromEthAddress),
  tokenRecipientAddressExists: normalizeParams(tokenRecipientAddressExists),
  createTokenRecipientAddress: normalizeParams(createTokenRecipientAddress),
  ethereumAddressExists: normalizeParams(ethereumAddressExists),
  readTokenRecipientAddress: normalizeParams(readTokenRecipientAddress),
  createEthereumAddress: normalizeParams(createEthereumAddress),
  updateTokenRecipientAddress: normalizeParams(updateTokenRecipientAddress),
  updateEthereumAddress: normalizeParams(updateEthereumAddress),
  readEthereumAddress: normalizeParams(readEthereumAddress),
  deleteEthAddress: normalizeParams(deleteEthAddress),
  readPartialUsers: normalizeParams(readPartialUsers),
  readUsers: normalizeParams(readUsers),
  readEthereumAddressByName: normalizeParams(readEthereumAddressByName),
  readUsersCountries: normalizeParams(readUsersCountries)
};
