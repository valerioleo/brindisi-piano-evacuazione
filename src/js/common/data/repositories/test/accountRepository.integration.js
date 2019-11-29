const {test, serial} = require('ava');
const Maybe = require('folktale/maybe');
const matchesProperty = require('lodash.matchesproperty');
const {initDB} = require('../../../test/helpers');
const {maybeValueReturn, toJS} = require('../../../fn');
const {
  createPartialUser,
  createUserVestingSettings,
  accountExists,
  createAccount,
  deleteAccount,
  readRoles,
  createRole,
  getAccount,
  getAccountByBtc,
  getAccountByEth,
  readAccountFromBtcAddress,
  readAccountFromEthAddress,
  tokenRecipientAddressExists,
  createTokenRecipientAddress,
  ethereumAddressExists,
  readTokenRecipientAddress,
  createEthereumAddress,
  updateTokenRecipientAddress,
  updateEthereumAddress,
  readEthereumAddress,
  deleteEthAddress,
  readPartialUsers,
  readUsers,
  readEthereumAddressByName,
  readUsersCountries,
  updateRoles
} = require('../accountRepository');
const {createNextAddress} = require('../walletRepository');
const {
  createUserData,
  DEFAULT_USER_ID,
  VALID_ETH_ADDRESS,
  getIndexedUserId,
  getIndexedEthAddress,
  createNewUser,
  saveEthAddress,
  saveTokenRecipientAddress,
  createExtendedUser
} = require('../../../../common-api/test/helpers/account');
const {btcAddresses} = require('../../../../common-api/test/helpers/wallet');
const {
  saveKycAndAml,
  saveKyc,
  defaultYotiKycData,
  defaultAmlData
} = require('../../../../common-api/test/helpers/kyc');
const {cleanDb} = require('../testRepository');

test.before(async () => {
  await initDB();
});

test.beforeEach(async () => {
  await deleteAccount(DEFAULT_USER_ID);
  await deleteAccount(getIndexedUserId(1));
  await deleteAccount(getIndexedUserId(2));
  await deleteAccount(getIndexedUserId(3));
});

test.afterEach.always(async () => {
  await cleanDb();
});

serial('createPartialUser should create user and return object', async t => {
  const userData = createUserData('', {id: getIndexedUserId(1)});
  const createPartialUserResult = await createPartialUser(userData);

  createPartialUserResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.deepEqual(data, {
        creationType: userData.creationType,
        isVested: false,
        name: userData.name,
        countryOfResidence: userData.countryOfResidence,
        email: userData.email,
        userId: userData.id
      });
    }
  });

  const accountExistsResult = await accountExists(getIndexedUserId(1));

  await accountExistsResult.matchWith({
    Just: ({value}) => {
      t.true(value);
    }
  });

  const getAccountResult = await getAccount(getIndexedUserId(1));

  await getAccountResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.deepEqual(data, {
        aml: null,
        btcAddress: null,
        userId: userData.id,
        initiatedKyc: null,
        name: userData.name,
        tokenRecipientAddress: null,
        kyc: null,
        countryOfResidence: userData.countryOfResidence,
        creationType: userData.creationType,
        isVested: false,
        ethAddress: null,
        email: userData.email,
        roles: []
      });
    }
  });
});

serial('createUserVestingSettings should change property isVested', async t => {
  await createNewUser(getIndexedUserId(1));
  await createUserVestingSettings(getIndexedUserId(1), true);

  const getAccountResult = await getAccount(getIndexedUserId(1));

  await getAccountResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.true(data.isVested);
    }
  });
});

serial('createUserVestingSettings should not changed property isVested if userId not found', async t => {
  await createNewUser(getIndexedUserId(1));
  await createUserVestingSettings('test', true);

  const getAccountResult = await getAccount(getIndexedUserId(1));

  await getAccountResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.false(data.isVested);
    }
  });
});

serial('createAccount should create btc for user and return object', async t => {
  const userData = createUserData('', {id: getIndexedUserId(1)});
  await createPartialUser(userData);
  await createExtendedUser(getIndexedUserId(2));
  await createExtendedUser(getIndexedUserId(3));

  const createAccountResult = await createAccount(getIndexedUserId(1));

  await createAccountResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.deepEqual(data, {
        creationType: userData.creationType,
        isVested: false,
        btcAddress: btcAddresses[2],
        name: userData.name,
        countryOfResidence: userData.countryOfResidence,
        userId: userData.id,
        email: userData.email
      });
    }
  });

  const getAccountResult = await getAccount(getIndexedUserId(1));

  const btcAddress = await getAccountResult.matchWith({
    Just: ({value}) => {
      t.truthy(value.get('btcAddress'));
      return value.get('btcAddress');
    }
  });

  const getAccountByBtcResult = await getAccountByBtc(btcAddress);

  await getAccountByBtcResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.is(data.userId, userData.id);
    }
  });
});

serial('deleteAccount should delete account', async t => {
  const userData = createUserData('', {id: getIndexedUserId(1)});
  await createPartialUser(userData);
  await deleteAccount(getIndexedUserId(1));

  const getAccountResult = await getAccount(getIndexedUserId(1));

  t.true(Maybe.Nothing.hasInstance(getAccountResult));
});

serial('deleteAccount should not deleted if userId not found', async t => {
  const userData = createUserData('', {id: getIndexedUserId(1)});
  await createPartialUser(userData);
  await deleteAccount('test');

  const getAccountResult = await getAccount(getIndexedUserId(1));
  t.true(Maybe.Just.hasInstance(getAccountResult));
});

serial('accountExists should return true if user exists', async t => {
  const userData = createUserData('', {id: getIndexedUserId(1)});
  await createPartialUser(userData);

  const accountExistsResult = await accountExists(getIndexedUserId(1));
  await accountExistsResult.matchWith({
    Just: ({value}) => {
      t.true(value);
    }
  });
});

serial('accountExists should return Nothing if the user does not exist', async t => {
  const accountExistsResult = await accountExists(getIndexedUserId(1));
  t.true(Maybe.Nothing.hasInstance(accountExistsResult));
});

serial('createRole should create role for user and return object', async t => {
  const userData = createUserData('', {id: getIndexedUserId(1)});
  await createPartialUser(userData);
  const role = 'test';
  const createRoleResult = await createRole(getIndexedUserId(1), role);
  await createRoleResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.is(data.name, role);
    }
  });
  const readRolesResult = await readRoles(getIndexedUserId(1));
  await readRolesResult.matchWith({
    Just: ({value}) => {
      const roles = value.toJS();

      t.true(Array.isArray(roles));
      t.is(roles.length, 1);
      t.is(roles[0].name, role);
    }
  });
});

serial('readRoles should return Nothing if role not created', async t => {
  const userData = createUserData('', {id: getIndexedUserId(1)});
  await createPartialUser(userData);

  const readRolesResult = await readRoles(getIndexedUserId(1));

  const roles = readRolesResult.matchWith({
    Just: maybeValueReturn(toJS),
    Nothing: t.fail.bind(t)
  });
  t.deepEqual(roles, []);
});

serial('readRoles should return Nothing if userId not found', async t => {
  const readRolesResult = await readRoles(getIndexedUserId(1));

  const roles = readRolesResult.matchWith({
    Just: maybeValueReturn(toJS),
    Nothing: t.fail.bind(t)
  });
  t.deepEqual(roles, []);
});

serial('getAccount should return an object of account user', async t => {
  const userData = createUserData('', {id: getIndexedUserId(1)});
  await createPartialUser(userData);

  const getAccountResult = await getAccount(getIndexedUserId(1));
  await getAccountResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.deepEqual(data, {
        aml: null,
        btcAddress: null,
        userId: userData.id,
        initiatedKyc: null,
        name: userData.name,
        tokenRecipientAddress: null,
        kyc: null,
        countryOfResidence: userData.countryOfResidence,
        creationType: userData.creationType,
        isVested: false,
        ethAddress: null,
        email: userData.email,
        roles: []
      });
    }
  });
});

serial('getAccount should return Nothing if userId not found', async t => {
  const userData = createUserData('', {id: getIndexedUserId(1)});
  await createPartialUser(userData);

  const getAccountResult = await getAccount('test');
  t.true(Maybe.Nothing.hasInstance(getAccountResult));
});

serial('getAccountByBtc should return an object for user', async t => {
  const userData = createUserData('', {id: getIndexedUserId(1)});
  await createPartialUser(userData);

  const createAccountResult = await createAccount(getIndexedUserId(1));
  const btcAddress = createAccountResult.matchWith({
    Just: ({value}) => value.get('btcAddress')
  });

  const getAccountByBtcResult = await getAccountByBtc(btcAddress);

  await getAccountByBtcResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.deepEqual(data, {
        creationType: userData.creationType,
        isVested: false,
        name: userData.name,
        countryOfResidence: userData.countryOfResidence,
        userId: getIndexedUserId(1),
        email: userData.email
      });
    }
  });
});

serial('getAccountByBtc should return Nothing if btcAddress not found', async t => {
  const userData = createUserData('', {id: getIndexedUserId(1)});
  await createPartialUser(userData);

  const getAccountByBtcResult = await getAccountByBtc('test');
  t.true(Maybe.Nothing.hasInstance(getAccountByBtcResult));
});

serial('getAccountByEth should return an object for user', async t => {
  const userData = createUserData('', {id: getIndexedUserId(1)});
  await createPartialUser(userData);
  await saveEthAddress(getIndexedUserId(1));

  const getAccountByEthResult = await getAccountByEth(VALID_ETH_ADDRESS);

  getAccountByEthResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.deepEqual(data, {
        creationType: userData.creationType,
        name: userData.name,
        countryOfResidence: userData.countryOfResidence,
        userId: userData.id,
        email: userData.email,
        isVested: false
      });
    }
  });
});

serial('getAccountByEth should return Nothing if ethAddress not found', async t => {
  const userData = createUserData('', {id: getIndexedUserId(1)});
  await createPartialUser(userData);
  await saveEthAddress(getIndexedUserId(1));

  const getAccountByEthResult = await getAccountByEth('test');

  t.true(Maybe.Nothing.hasInstance(getAccountByEthResult));
});

serial('readAccountFromBtcAddress should return user data', async t => {
  const userData = createUserData('', {id: getIndexedUserId(1)});
  await createPartialUser(userData);
  await saveKycAndAml(getIndexedUserId(1), 1);

  const createAccountResult = await createAccount(getIndexedUserId(1));
  const btcAddress = createAccountResult.matchWith({
    Just: ({value}) => value.get('btcAddress')
  });

  const readAccountFromBtcAddressResult = await readAccountFromBtcAddress(btcAddress);
  await readAccountFromBtcAddressResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.is(data.email, userData.email);
    }
  });
});

serial('readAccountFromBtcAddress should return Nothing if btcAddress not found', async t => {
  const userData = createUserData('', {id: getIndexedUserId(1)});
  await createPartialUser(userData);
  await saveKycAndAml(getIndexedUserId(1), 1);

  await createAccount(getIndexedUserId(1));

  const readAccountFromBtcAddressResult = await readAccountFromBtcAddress('test');
  t.true(Maybe.Nothing.hasInstance(readAccountFromBtcAddressResult));
});

serial('readAccountFromEthAddress should return user data', async t => {
  const userData = createUserData('', {id: getIndexedUserId(1)});
  await createPartialUser(userData);
  await saveKycAndAml(getIndexedUserId(1), 1);
  await saveEthAddress(getIndexedUserId(1));

  const readAccountFromEthAddressResult = await readAccountFromEthAddress(VALID_ETH_ADDRESS);
  await readAccountFromEthAddressResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.is(data.email, userData.email);
      t.deepEqual(data.kyc, defaultYotiKycData(1));
    }
  });
});

serial('readAccountFromEthAddress should return Nothing if ethAddress not found', async t => {
  const userData = createUserData('', {id: getIndexedUserId(1)});
  await createPartialUser(userData);
  await saveKycAndAml(getIndexedUserId(1), 1);
  await saveEthAddress(getIndexedUserId(1));

  const readAccountFromEthAddressResult = await readAccountFromEthAddress('test');
  t.true(Maybe.Nothing.hasInstance(readAccountFromEthAddressResult));
});

serial('tokenRecipientAddressExists should return true if recipient address exist', async t => {
  const userData = createUserData('', {id: getIndexedUserId(1)});
  await createPartialUser(userData);
  await saveTokenRecipientAddress(getIndexedUserId(1), VALID_ETH_ADDRESS);

  const tokenRecipientAddressExistsResult = await tokenRecipientAddressExists(VALID_ETH_ADDRESS);

  await tokenRecipientAddressExistsResult.matchWith({
    Just: ({value}) => {
      t.true(value);
    }
  });
  const getAccountResult = await getAccount(getIndexedUserId(1));

  await getAccountResult.matchWith({
    Just: ({value}) => {
      t.is(value.get('tokenRecipientAddress'), VALID_ETH_ADDRESS.toLowerCase());
    }
  });
});

serial('tokenRecipientAddressExists should return Nothing if address not found', async t => {
  const userData = createUserData('', {id: getIndexedUserId(1)});
  await createPartialUser(userData);
  await saveTokenRecipientAddress(getIndexedUserId(1), VALID_ETH_ADDRESS);

  const tokenRecipientAddressExistsResult = await tokenRecipientAddressExists('test');

  t.true(Maybe.Nothing.hasInstance(tokenRecipientAddressExistsResult));
  const getAccountResult = await getAccount(getIndexedUserId(1));

  await getAccountResult.matchWith({
    Just: ({value}) => {
      t.is(value.get('tokenRecipientAddress'), VALID_ETH_ADDRESS.toLowerCase());
    }
  });
});

serial('createTokenRecipientAddress should create Token recipient', async t => {
  const userData = createUserData('', {id: getIndexedUserId(1)});
  await createPartialUser(userData);
  await createTokenRecipientAddress(getIndexedUserId(1), VALID_ETH_ADDRESS);

  const tokenRecipientAddressExistsResult = await tokenRecipientAddressExists(VALID_ETH_ADDRESS);

  await tokenRecipientAddressExistsResult.matchWith({
    Just: ({value}) => {
      t.true(value);
    }
  });
  const getAccountResult = await getAccount(getIndexedUserId(1));

  await getAccountResult.matchWith({
    Just: ({value}) => {
      t.is(value.get('tokenRecipientAddress'), VALID_ETH_ADDRESS.toLowerCase());
    }
  });
});

serial('createTokenRecipientAddress should return Nothing if ethAddress not found', async t => {
  const userData = createUserData('', {id: getIndexedUserId(1)});
  await createPartialUser(userData);
  await createTokenRecipientAddress(getIndexedUserId(1), 'test');

  const tokenRecipientAddressExistsResult = await tokenRecipientAddressExists(VALID_ETH_ADDRESS);

  t.true(Maybe.Nothing.hasInstance(tokenRecipientAddressExistsResult));
});

serial('ethereumAddressExists should return true if eth address exists', async t => {
  const userData = createUserData('', {id: getIndexedUserId(1)});
  await createPartialUser(userData);
  await saveEthAddress(getIndexedUserId(1));

  const ethereumAddressExistsResult = await ethereumAddressExists(VALID_ETH_ADDRESS);
  await ethereumAddressExistsResult.matchWith({
    Just: ({value}) => {
      t.true(value);
    }
  });
  const getAccountResult = await getAccount(getIndexedUserId(1));

  await getAccountResult.matchWith({
    Just: ({value}) => {
      t.is(value.get('ethAddress'), VALID_ETH_ADDRESS.toLowerCase());
    }
  });
});

serial('ethereumAddressExists should return Nothing if ethAddress not found', async t => {
  const userData = createUserData('', {id: getIndexedUserId(1)});
  await createPartialUser(userData);
  await saveEthAddress(getIndexedUserId(1));

  const ethereumAddressExistsResult = await ethereumAddressExists('test');
  t.true(Maybe.Nothing.hasInstance(ethereumAddressExistsResult));
});

serial('readTokenRecipientAddress should read eth token recipient', async t => {
  const userData = createUserData('', {id: getIndexedUserId(1)});
  await createPartialUser(userData);
  await saveTokenRecipientAddress(getIndexedUserId(1), VALID_ETH_ADDRESS);
  const readTokenRecipientAddressResult = await readTokenRecipientAddress(getIndexedUserId(1));

  await readTokenRecipientAddressResult.matchWith({
    Just: ({value}) => {
      t.is(value, VALID_ETH_ADDRESS.toLocaleLowerCase());
    }
  });
});

serial('readTokenRecipientAddress should return Nothing if ethAddress not found', async t => {
  const userData = createUserData('', {id: getIndexedUserId(1)});
  await createPartialUser(userData);

  const readTokenRecipientAddressResult = await readTokenRecipientAddress(getIndexedUserId(1));

  t.true(Maybe.Nothing.hasInstance(readTokenRecipientAddressResult));
});

serial('readTokenRecipientAddress should return Nothing if userId not found', async t => {
  const userData = createUserData('', {id: getIndexedUserId(1)});
  await createPartialUser(userData);
  await saveTokenRecipientAddress(getIndexedUserId(1), VALID_ETH_ADDRESS);
  const readTokenRecipientAddressResult = await readTokenRecipientAddress('test');

  t.true(Maybe.Nothing.hasInstance(readTokenRecipientAddressResult));
});

serial('createEthereumAddress should create eth address', async t => {
  const userData = createUserData('', {id: getIndexedUserId(1)});
  await createPartialUser(userData);
  await createEthereumAddress(getIndexedUserId(1), VALID_ETH_ADDRESS);
  const getAccountByEthResult = await getAccountByEth(VALID_ETH_ADDRESS);

  getAccountByEthResult.matchWith({
    Just: ({value}) => {
      t.is(value.get('userId'), getIndexedUserId(1));
    }
  });
  const getAccountResult = await getAccount(getIndexedUserId(1));

  getAccountResult.matchWith({
    Just: ({value}) => {
      t.is(value.get('ethAddress'), VALID_ETH_ADDRESS.toLowerCase());
    }
  });
});

serial('createEthereumAddress should not created if userId not found ', async t => {
  const userData = createUserData('', {id: getIndexedUserId(1)});
  await createPartialUser(userData);
  await createEthereumAddress('test', VALID_ETH_ADDRESS);
  const getAccountByEthResult = await getAccountByEth(VALID_ETH_ADDRESS);

  t.true(Maybe.Nothing.hasInstance(getAccountByEthResult));
});

serial('updateTokenRecipientAddress should update recipient token address', async t => {
  const userData = createUserData('', {id: getIndexedUserId(1)});
  await createPartialUser(userData);
  await saveTokenRecipientAddress(getIndexedUserId(1), VALID_ETH_ADDRESS);

  const readTokenRecipientAddressResultOld = await readTokenRecipientAddress(getIndexedUserId(1));

  readTokenRecipientAddressResultOld.matchWith({
    Just: ({value}) => {
      t.is(value, VALID_ETH_ADDRESS);
    }
  });

  await updateTokenRecipientAddress(getIndexedUserId(1), getIndexedEthAddress(1));
  const readTokenRecipientAddressResultNew = await readTokenRecipientAddress(getIndexedUserId(1));
  await readTokenRecipientAddressResultNew.matchWith({
    Just: ({value}) => {
      t.is(value, getIndexedEthAddress(1).toLowerCase());
    }
  });
});

serial('updateEthereumAddress should update eth address', async t => {
  const userData = createUserData('', {id: getIndexedUserId(1)});
  await createPartialUser(userData);
  await saveEthAddress(getIndexedUserId(1));
  await updateEthereumAddress(getIndexedUserId(1), getIndexedEthAddress(1));

  const getAccountByEthResultOld = await getAccountByEth(VALID_ETH_ADDRESS);

  t.true(Maybe.Nothing.hasInstance(getAccountByEthResultOld));

  const getAccountByEthResultNew = await getAccountByEth(getIndexedEthAddress(1));

  await getAccountByEthResultNew.matchWith({
    Just: ({value}) => {
      t.is(value.get('userId'), getIndexedUserId(1));
    }
  });
  const getAccountResult = await getAccount(getIndexedUserId(1));

  getAccountResult.matchWith({
    Just: ({value}) => {
      t.is(value.get('ethAddress'), getIndexedEthAddress(1).toLowerCase());
    }
  });
});

serial('updateEthereumAddress should not updated eth address if userId not found', async t => {
  const userData = createUserData('', {id: getIndexedUserId(1)});
  await createPartialUser(userData);
  await saveEthAddress(getIndexedUserId(1));
  await updateEthereumAddress('test', getIndexedEthAddress(1));

  const getAccountByEthResultOld = await getAccountByEth(VALID_ETH_ADDRESS);

  await getAccountByEthResultOld.matchWith({
    Just: ({value}) => {
      t.is(value.get('userId'), getIndexedUserId(1));
    }
  });

  const getAccountByEthResultNew = await getAccountByEth(getIndexedEthAddress(1));

  t.true(Maybe.Nothing.hasInstance(getAccountByEthResultNew));
});

serial('readEthereumAddress should return eth address for user', async t => {
  const userData = createUserData('', {id: getIndexedUserId(1)});
  await createPartialUser(userData);
  await saveEthAddress(getIndexedUserId(1));

  const readEthereumAddressResult = await readEthereumAddress(
    getIndexedUserId(1),
    VALID_ETH_ADDRESS
  );

  await readEthereumAddressResult.matchWith({
    Just: ({value}) => {
      t.is(value, VALID_ETH_ADDRESS.toLowerCase());
    }
  });
});

serial('readEthereumAddress should return Nothing if userId not found', async t => {
  const userData = createUserData('', {id: getIndexedUserId(1)});
  await createPartialUser(userData);
  await saveEthAddress(getIndexedUserId(1));

  const readEthereumAddressResult = await readEthereumAddress('test', VALID_ETH_ADDRESS);

  t.true(Maybe.Nothing.hasInstance(readEthereumAddressResult));
});

serial('readEthereumAddress should return Nothing if eth address not found', async t => {
  const userData = createUserData('', {id: getIndexedUserId(1)});
  await createPartialUser(userData);

  const readEthereumAddressResult = await readEthereumAddress(getIndexedUserId(1));

  t.true(Maybe.Nothing.hasInstance(readEthereumAddressResult));
});

serial('deleteEthAddress should delete eth address for user', async t => {
  const userData = createUserData('', {id: getIndexedUserId(1)});
  await createPartialUser(userData);
  await saveEthAddress(getIndexedUserId(1));
  await deleteEthAddress(getIndexedUserId(1), VALID_ETH_ADDRESS);

  const readEthereumAddressResult = await readEthereumAddress(
    getIndexedUserId(1),
    VALID_ETH_ADDRESS
  );

  t.true(Maybe.Nothing.hasInstance(readEthereumAddressResult));
});

serial('deleteEthAddress should not deleted eth address if userId not found', async t => {
  const userData = createUserData('', {id: getIndexedUserId(1)});
  await createPartialUser(userData);
  await saveEthAddress(getIndexedUserId(1));
  await deleteEthAddress('test', VALID_ETH_ADDRESS);

  const readEthereumAddressResult = await readEthereumAddress(
    getIndexedUserId(1),
    VALID_ETH_ADDRESS
  );

  t.true(Maybe.Just.hasInstance(readEthereumAddressResult));
});

serial('deleteEthAddress should not deleted eth address if eth address not found', async t => {
  const userData = createUserData('', {id: getIndexedUserId(1)});
  await createPartialUser(userData);
  await saveEthAddress(getIndexedUserId(1));
  await deleteEthAddress(getIndexedUserId(1), 'test');

  const readEthereumAddressResult = await readEthereumAddress(
    getIndexedUserId(1),
    VALID_ETH_ADDRESS
  );

  t.true(Maybe.Just.hasInstance(readEthereumAddressResult));
});

serial('readPartialUsers should return array of object users', async t => {
  const userData1 = createUserData('', {id: getIndexedUserId(1)});
  const userData2 = createUserData('', {id: getIndexedUserId(2)});
  await createPartialUser(userData1);
  await createPartialUser(userData2);
  await saveKycAndAml(getIndexedUserId(1), 1);
  await saveKycAndAml(getIndexedUserId(2), 2);

  const readPartialUsersResult = await readPartialUsers({});
  const partialUsers = readPartialUsersResult.unsafeGet().toJS();

  t.is(partialUsers.count, 2);
  const usersData = partialUsers.users;
  t.is(usersData.length, 2);
  t.true(usersData.some(item => item.userId === getIndexedUserId(1)));
  t.true(usersData.some(item => item.userId === getIndexedUserId(2)));
});

serial('readPartialUsers should return empty array if kyc not set', async t => {
  const userData1 = createUserData('', {id: getIndexedUserId(1)});
  const userData2 = createUserData('', {id: getIndexedUserId(2)});
  await createPartialUser(userData1);
  await createPartialUser(userData2);

  const readPartialUsersResult = await readPartialUsers({});
  const partialUsers = readPartialUsersResult.unsafeGet().toJS();

  t.is(partialUsers.count, 0);
  t.is(partialUsers.users.length, 0);
});

serial('readUsers should return array of user object', async t => {
  const userData1 = createUserData('', {id: getIndexedUserId(1)});
  const userData2 = createUserData('', {id: getIndexedUserId(2)});
  await createPartialUser(userData1);
  await createPartialUser(userData2);
  await saveKycAndAml(getIndexedUserId(1), 1);
  await saveKycAndAml(getIndexedUserId(2), 2);
  const [address] = await createNextAddress();
  await createAccount(getIndexedUserId(1));
  await createAccount(getIndexedUserId(2));

  const readUsersResult = await readUsers();
  readUsersResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.is(data.length, 2);
      const dataForUser1 = data.find(item => item.userId === getIndexedUserId(1));
      t.deepEqual(dataForUser1, {
        aml: defaultAmlData,
        btcAddress: address,
        userId: getIndexedUserId(1),
        initiatedKyc: null,
        name: userData1.name,
        tokenRecipientAddress: null,
        kyc: defaultYotiKycData(1),
        countryOfResidence: userData1.countryOfResidence,
        creationType: userData1.creationType,
        isVested: false,
        ethAddress: null,
        email: userData1.email
      });
    }
  });
});

serial('readEthereumAddressByName should return eth address for user', async t => {
  const userData = createUserData('', {name: 'John Doe', id: getIndexedUserId(1)});
  await createPartialUser(userData);
  await saveEthAddress(getIndexedUserId(1));

  const readEthereumAddressByNameResult = await readEthereumAddressByName('John');

  const expectedResult = {
    name: 'John Doe',
    address: VALID_ETH_ADDRESS
  };
  await readEthereumAddressByNameResult.matchWith({
    Just: ({value}) => {
      t.deepEqual(value.toJS()[0], expectedResult);
    }
  });
});

serial('readEthereumAddressByName should return Nothing if name does not match', async t => {
  const userData = createUserData('', {name: 'John Doe', id: getIndexedUserId(1)});
  await createPartialUser(userData);
  await saveEthAddress(getIndexedUserId(1));

  const readEthereumAddressByNameResult = await readEthereumAddressByName('test');

  const addresses = readEthereumAddressByNameResult.matchWith({
    Just: maybeValueReturn(toJS),
    Nothing: t.fail.bind(t)
  });
  t.deepEqual(addresses, []);
});

serial('readUsersCountries should return an empty array if now users exist', async t => {
  const holdersCountriesResult = await readUsersCountries();
  const holdersCountries = holdersCountriesResult.matchWith({
    Just: maybeValueReturn(toJS),
    Nothing: t.fail.bind(t)
  });

  t.deepEqual(holdersCountries, []);
});

serial('readUsersCountries should return an array with token holders countries', async t => {
  await createExtendedUser('userId1', 'ethAddress1', 'tra1', 1, false);
  await saveKyc('userId1', 1, {countryOfResidence: 'GBR'});

  await createExtendedUser('userId2', 'ethAddress2', 'tra2', 2, false);
  await saveKyc('userId2', 2, {countryOfResidence: 'GBR'});

  await createExtendedUser('userId3', 'ethAddress3', 'tra3', 3, false);
  await saveKyc('userId3', 3, {countryOfResidence: 'ITA'});

  const holdersCountriesResult = await readUsersCountries();
  const holdersCountries = holdersCountriesResult.matchWith({
    Just: maybeValueReturn(toJS),
    Nothing: t.fail.bind(t)
  });

  const gbrCountry = holdersCountries.find(matchesProperty('0', 'GBR'));
  const itaCountry = holdersCountries.find(matchesProperty('0', 'ITA'));

  t.deepEqual(gbrCountry, ['GBR', 2]);
  t.deepEqual(itaCountry, ['ITA', 1]);
});

serial('updateRoles should update roles for user', async t => {
  const userData = createUserData('', {id: getIndexedUserId(1)});
  await createPartialUser(userData);
  const role = 'test1';

  await updateRoles(getIndexedUserId(1), [role]);

  const readRolesResult = await readRoles(getIndexedUserId(1));
  const expectedResult = [{name: 'test1'}];
  await readRolesResult.matchWith({
    Just: ({value}) => {
      const roles = value.toJS();

      t.deepEqual(expectedResult, roles);
    }
  });
});

serial('updateRoles should should remove any previous roles', async t => {
  const userData = createUserData('', {id: getIndexedUserId(1)});
  await createPartialUser(userData);
  await createRole(getIndexedUserId(1), ['test_role']);
  const role = 'test1';
  await updateRoles(getIndexedUserId(1), [role]);

  const readRolesResult = await readRoles(getIndexedUserId(1));
  const expectedResult = [{name: 'test1'}];
  await readRolesResult.matchWith({
    Just: ({value}) => {
      const roles = value.toJS();

      t.deepEqual(expectedResult, roles);
    }
  });
});
