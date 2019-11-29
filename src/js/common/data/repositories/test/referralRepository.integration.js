const {test, serial} = require('ava');
const Maybe = require('folktale/maybe');
const {initDB} = require('../../../test/helpers');
const {
  readRegisteredReferral,
  registerWithReferral,
  createUserReferral,
  readInitiatorReferral,
  readNumberOfRegisteredFollowers,
  readFollowersWithReferralTokens,
  readFollowerReferralTokens,
  readInitiatorTokens,
  updateInitiatorReferralTokens
} = require('../referralRepository');
const {
  DEFAULT_REFERRAL_CODE,
  createReferralAndRegisteredWithReferral,
  createReferralAndRegisteredWithReferralAndSaveFiat
} = require('../../../../common-api/test/helpers/referral');
const {restoreParams, defaultReferralParams} = require('../../../../common-api/test/helpers/params');
const {maybeValueReturn, toJS} = require('../../../fn');
const {
  createExtendedUser,
  DEFAULT_USER_ID,
  getIndexedUserId,
  getIndexedEthAddress
} = require('../../../../common-api/test/helpers/account');
const {createEthContribution, saveEthContribution} = require('../../../../common-api/test/helpers/contribution');
const {Currencies} = require('../../../../common/data/constants');
const {cleanDb} = require('../testRepository');

test.before(async () => {
  await initDB();
});

test.beforeEach(async () => {
  await createExtendedUser(DEFAULT_USER_ID);
  await createExtendedUser(getIndexedUserId(1), getIndexedEthAddress(1), getIndexedEthAddress(1), 1);
  await createExtendedUser(getIndexedUserId(2), getIndexedEthAddress(2), getIndexedEthAddress(2), 2);
  await createExtendedUser(getIndexedUserId(3), getIndexedEthAddress(3), getIndexedEthAddress(3), 3);
  await createExtendedUser(getIndexedUserId(4), getIndexedEthAddress(4), getIndexedEthAddress(4), 4);
});

test.afterEach.always(async () => {
  await cleanDb();
});

serial('createUserReferral should create referral code and return string', async t => {
  const createUserReferralResult = await createUserReferral(DEFAULT_USER_ID, DEFAULT_REFERRAL_CODE);

  await createUserReferralResult.matchWith({
    Just: ({value}) => {
      t.is(value, DEFAULT_REFERRAL_CODE);
    }
  });
});

serial('createUserReferral should not create referral code and return Nothing if userId not found', async t => {
  const createUserReferralResult = await createUserReferral('test', DEFAULT_REFERRAL_CODE);

  t.true(Maybe.Nothing.hasInstance(createUserReferralResult));
});

serial('registerWithReferral should registered a user and create code and return object with code', async t => {
  await createUserReferral(DEFAULT_USER_ID, DEFAULT_REFERRAL_CODE);
  const registerWithReferralResult = await registerWithReferral(
    DEFAULT_USER_ID,
    DEFAULT_REFERRAL_CODE
  );

  await registerWithReferralResult.matchWith({
    Just: ({value}) => {
      t.is(value.get('code'), DEFAULT_REFERRAL_CODE);
    }
  });
});

serial('registerWithReferral should not registered a user and not create code and return Nothing if the referral program is not created', async t => {
  const registerWithReferralResult = await registerWithReferral(
    DEFAULT_USER_ID,
    DEFAULT_REFERRAL_CODE
  );

  t.true(Maybe.Nothing.hasInstance(registerWithReferralResult));
});

serial('readRegisteredReferral should return object of the register with referral program', async t => {
  await createReferralAndRegisteredWithReferral(
    DEFAULT_USER_ID,
    DEFAULT_REFERRAL_CODE,
    [getIndexedUserId(1)]
  );
  const readRegisteredReferralResult = await readRegisteredReferral(getIndexedUserId(1));

  await readRegisteredReferralResult.matchWith({
    Just: ({value}) => {
      t.is(value.get('code'), DEFAULT_REFERRAL_CODE);
    }
  });
});

serial('readRegisteredReferral should return Nothing if userId not found', async t => {
  await createReferralAndRegisteredWithReferral(
    DEFAULT_USER_ID,
    DEFAULT_REFERRAL_CODE,
    [getIndexedUserId(1)]
  );
  const readRegisteredReferralResult = await readRegisteredReferral('test');

  t.true(Maybe.Nothing.hasInstance(readRegisteredReferralResult));
});

serial('readInitiatorReferral should return referral code string', async t => {
  await createUserReferral(DEFAULT_USER_ID, DEFAULT_REFERRAL_CODE);

  const readInitiatorReferralResult = await readInitiatorReferral(DEFAULT_USER_ID);

  await readInitiatorReferralResult.matchWith({
    Just: ({value}) => {
      t.is(value, DEFAULT_REFERRAL_CODE);
    }
  });
});

serial('readInitiatorReferral should return Nothing if userId not found', async t => {
  await createUserReferral(DEFAULT_USER_ID, DEFAULT_REFERRAL_CODE);

  const readInitiatorReferralResult = await readInitiatorReferral('test');

  t.true(Maybe.Nothing.hasInstance(readInitiatorReferralResult));
});

serial('readNumberOfRegisteredFollowers should return all referral followers', async t => {
  await createReferralAndRegisteredWithReferral(
    DEFAULT_USER_ID,
    DEFAULT_REFERRAL_CODE,
    [getIndexedUserId(1), getIndexedUserId(2)]
  );
  const readNumberOfRegisteredFollowersResult = await readNumberOfRegisteredFollowers(
    DEFAULT_REFERRAL_CODE
  );

  await readNumberOfRegisteredFollowersResult.matchWith({
    Just: ({value}) => {
      t.is(value, 2);
    }
  });
});

serial('readNumberOfRegisteredFollowers should return 0 if referral code not found', async t => {
  await createReferralAndRegisteredWithReferral(
    DEFAULT_USER_ID,
    DEFAULT_REFERRAL_CODE,
    [getIndexedUserId(1), getIndexedUserId(2)]
  );
  const readNumberOfRegisteredFollowersResult = await readNumberOfRegisteredFollowers('test');

  await readNumberOfRegisteredFollowersResult.matchWith({
    Just: ({value}) => {
      t.is(value, 0);
    }
  });
});

serial('readNumberOfRegisteredFollowers should return all referral followers for the given referral code', async t => {
  await createReferralAndRegisteredWithReferral(
    DEFAULT_USER_ID,
    DEFAULT_REFERRAL_CODE,
    [getIndexedUserId(1), getIndexedUserId(2)]
  );
  const readNumberOfRegisteredFollowersResult = await readNumberOfRegisteredFollowers();

  await readNumberOfRegisteredFollowersResult.matchWith({
    Just: ({value}) => {
      t.is(value, 2);
    }
  });
});

serial('readFollowersWithReferralTokens should return the number of followers that have received some referral tokens', async t => {
  await createReferralAndRegisteredWithReferralAndSaveFiat(
    [500, 1000],
    DEFAULT_USER_ID,
    DEFAULT_REFERRAL_CODE,
    [getIndexedUserId(1), getIndexedUserId(2)]
  );
  const readFollowersWithReferralTokensResult = await readFollowersWithReferralTokens(
    DEFAULT_USER_ID
  );

  await readFollowersWithReferralTokensResult.matchWith({
    Just: ({value}) => {
      t.is(value, 2);
    }
  });
});

serial('readFollowersWithReferralTokens should return 0 if the referral code not found', async t => {
  await createReferralAndRegisteredWithReferralAndSaveFiat(
    [500, 1000],
    DEFAULT_USER_ID,
    DEFAULT_REFERRAL_CODE,
    [getIndexedUserId(1), getIndexedUserId(2)]
  );
  const readFollowersWithReferralTokensResult = await readFollowersWithReferralTokens('test');

  await readFollowersWithReferralTokensResult.matchWith({
    Just: ({value}) => {
      t.is(value, 0);
    }
  });
});

serial('readFollowersWithReferralTokens should return the number of followers of the given initiator that have received some referral tokens', async t => {
  await createReferralAndRegisteredWithReferralAndSaveFiat(
    [500, 1000],
    DEFAULT_USER_ID,
    DEFAULT_REFERRAL_CODE,
    [getIndexedUserId(1), getIndexedUserId(2)]
  );
  const readFollowersWithReferralTokensResult = await readFollowersWithReferralTokens();

  await readFollowersWithReferralTokensResult.matchWith({
    Just: ({value}) => {
      t.is(value, 2);
    }
  });
});

serial('readFollowerReferralTokens should return the total referral tokens granted to all followers', async t => {
  await createReferralAndRegisteredWithReferralAndSaveFiat(
    [500, 1000],
    DEFAULT_USER_ID,
    DEFAULT_REFERRAL_CODE,
    [getIndexedUserId(1), getIndexedUserId(2)]
  );
  const readFollowerReferralTokensResult = await readFollowerReferralTokens(getIndexedUserId(1));

  await readFollowerReferralTokensResult.matchWith({
    Just: ({value}) => {
      t.is(value, 500);
    }
  });
});

serial('readFollowerReferralTokens should return 0 if userId not found', async t => {
  await createReferralAndRegisteredWithReferralAndSaveFiat(
    [500, 1000],
    DEFAULT_USER_ID,
    DEFAULT_REFERRAL_CODE,
    [getIndexedUserId(1), getIndexedUserId(2)]
  );
  const readFollowerReferralTokensResult = await readFollowerReferralTokens('test');

  readFollowerReferralTokensResult.matchWith({
    Just: ({value}) => t.is(value, 0),
    Nothing: t.fail.bind(t)
  });
});

serial('readFollowerReferralTokens should return the total referral tokens granted to a particular follower', async t => {
  await createReferralAndRegisteredWithReferralAndSaveFiat(
    [500, 1000],
    DEFAULT_USER_ID,
    DEFAULT_REFERRAL_CODE,
    [getIndexedUserId(1), getIndexedUserId(2)]
  );
  const readFollowerReferralTokensResult = await readFollowerReferralTokens();

  await readFollowerReferralTokensResult.matchWith({
    Just: ({value}) => {
      t.is(value, 1500);
    }
  });
});

serial('updateInitiatorReferralTokens should update referral tokens and return array of object', async t => {
  await restoreParams();
  const [contrib1, contrib2] = await createReferralAndRegisteredWithReferralAndSaveFiat(
    [500, 1000],
    DEFAULT_USER_ID,
    DEFAULT_REFERRAL_CODE,
    [getIndexedUserId(1), getIndexedUserId(2)]
  );

  const updateInitiatorReferralTokensResult = await updateInitiatorReferralTokens('FIAT')([contrib1, contrib2]);

  await updateInitiatorReferralTokensResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();
      t.is(data.length, 2);
      t.is(data[0].tokens, defaultReferralParams.initiatorReward);
      t.is(data[1].tokens, defaultReferralParams.initiatorReward);
    }
  });
});

serial('updateInitiatorReferralTokens should only update the referral tokens for initiator who is associated with the given list of contributions', async t => {
  await restoreParams();
  await createUserReferral(DEFAULT_USER_ID, DEFAULT_REFERRAL_CODE);
  await registerWithReferral(getIndexedUserId(1), DEFAULT_REFERRAL_CODE);
  await registerWithReferral(getIndexedUserId(2), DEFAULT_REFERRAL_CODE);

  // user 3 is registered with the refferal code from user 2
  await createUserReferral(getIndexedUserId(3), 'some_referral_code');
  await registerWithReferral(getIndexedUserId(4), 'some_referral_code');

  // save some eth contributions for user 1
  const contribution1 = createEthContribution(10);
  const contribution2 = createEthContribution(20);
  await saveEthContribution(getIndexedEthAddress(1), contribution1);
  await saveEthContribution(getIndexedEthAddress(2), contribution2);
  await saveEthContribution(getIndexedEthAddress(4), createEthContribution(30));

  // exclude users 2 contribution from the list
  const contributions = [contribution1, contribution2];
  const updateInitiatorReferralTokensResult = await updateInitiatorReferralTokens(Currencies.Ether)(contributions);
  await updateInitiatorReferralTokensResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();
      t.is(data.length, 2);
      t.is(data[0].tokens, defaultReferralParams.initiatorReward);
      t.is(data[1].tokens, defaultReferralParams.initiatorReward);
    }
  });

  const initiatorTokensResult = await readInitiatorTokens(DEFAULT_USER_ID);
  await initiatorTokensResult.matchWith({
    Just: ({value}) => {
      const {totalTokens} = value.toJS();
      t.is(totalTokens, defaultReferralParams.initiatorReward * 2);
    }
  });

  // user 2 should not have any intiator tokens as there was not contributions associated with his referral
  const initiatorTokensResult2 = await readInitiatorTokens(getIndexedUserId(2));
  await initiatorTokensResult2.matchWith({
    Just: ({value}) => {
      const {totalTokens} = value.toJS();
      t.is(totalTokens, 0);
    }
  });
});

serial('readInitiatorTokens should return tokens allocated to all referral initiators', async t => {
  await restoreParams();
  const [contrib1, contrib2] = await createReferralAndRegisteredWithReferralAndSaveFiat(
    [500, 1000],
    DEFAULT_USER_ID,
    DEFAULT_REFERRAL_CODE,
    [getIndexedUserId(1), getIndexedUserId(2)]
  );
  await updateInitiatorReferralTokens('FIAT')([contrib1, contrib2]);

  const readInitiatorTokensResult = await readInitiatorTokens(DEFAULT_USER_ID);

  await readInitiatorTokensResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.is(data.totalTokens, 2 * defaultReferralParams.initiatorReward);
    }
  });
});

serial('readInitiatorTokens should return 0 if userId not found', async t => {
  await restoreParams();
  const [contrib1, contrib2] = await createReferralAndRegisteredWithReferralAndSaveFiat(
    [500, 1000],
    DEFAULT_USER_ID,
    DEFAULT_REFERRAL_CODE,
    [getIndexedUserId(1), getIndexedUserId(2)]
  );
  await updateInitiatorReferralTokens('FIAT')([contrib1, contrib2]);

  const readInitiatorTokensResult = await readInitiatorTokens('test');

  await readInitiatorTokensResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.is(data.totalTokens, 0);
    }
  });
});

serial('readInitiatorTokens should return tokens allocated to the given initiator', async t => {
  await restoreParams();
  const [contrib1, contrib2] = await createReferralAndRegisteredWithReferralAndSaveFiat(
    [500, 1000],
    DEFAULT_USER_ID,
    DEFAULT_REFERRAL_CODE,
    [getIndexedUserId(1), getIndexedUserId(2)]
  );
  await updateInitiatorReferralTokens('FIAT')([contrib1, contrib2]);

  const readInitiatorTokensResult = await readInitiatorTokens();

  await readInitiatorTokensResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.is(data.totalTokens, 2 * defaultReferralParams.initiatorReward);
    }
  });
});
