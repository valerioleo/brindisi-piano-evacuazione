const {test, serial} = require('ava');
const {initDB} = require('../../../test/helpers');
const {
  DEFAULT_USER_ID,
  VALID_ETH_ADDRESS,
  getIndexedUserId,
  createExtendedUser,
  getIndexedEthAddress
} = require('../../../../common-api/test/helpers/account');
const {
  createUserVestingSettings
} = require('../accountRepository');
const {
  createFiatContribution,
  createEthContribution,
  createBtcContribution,
  saveMultipleContributionForUsers
} = require('../../../../common-api/test/helpers/contribution');
const {
  loadTokensToSend,
  readContributorsCount,
  readTokensToMint,
  readTokenSale,
  updateTokenSale,
  createTokenSaleBatch
} = require('../tokenSaleRepository');
const {createToken} = require('../tokenRepository');
const {cleanDb} = require('../testRepository');
const {createTokenData} = require('../../../../common-api/test/helpers/token');
const {ignoreProps} = require('../../../../common/fn');

const token1 = createTokenData('1');
const token2 = createTokenData('2');

test.before(async () => {
  await initDB();
});

test.beforeEach(async () => {
  await createExtendedUser(DEFAULT_USER_ID, VALID_ETH_ADDRESS, VALID_ETH_ADDRESS);
  await createExtendedUser(getIndexedUserId(1), getIndexedEthAddress(1), getIndexedEthAddress(1));
  await createExtendedUser(getIndexedUserId(2), getIndexedEthAddress(2), getIndexedEthAddress(2));
});

test.afterEach.always(async () => {
  await cleanDb();
});

serial('readContributorsCount should return number of users that have registered a token recipient address', async t => {
  const readContributorsCountResult = await readContributorsCount();

  t.is(readContributorsCountResult, 3);
});

serial('readTokensToMint should return total amount of tokens to mint', async t => {
  const fiatTokensForUsers = 3000;

  await saveMultipleContributionForUsers(
    [DEFAULT_USER_ID, getIndexedUserId(1), getIndexedUserId(2)],
    Array.from({length: 3}).map(() => createFiatContribution(fiatTokensForUsers)),
    Array.from({length: 3}).map(() => createBtcContribution(fiatTokensForUsers)),
    Array.from({length: 3}).map(() => createEthContribution(fiatTokensForUsers))
  );
  const readTokensToMintResult = await readTokensToMint();

  const bonusTokens = 9 * fiatTokensForUsers;
  const referralTokens = 9 * fiatTokensForUsers;
  const tokens = 9 * fiatTokensForUsers;

  await readTokensToMintResult.matchWith({
    Just: ({value}) => {
      t.is(value, bonusTokens + referralTokens + tokens);
    }
  });
});

serial('loadTokensToSend should return an object of tokens to send', async t => {
  const fiatTokensForUsers = 3000;

  await saveMultipleContributionForUsers(
    [DEFAULT_USER_ID, getIndexedUserId(1), getIndexedUserId(2)],
    Array.from({length: 3}).map(() => createFiatContribution(fiatTokensForUsers)),
    Array.from({length: 3}).map(() => createBtcContribution(fiatTokensForUsers)),
    Array.from({length: 3}).map(() => createEthContribution(fiatTokensForUsers))
  );
  const loadTokensToSendResult = await loadTokensToSend();

  await loadTokensToSendResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.is(data.length, 3);
      const dataForUser1 = data.find(item => item.recipientAddress === VALID_ETH_ADDRESS);
      const dataForUser2 = data.find(item => item.recipientAddress === getIndexedEthAddress(1));
      const dataForUser3 = data.find(item => item.recipientAddress === getIndexedEthAddress(2));

      t.deepEqual(dataForUser1, {
        recipientAddress: VALID_ETH_ADDRESS,
        tokens: fiatTokensForUsers * 9 // including bonus and referral for each fiat contribution
      });

      t.deepEqual(dataForUser2, {
        recipientAddress: getIndexedEthAddress(1),
        tokens: fiatTokensForUsers * 9
      });

      t.deepEqual(dataForUser3, {
        recipientAddress: getIndexedEthAddress(2),
        tokens: fiatTokensForUsers * 9
      });
    }
  });
});

serial('loadTokensToSend should return an object of tokens to send if several users have property isVested = true', async t => {
  const fiatTokensForUsers = 3000;

  await saveMultipleContributionForUsers(
    [DEFAULT_USER_ID, getIndexedUserId(1), getIndexedUserId(2)],
    Array.from({length: 3}).map(() => createFiatContribution(fiatTokensForUsers)),
    Array.from({length: 3}).map(() => createBtcContribution(fiatTokensForUsers)),
    Array.from({length: 3}).map(() => createEthContribution(fiatTokensForUsers))
  );
  await Promise.all([
    createUserVestingSettings(DEFAULT_USER_ID, true),
    createUserVestingSettings(getIndexedUserId(1), true)
  ]);
  const loadTokensToSendResult = await loadTokensToSend();

  await loadTokensToSendResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.is(data.length, 1);
      const dataForUser = data.find(item => item.recipientAddress === getIndexedEthAddress(2));
      t.deepEqual(dataForUser, {
        recipientAddress: getIndexedEthAddress(2),
        tokens: fiatTokensForUsers * 9
      });
    }
  });
});

serial('loadTokensToSend should return an object of tokens to send if skip = 2', async t => {
  const fiatTokensForUsers = 3000;

  await saveMultipleContributionForUsers(
    [DEFAULT_USER_ID, getIndexedUserId(1), getIndexedUserId(2)],
    Array.from({length: 3}).map(() => createFiatContribution(fiatTokensForUsers)),
    Array.from({length: 3}).map(() => createBtcContribution(fiatTokensForUsers)),
    Array.from({length: 3}).map(() => createEthContribution(fiatTokensForUsers))
  );

  const loadTokensToSendResult = await loadTokensToSend(2);

  await loadTokensToSendResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();
      t.is(data.length, 1);
    }
  });
});

serial('loadTokensToSend should return an object of tokens to send if limit = 1', async t => {
  const fiatTokensForUsers = 3000;

  await saveMultipleContributionForUsers(
    [DEFAULT_USER_ID, getIndexedUserId(1), getIndexedUserId(2)],
    Array.from({length: 3}).map(() => createFiatContribution(fiatTokensForUsers)),
    Array.from({length: 3}).map(() => createBtcContribution(fiatTokensForUsers)),
    Array.from({length: 3}).map(() => createEthContribution(fiatTokensForUsers))
  );

  const loadTokensToSendResult = await loadTokensToSend(0, 1);

  await loadTokensToSendResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.is(data.length, 1);
    }
  });
});

serial('updateTokenSale should update the tokenSale info', async t => {
  await createToken(...Object.values(token1));
  await updateTokenSale(token1.tokenAddress, {price: 2, isOpen: true, fillPositionAutomatically: true});

  const readTokenSaleResult = await readTokenSale(token1.tokenAddress);

  const expectedResult = {
    price: 2,
    isOpen: true,
    fillPositionAutomatically: true
  };
  readTokenSaleResult.matchWith({
    Just: ({value}) => {
      const data = ignoreProps(['id'])(value.toJS());
      t.deepEqual(expectedResult, data);
    }
  });
});

serial('readTokenSale should return the tokenSale info', async t => {
  await createToken(...Object.values(token1));

  const expectedResult = {
    price: 1,
    isOpen: false,
    fillPositionAutomatically: false
  };

  await updateTokenSale(token1.tokenAddress, expectedResult);

  const readTokenSaleResult = await readTokenSale(token1.tokenAddress);

  readTokenSaleResult.matchWith({
    Just: ({value}) => {
      const data = ignoreProps(['id'])(value.toJS());
      t.deepEqual(expectedResult, data);
    }
  });
});

serial('updateTokenSale should update the tokenSale info', async t => {
  await createToken(...Object.values(token1));
  await createToken(...Object.values(token2));
  await createTokenSaleBatch([token1.tokenAddress, token2.tokenAddress]);

  const expectedResult = {
    price: 1,
    isOpen: false,
    fillPositionAutomatically: false
  };

  const readTokenSaleResult = await readTokenSale(token1.tokenAddress);
  readTokenSaleResult.matchWith({
    Just: ({value}) => {
      const data = ignoreProps(['id'])(value.toJS());
      t.deepEqual(expectedResult, data);
    }
  });

  const readToken2SaleResult = await readTokenSale(token2.tokenAddress);
  readToken2SaleResult.matchWith({
    Just: ({value}) => {
      const data = ignoreProps(['id'])(value.toJS());
      t.deepEqual(expectedResult, data);
    }
  });
});
