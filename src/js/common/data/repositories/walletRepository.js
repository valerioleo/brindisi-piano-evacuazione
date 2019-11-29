const {runQuery} = require('../query');
const {createMultisigFromXpub} = require('../../../bitcoin-utils/wallet/bip32');
const {
  unwrapCypherSingleResult,
  unwrapCypherResult,
  getInteger,
  normalizeParams
} = require('../utils');

const loadWallet = async () => {
  try {
    const result = await runQuery(
      `
      MATCH (w:Wallet)
      RETURN w
      `
    );

    return unwrapCypherSingleResult(result, 'w');
  }
  catch(error) {
    throw new Error(`Error loading wallet data ${error.message}`);
  }
};

const getBtcAddressesCount = async () => {
  try {
    const result = await runQuery(
      `
      MATCH (b:BTC)
      RETURN count(*) as count
      `
    );

    return getInteger(result[0]._fields[0]);
  }
  catch(error) {
    throw new Error(`Error counting the number of btc addresses due to ${error.message}`);
  }
};

const getAllBtcAddresses = async () => {
  try {
    const result = await runQuery(
      `
        MATCH (btc:BTC)
        RETURN btc.address
      `
    );

    return unwrapCypherResult(result, 'btc.address');
  }
  catch(error) {
    throw new Error(`Error loading btc address due to ${error.message}`);
  }
};

const createNextAddress = async () => {
  try {
    const {
      MULTISIG_M,
      MULTISIG_N,
      MULTISIG_XPUBS
    } = process.env;

    const count = await getBtcAddressesCount();

    return [
      createMultisigFromXpub(
        Number(MULTISIG_M),
        Number(MULTISIG_N),
        Object.values(MULTISIG_XPUBS.split(',')),
        count
      ),
      count
    ];
  }
  catch(error) {
    throw new Error(`Error creating the next address ${error.message}`);
  }
};

// CREATE(w: Wallet {m: ${m}, n: ${n}, xpubs: ${formattedXpubs}})
const createWallet = async (m, n, xpubs) => {
  const formattedXpubs = JSON.stringify(xpubs);

  try {
    const result = await runQuery(
      `
      MERGE (w:Wallet)
      ON CREATE SET w.m=${m}, w.n=${n}, w.xpubs=${formattedXpubs}
      ON MATCH SET w.m=${m}, w.n=${n}, w.xpubs=${formattedXpubs}
      RETURN w
      `
    );
    return unwrapCypherResult(result, 'w');
  }
  catch(error) {
    throw new Error(`Error creating the next address ${error.message}`);
  }
};

const deleteWallets = async () => {
  try {
    const result = await runQuery(
      `
        MATCH (w:Wallet)
        DETACH DELETE w
      `
    );
  }
  catch(error) {
    throw new Error(`Error delete wallets due to: ${error.message}`);
  }
};

module.exports = {
  createNextAddress: normalizeParams(createNextAddress),
  getAllBtcAddresses: normalizeParams(getAllBtcAddresses),
  createWallet: normalizeParams(createWallet),
  loadWallet: normalizeParams(loadWallet),
  deleteWallets: normalizeParams(deleteWallets)
};
