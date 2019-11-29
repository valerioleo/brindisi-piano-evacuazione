
const Maybe = require('folktale/maybe');
const {runQuery, transaction} = require('../query');
const {
  unwrapCypherResult,
  unwrapCypherSingleResult,
  createPaginationResult,
  constructCreateMatchString,
  getInteger,
  createMatchString,
  normalizeParams
} = require('../utils');

const createTokenBatch = async tokens => {
  try {
    const result = await runQuery(
      `
        UNWIND $tokens AS token
        MERGE (n:Token {address: token.tokenAddress})
        ON CREATE SET n += {
          name: token.tokenName,
          symbol: token.tokenSymbol,
          softDeleted: false,
          interface: token.tokenInterface,
          blockHeight: toInt(token.blockNumber),
          tclControllerAddress: token.tclControllerAddress,
          tclRepositoryAddress: token.tclRepositoryAddress
        }
        RETURN n {
          .*
        }
      `,
      {tokens}
    );
    return unwrapCypherResult(result, 'n');
  }
  catch(error) {
    throw new Error(`Error saving tokens batch due to: ${error.message}`);
  }
};

const createToken = async (
  tokenAddress,
  name,
  symbol,
  tokenInterface = 'CappedMintableToken',
  blockHeight = 0,
  tclController = '',
  tclRepository = ''
) => {
  try {
    const result = await runQuery(
      `
        MERGE (n:Token {address: '${tokenAddress}'})
        ON MATCH SET n.softDeleted=false
        ON CREATE SET n += {
          name: '${name}',
          symbol: '${symbol}',
          softDeleted: false,
          interface: '${tokenInterface}',
          blockHeight: toInt(${blockHeight}),
          tclControllerAddress: '${tclController}',
          tclRepositoryAddress: '${tclRepository}'
        }
        RETURN n {
          .*,
          id: ID(n)
        }
      `
    );
    return unwrapCypherSingleResult(result, 'n');
  }
  catch(error) {
    throw new Error(`Error saving token due to: ${error.message}`);
  }
};

const saveLastSuccessFullBlock = async height => {
  try {
    const result = await runQuery(
      `
      MERGE (td:TokenDeployment {exists:true})
      ON CREATE SET td.lastSuccessfullHeight=${height}
      ON MATCH SET td.lastSuccessfullHeight=${height}
      RETURN td
      `
    );
    return unwrapCypherResult(result);
  }
  catch(error) {
    throw new Error(`Error getting max block height due to: ${error.message}`);
  }
};

const getLastSuccessfullBlock = async () => {
  try {
    const result = await runQuery(
      `
      MATCH (height:TokenDeployment)
      RETURN height
      `
    );
    return unwrapCypherResult(result);
  }
  catch(error) {
    throw new Error(`Error getting max block height due to: ${error.message}`);
  }
};

const tokenExists = async tokenAddress => {
  try {
    const result = await runQuery(
      `
      MATCH (n:Token {address: '${tokenAddress}', softDeleted: false})
      RETURN exists(n.address)
      `
    );

    return unwrapCypherSingleResult(result, 'exists(n.address)');
  }
  catch(error) {
    throw new Error(`Error checking if Token with address:"${tokenAddress}" exists due to: ${error.message}`);
  }
};

const removeToken = async tokenAddress => {
  try {
    const result = await runQuery(
      `
      MATCH (token:Token {address: '${tokenAddress}'})
      SET token.softDeleted=true
      `
    );
    return unwrapCypherResult(result);
  }
  catch(error) {
    throw new Error(`Error removing token due to: ${error.message}`);
  }
};

const loadTokens = async (query = {}) => {
  try {
    const {
      isOpen,
      skip = 0,
      limit = 10000,
      order = 'desc',
      orderBy = 'blockHeight'
    } = query;

    const isOpenMatchStr = isOpen !== undefined
      ? `MATCH (token)-[r:HAS_SALE_INFO]->(b:TokenSale ${constructCreateMatchString({isOpen})})`
      : '';

    const returnQuery = isOpen !== undefined
      ? `
        RETURN token {
          .*,
          price: b.price
        }
      `
      : `
        RETURN token {
          .*
        }
      `;

    const result = await runQuery(
      `
        MATCH (token:Token {softDeleted: false})
        ${isOpenMatchStr}
        ${returnQuery}
        ORDER BY token['${orderBy}'] ${order}
        SKIP ${skip}
        LIMIT ${limit}
      `
    );

    const countResult = await runQuery(
      `
        MATCH (token:Token {softDeleted: false})
        RETURN count(token) as total
      `
    );

    return createPaginationResult(
      'tokens',
      result,
      countResult,
      'token'
    );
  }
  catch(error) {
    throw new Error(`Error loading tokens: ${error.message}`);
  }
};

const hardDeleteToken = async tokenAddress => {
  try {
    const result = await runQuery(
      `
      MATCH (token:Token {address: '${tokenAddress}'})
      DETACH DELETE token
      `
    );
    return unwrapCypherResult(result);
  }
  catch(error) {
    throw new Error(`Error removing token due to: ${error.message}`);
  }
};

const hardDeleteTokens = async () => {
  try {
    const result = await runQuery(
      `
      MATCH (token:Token)-[r:HAS_SALE_INFO]->(b)
      OPTIONAL MATCH (token:Token)
      DETACH DELETE token, b
      `
    );
    return unwrapCypherResult(result);
  }
  catch(error) {
    throw new Error(`Error removing token due to: ${error.message}`);
  }
};

const readToken = async tokenAddress => {
  try {
    const result = await runQuery(
      `
        MATCH (n:Token {address: '${tokenAddress}'})
        OPTIONAL MATCH (token)-[r:HAS_SALE_INFO]->(b:TokenSale)
        RETURN n {
          .*,
          id: ID(n),
          price: b.price,
          isOpen: b.isOpen,
          fillPositionAutomatically: b.fillPositionAutomatically
        }
      `
    );
    return unwrapCypherSingleResult(result, 'n');
  }
  catch(error) {
    throw new Error(`Error reading token due to: ${error.message}`);
  }
};

const getTokensByInterface = async tokenInterface => {
  try {
    const result = await runQuery(
      `
        MATCH (token:Token {softDeleted: false, interface: '${tokenInterface}'})
        RETURN token {
          .*
        }
      `
    );

    return unwrapCypherResult(result, 'token');
  }
  catch(error) {
    throw new Error(`Error loading tokens due to: ${error.message}`);
  }
};

const tokenTransferQuery = `
  WITH $tokenTransfer AS tokenTransfer
  MATCH (token:Token {address: tokenTransfer.address})
  MERGE (token)-[:HAS_TRANSFER]->(tk:TokenTransfer {
    txHash: tokenTransfer.txHash,
    logIndex: toInt(tokenTransfer.logIndex)
  })
  ON CREATE SET tk += {
    logIndex: toInt(tokenTransfer.logIndex),
    size: tokenTransfer.amount,
    from: tokenTransfer.from,
    to: tokenTransfer.to,
    createdAt: toInt(tokenTransfer.timestamp),
    blockNumber: toInt(tokenTransfer.blockNumber),
    txHash: tokenTransfer.txHash,
    recipientBalance: tokenTransfer.recipientBalance,
    senderBalance: tokenTransfer.senderBalance
  }
  RETURN tk {
    .*,
    id: ID(tk)
  }
`;

const updateTokenHolderQuery = `
  WITH $tokenTransfer AS tokenTransfer
  MATCH (token:Token {address: tokenTransfer.address})
  MERGE (token)-[:HAS_HOLDER]->(rth:TokenHolder {address: tokenTransfer.to})
  ON CREATE SET rth += {balance: tokenTransfer.amount}
  ON MATCH SET rth += {balance: rth.balance + tokenTransfer.amount}

  MERGE (token)-[:HAS_HOLDER]->(sth:TokenHolder {address: tokenTransfer.from})
  ON CREATE SET sth += {balance: -tokenTransfer.amount}
  ON MATCH SET sth += {balance: sth.balance - tokenTransfer.amount}
`;

const createTokenTransferTransaction = async tokenTransfers => {
  let tx;
  const toNumberAmount = {...tokenTransfers, amount: Number(tokenTransfers.amount)};

  try {
    tx = transaction();
    await tx.run(tokenTransferQuery, {tokenTransfer: toNumberAmount});
    await tx.run(updateTokenHolderQuery, {tokenTransfer: toNumberAmount});
    await tx.commit();
  }
  catch(error) {
    throw new Error(`Error running token transfer batch transaction: ${error.message}`);
  }
};

const createTokenTransfer = async tokenTransfer => {
  try {
    const result = await runQuery(
      tokenTransferQuery,
      {tokenTransfer}
    );

    return unwrapCypherResult(result, 'tk');
  }
  catch(error) {
    throw new Error(`Error creating token transfer batch due to: ${error.message}`);
  }
};

const updateTokenHolderData = async tokenTransfer => {
  try {
    return await runQuery(
      updateTokenHolderQuery,
      {tokenTransfer}
    );
  }
  catch(error) {
    throw new Error(`Error updating token holder data: ${error.message}`);
  }
};

const readTokenTransfersByToken = async (token, query = {}) => {
  const {
    skip = 0,
    limit = 10,
    order = 'desc',
    orderBy = 'createdAt'
  } = query;

  try {
    const tokenMatchStr = token
      ? constructCreateMatchString({address: token})
      : '';

    const result = await runQuery(
      `
        MATCH (token:Token ${tokenMatchStr})-[HAS_TRANSFER]->(tr:TokenTransfer)
        RETURN tr {
          .*,
          tokenAddress: token.address,
          tokenName: token.name,
          tokenSymbol: token.symbol,
          id: ID(tr)
        }
        ORDER BY tr['${orderBy}'] ${order}
        SKIP ${skip}
        LIMIT ${limit}
      `
    );

    const countResult = await runQuery(
      `
        MATCH (token:Token ${tokenMatchStr})-[HAS_TRANSFER]->(tr:TokenTransfer)
        WITH count(tr) AS transfersCount
        RETURN transfersCount as total
      `
    );

    return createPaginationResult(
      'transfers',
      result,
      countResult,
      'tr'
    );
  }
  catch(error) {
    throw new Error(`Error reading token transfers by token due to: ${error.message}`);
  }
};

const hardDeleteTransfers = async () => {
  try {
    const result = await runQuery(
      `
        MATCH (tt:TokenTransfer)
        DETACH DELETE tt
      `
    );
    return unwrapCypherResult(result, 'balance')
      .map(data => data.get(0));
  }
  catch(error) {
    throw new Error(`Error hard deleting token transfers due to: ${error.message}`);
  }
};

const readTransfersByUser = async (
  userId,
  {
    skip = 0,
    limit = 10,
    order = 'desc',
    orderBy = 'createdAt'
  }
) => {
  try {
    const result = await runQuery(
      `
        MATCH (u:User {userId: '${userId}'})-[t:HAS_TOKEN_RECIPIENT_ADDRESS]->(e:TokenRecipientAddress)
        WITH e.address AS tokenRecipientAddress
        MATCH (token:Token)-[HAS_TRANSFER]->(tr:TokenTransfer)
        WHERE 
          tr.from = tokenRecipientAddress OR 
          tr.to = tokenRecipientAddress
        RETURN tr {
          .*
        }
        ORDER BY tr['${orderBy}'] ${order}
        SKIP ${skip}
        LIMIT ${limit}
      `
    );

    const countResult = await runQuery(
      `
      MATCH (u:User {userId: '${userId}'})-[t:HAS_TOKEN_RECIPIENT_ADDRESS]->(e:TokenRecipientAddress)
      WITH e.address AS tokenRecipientAddress
      MATCH (token:Token)-[HAS_TRANSFER]->(tr:TokenTransfer)
      WHERE 
        tr.from = tokenRecipientAddress OR 
        tr.to = tokenRecipientAddress
      WITH count(tr) AS transfersCount
      RETURN transfersCount as total
      `
    );

    return createPaginationResult(
      'transfers',
      result,
      countResult,
      'tr'
    );
  }
  catch(error) {
    throw new Error(`Error reading token transfers for user ${userId} ${error.message}`);
  }
};

const readHolderBalance = async (tokenAddress, holder) => {
  try {
    const result = await runQuery(
      `
        MATCH (t:Token {address: '${tokenAddress}'})-[:HAS_HOLDER]->(th:TokenHolder {address: '${holder}'})

        RETURN sum(th.balance)
      `
    );

    return Maybe.Just(
      getInteger(result[0].get('sum(th.balance)'))
    );
  }
  catch(error) {
    throw new Error(`Error reading token balance for token ${tokenAddress} and holder ${holder} due to: ${error.message}`);
  }
};

const readHolderBalances = async (userId, query) => {
  const {
    skip = 0,
    limit = 10,
    order = 'desc',
    orderBy = 'balance'
  } = query;
  try {
    const result = await runQuery(
      `
        MATCH (u:User {userId: '${userId}'})-[HAS_TOKEN_RECIPIENT_ADDRESS]->(tr:TokenRecipientAddress)
        MATCH (t:Token)-[:HAS_HOLDER]->(th:TokenHolder {address: tr.address})

        RETURN th {
          .*,
          tokenName: t.name,
          tokenAddress: t.address,
          tokenSymbol: t.symbol
        }
        ORDER BY th['${orderBy}'] ${order}
        SKIP ${skip}
        LIMIT ${limit}
      `
    );
    return unwrapCypherResult(result, 'th');
  }
  catch(error) {
    throw new Error(`Error reading token balance for user ${userId}: ${error.message}`);
  }
};

const readTokenBalances = async (tokenAddress, skip = 0, limit = 50) => {
  try {
    const result = await runQuery(
      `
        MATCH (t:Token {address: '${tokenAddress}'})-[:HAS_HOLDER]->(th:TokenHolder)
        WHERE th.balance > 0
        OPTIONAL MATCH (u:User)-[:HAS_TOKEN_RECIPIENT_ADDRESS]->(TokenRecipientAddress {address: th.address})
        WITH t, u, th
        OPTIONAL MATCH (u:User)-[:HAS_KYC]->(k: KYC)

        RETURN th{
          .*,
          countryOfResidence: k.countryOfResidence,
          ownedBy: u
        }

        ORDER BY th.balance DESC
        SKIP ${skip}
        LIMIT ${limit}
      `
    );

    const countResult = await runQuery(
      `
        MATCH (t:Token {address: '${tokenAddress}'})-[:HAS_HOLDER]->(th:TokenHolder)
        WHERE th.balance > 0
        RETURN count(th) as total
      `
    );

    return createPaginationResult(
      'balances',
      result,
      countResult,
      'th'
    );
  }
  catch(error) {
    throw new Error(`Error reading token balances for token ${tokenAddress} due to: ${error.message}`);
  }
};

const readHoldersCountries = async (token, skip, limit) => {
  try {
    const tokenMatchStr = token
      ? constructCreateMatchString({address: token})
      : '';

    const result = await runQuery(
      `
        MATCH (t:Token ${tokenMatchStr})-[:HAS_HOLDER]->(th:TokenHolder)
        WHERE th.balance > 0
        MATCH (u:User)-[:HAS_TOKEN_RECIPIENT_ADDRESS]->(TokenRecipientAddress {address: th.address})
        MATCH (u:User)-[:HAS_KYC]->(k:KYC)
        WITH k.countryOfResidence as countryOfResidence, count(DISTINCT k) as countryCount
        RETURN [countryOfResidence, countryCount] as countriesList
        SKIP ${skip}
        LIMIT ${limit}
      `
    );

    const countResult = await runQuery(
      `
        MATCH (t:Token ${tokenMatchStr})-[:HAS_HOLDER]->(th:TokenHolder)
        WHERE th.balance > 0
        MATCH (u:User)-[:HAS_TOKEN_RECIPIENT_ADDRESS]->(TokenRecipientAddress {address: th.address})
        MATCH (u:User)-[:HAS_KYC]->(k:KYC)
        WITH k.countryOfResidence as countryOfResidence, count(DISTINCT k) as countryCount

        RETURN count(countryCount) as total
      `
    );

    return createPaginationResult(
      'countriesList',
      result,
      countResult,
      'countriesList'
    );
  }
  catch(error) {
    throw new Error(`Error reading token holders countries: ${error.message}`);
  }
};

const addFileToToken = async (tokenAddress, fileId, name) => {
  try {
    const result = await runQuery(
      `
        MATCH (n:Token {address: '${tokenAddress}'})
        CREATE (n)-[:HAS_FILE]->(f:File {
          fileId: '${fileId}',
          name: '${name}',
          softDeleted: false
        })
      `
    );

    return unwrapCypherResult(result);
  }
  catch(error) {
    throw new Error(`Error adding file to token: ${error.message}`);
  }
};

const readTokenFiles = async tokenAddress => {
  try {
    const result = await runQuery(
      `
        MATCH (n:Token {address: '${tokenAddress}'})-[r:HAS_FILE]->(f:File {softDeleted: false})
        RETURN f {
          .*,
          id: ID(f)
        }
      `
    );

    return unwrapCypherResult(result, 'f');
  }
  catch(error) {
    throw new Error(`Error reading token files: ${error.message}`);
  }
};

const removeTokenFile = async (tokenAddress, fileId) => {
  try {
    const result = await runQuery(
      `
        MATCH (n:Token {address: '${tokenAddress}'})-[r:HAS_FILE]->(f:File {fileId: '${fileId}'})
        SET f.softDeleted=true
        RETURN f
      `
    );

    return unwrapCypherSingleResult(result, 'f');
  }
  catch(error) {
    throw new Error(`Error removing token files: ${error.message}`);
  }
};

const updateToken = async (tokenAddress, properties) => {
  try {
    const result = await runQuery(
      ` 
        MATCH (n:Token {address: '${tokenAddress}'})
        SET n += {
          ${createMatchString(properties)}
        }
        RETURN n {
          .*,
          id: ID(n)
        }
      `
    );
    return unwrapCypherSingleResult(result, 'n');
  }
  catch(error) {
    throw new Error(`Error updating position ${error.message}`);
  }
};

module.exports = {
  createTokenBatch: normalizeParams(createTokenBatch),
  createToken: normalizeParams(createToken),
  tokenExists: normalizeParams(tokenExists),
  loadTokens: normalizeParams(loadTokens),
  removeToken: normalizeParams(removeToken),
  getLastSuccessfullBlock: normalizeParams(getLastSuccessfullBlock),
  saveLastSuccessFullBlock: normalizeParams(saveLastSuccessFullBlock),
  hardDeleteToken: normalizeParams(hardDeleteToken),
  readToken: normalizeParams(readToken),
  getTokensByInterface: normalizeParams(getTokensByInterface),
  createTokenTransfer: normalizeParams(createTokenTransfer),
  readTokenTransfersByToken: normalizeParams(readTokenTransfersByToken),
  updateTokenHolderData: normalizeParams(updateTokenHolderData),
  createTokenTransferTransaction: normalizeParams(createTokenTransferTransaction),
  hardDeleteTokens: normalizeParams(hardDeleteTokens),
  readHolderBalance: normalizeParams(readHolderBalance),
  readTokenBalances: normalizeParams(readTokenBalances),
  hardDeleteTransfers: normalizeParams(hardDeleteTransfers),
  readTransfersByUser: normalizeParams(readTransfersByUser),
  readHoldersCountries: normalizeParams(readHoldersCountries),
  readHolderBalances: normalizeParams(readHolderBalances),
  addFileToToken: normalizeParams(addFileToToken),
  readTokenFiles: normalizeParams(readTokenFiles),
  removeTokenFile: normalizeParams(removeTokenFile),
  updateToken: normalizeParams(updateToken)
};
