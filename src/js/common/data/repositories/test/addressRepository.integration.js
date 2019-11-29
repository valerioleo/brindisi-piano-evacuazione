const {test, serial} = require('ava');
const {initDB} = require('../../../test/helpers');
const {
  createPartialUser,
  deleteAccount
} = require('../accountRepository');
const {readKycFromEthAddress} = require('../addressRepository');
const {
  createUserData,
  DEFAULT_USER_ID,
  VALID_ETH_ADDRESS,
  saveTokenRecipientAddress
} = require('../../../../common-api/test/helpers/account');
const {
  saveKycAndAml
} = require('../../../../common-api/test/helpers/kyc');
const {ignoreProp} = require('../../../../common/fn');
const {cleanDb} = require('../testRepository');

test.before(async () => {
  await initDB();
});

test.beforeEach(async () => {
  await deleteAccount(DEFAULT_USER_ID);
});

test.afterEach.always(async () => {
  await cleanDb();
});

serial('readKycFromEthAddress should return a kyc object if recipient address exist', async t => {
  const userData = createUserData('', {id: DEFAULT_USER_ID});
  await createPartialUser(userData);
  const {kyc} = await saveKycAndAml(DEFAULT_USER_ID, 1);
  await saveTokenRecipientAddress(DEFAULT_USER_ID, VALID_ETH_ADDRESS);

  const readKycFromEthAddressResult = await readKycFromEthAddress(VALID_ETH_ADDRESS);

  await readKycFromEthAddressResult.matchWith({
    Just: ({value}) => {
      t.deepEqual(kyc, ignoreProp('userId')(value.toJS()));
    }
  });
});

serial('readKycFromEthAddress should return Nothing if TokenRecipientAddress is found but KYC not', async t => {
  const userData = createUserData('', {id: DEFAULT_USER_ID});
  await createPartialUser(userData);
  await saveKycAndAml(DEFAULT_USER_ID, 1);

  const readKycFromEthAddressResult = await readKycFromEthAddress(VALID_ETH_ADDRESS);

  await readKycFromEthAddressResult.matchWith({
    Just: t.fail.bind(t),
    Nothing: t.pass.bind(t)
  });
});

serial('readKycFromEthAddress should return Nothing if TokenRecipientAddress is not found', async t => {
  const readKycFromEthAddressResult = await readKycFromEthAddress(VALID_ETH_ADDRESS);

  await readKycFromEthAddressResult.matchWith({
    Just: t.fail.bind(t),
    Nothing: t.pass.bind(t)
  });
});
