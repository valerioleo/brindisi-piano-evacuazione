const {test, serial} = require('ava')
const {initDB} = require('../../../test/helpers')
const {
  createNextAddress,
  getAllBtcAddresses,
  createWallet,
  loadWallet,
  deleteWallets
} = require('../walletRepository')
const {
  createExtendedUser,
  deleteAccount,
  getIndexedUserId,
} = require('../../../../common-api/test/helpers/account')
const {
  createWalletData,
  btcAddresses
} = require('../../../../common-api/test/helpers/wallet')
const {cleanDb} = require('../testRepository');

test.before(async () => {
  await initDB();
});

test.afterEach.always(async () => {
  await cleanDb();
});

serial('getAllBtcAddresses should return all btc addresses', async t => {
  await createExtendedUser(getIndexedUserId(1));
  await createExtendedUser(getIndexedUserId(2));
  await createExtendedUser(getIndexedUserId(3));
  const getAllBtcAddressesResult = await getAllBtcAddresses();
  await deleteAccount(getIndexedUserId(1));
  await deleteAccount(getIndexedUserId(2));
  await deleteAccount(getIndexedUserId(3));

  await getAllBtcAddressesResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.is(data.length, 3);
      t.true(btcAddresses.slice(0, 3).every(item => data.includes(item)));
    }
  });
});

serial('createWallet should create wallet', async t => {
  const walletData = createWalletData();
  await createWallet(...Object.values(walletData));

  const loadWalletResult = await loadWallet();

  loadWalletResult.matchWith({
    Just: ({value}) => t.deepEqual(value.toJS(), walletData)
  })
});

serial('loadWallet should return wallet', async t => {
  const walletData = createWalletData();
  await createWallet(...Object.values(walletData));

  const loadWalletResult = await loadWallet();

  loadWalletResult.matchWith({
    Just: ({value}) => t.deepEqual(value.toJS(), walletData)
  });
});

serial('createNextAddress should generate the next btc addresses', async t => {
  const createNextAddressResult = await createNextAddress();

  t.true(Array.isArray(createNextAddressResult));
  t.is(createNextAddressResult[0], btcAddresses[0]);
  t.is(createNextAddressResult[1], 0);
});
