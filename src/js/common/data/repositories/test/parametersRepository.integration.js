const {test, serial} = require('ava');
const {initDB} = require('../../../test/helpers');
const {
  getStages,
  updateStages,
  createParameters,
  deleteParameters,
  readPublicParameters,
  updateReferalSettings,
  updateReferralAndBountyStatus,
  readParameters,

  createBankDetails,
  readBankDetails,
  deleteBankDetails
} = require('../parametersRepository');
const {
  restoreParams,
  createParams,
  defaultReferralParams,
  defaultParams,
  defaultStages,
  manyStages,
  newStages,
  newParams,
  newReferralParams
} = require('../../../../common-api/test/helpers/params');
const {maybeValueReturn, toJS} = require('../../../fn');
const {cleanDb} = require('../testRepository');

test.before(async () => {
  await initDB();
});

test.beforeEach(async () => {
  await restoreParams();
});

test.afterEach.always(async () => {
  await cleanDb();
});

serial('updateStages should update stage', async t => {
  await updateStages(newStages);

  const result = await getStages();

  await result.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.true(Array.isArray(data));
      t.is(data.length, 1);
      t.is(data[0].lowLimit, newStages[0].lowLimit);
      t.is(data[0].endDate, newStages[0].endDate);
      t.is(data[0].bonus, newStages[0].bonus);
      t.is(data[0].price, newStages[0].price);
      t.is(data[0].label, newStages[0].label);
      t.is(data[0].highLimit, newStages[0].highLimit);
      t.is(data[0].startDate, newStages[0].startDate);
    }
  });
});

serial('getStages should return an array of objects', async t => {
  const result = await getStages();

  await result.matchWith({
    Just: ({value}) => {
      const stages = value.toJS();

      t.true(Array.isArray(stages));
      t.is(stages.length, 1);
      t.is(stages[0].lowLimit, defaultStages[0].lowLimit);
      t.is(stages[0].endDate, defaultStages[0].endDate);
      t.is(stages[0].bonus, defaultStages[0].bonus);
      t.is(stages[0].price, defaultStages[0].price);
      t.is(stages[0].label, defaultStages[0].label);
      t.is(stages[0].highLimit, defaultStages[0].highLimit);
      t.is(stages[0].startDate, defaultStages[0].startDate);
    }
  });
});

serial('getStages should return an array of objects order by startDate and lowLimit', async t => {
  await updateStages(manyStages);

  const result = await getStages();

  await result.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.true(Array.isArray(data));
      t.is(data.length, 3);
      t.is(data[0].label, manyStages[2].label);
      t.is(data[2].label, manyStages[0].label);
      t.true(data[0].lowLimit < data[2].lowLimit);
      t.true(data[0].startDate < data[2].startDate);
    }
  });
});

serial('createParameters should create params and return array of objects', async t => {
  const result = await createParameters({...newParams, ...newReferralParams});

  await result.matchWith({
    Just: ({value}) => {
      const parameter = value.toJS();

      t.is(parameter.closingDate, newParams.closingDate);
      t.is(parameter.openingDate, newParams.openingDate);
      t.is(parameter.hardCap, newParams.hardCap);
      t.is(parameter.softCap, newParams.softCap);
      t.is(parameter.ticker, newParams.ticker);
      t.is(parameter.isBountyEnabled, newParams.isBountyEnabled);
      t.is(parameter.isReferralEnabled, newParams.isReferralEnabled);
      t.is(parameter.coinName, newParams.coinName);
      t.is(parameter.followerReward, newReferralParams.followerReward);
      t.is(parameter.referralAllocation, newReferralParams.referralAllocation);
      t.is(parameter.initiatorReward, newReferralParams.initiatorReward);
    }
  });
});

serial('deleteParameters should delete stages and getStages return empty array', async t => {
  await updateStages(defaultStages);
  await deleteParameters();
  const result = await getStages();

  const stages = result.matchWith({
    Just: maybeValueReturn(toJS),
    Nothing: t.fail.bind(t)
  });
  t.deepEqual(stages, []);
});

serial('deleteParameters should delete params and readParameters return nothing', async t => {
  await createParams(defaultParams);
  const resultParams = await readParameters();

  await resultParams.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.not(data, null);
      t.false(Array.isArray(data));
      t.true(Object.keys(data).length > 0);
    }
  });

  await deleteParameters();
  const result = await readParameters();

  await result.matchWith({
    Nothing: () => {
      t.true(true);
    }
  });
});

serial('deleteParameters should delete referral params and readParameters return nothing', async t => {
  await createParams(defaultReferralParams);
  const resultReferralParams = await readParameters();

  await resultReferralParams.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.not(data, null);
      t.false(Array.isArray(data));
      t.true(Object.keys(data).length > 0);
    }
  });

  await deleteParameters();
  const result = await readParameters();

  await result.matchWith({
    Nothing: () => {
      t.true(true);
    }
  });
});

serial('readPublicParameters should return the public parameter object', async t => {
  await createParams({...defaultParams, ...defaultReferralParams});
  await updateStages(defaultStages);
  const result = await readPublicParameters();

  await result.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.not(data, null);
      t.false(Array.isArray(data));
      t.is(typeof data, 'object');
      t.is(Object.keys(data).length, 12);
      t.is(data.closingDate, defaultParams.closingDate);
      t.is(data.openingDate, defaultParams.openingDate);
      t.is(data.hardCap, defaultParams.hardCap);
      t.is(data.softCap, defaultParams.softCap);
      t.is(data.ticker, defaultParams.ticker);
      t.is(data.isBountyEnabled, defaultParams.isBountyEnabled);
      t.is(data.followerReward, defaultReferralParams.followerReward);
      t.true(Array.isArray(data.countryRestriction));
      t.is(data.isReferralEnabled, defaultParams.isReferralEnabled);
      t.is(data.coinName, defaultParams.coinName);
      t.is(data.referralAllocation, defaultReferralParams.referralAllocation);
      t.is(data.initiatorReward, defaultReferralParams.initiatorReward);
    }
  });
});

serial('updateReferalSettings should update referral params and return object', async t => {
  await createParams(defaultReferralParams);

  const result = await updateReferalSettings(newReferralParams);

  await result.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.not(data, null);
      t.false(Array.isArray(data));
      t.is(typeof data, 'object');
      t.is(data.followerReward, newReferralParams.followerReward);
      t.is(data.referralAllocation, newReferralParams.referralAllocation);
      t.is(data.initiatorReward, newReferralParams.initiatorReward);
    }
  });
});

serial('updateReferralAndBountyStatus should update field isReferralEnabled and isBountyEnabled after return object', async t => {
  await createParams(defaultParams);

  const isReferralEnabled = false;
  const isBountyEnabled = false;

  const result = await updateReferralAndBountyStatus(isReferralEnabled, isBountyEnabled);

  await result.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.not(data, null);
      t.false(Array.isArray(data));
      t.is(typeof data, 'object');
      t.is(data.isReferralEnabled, isReferralEnabled);
      t.is(data.isBountyEnabled, isBountyEnabled);
    }
  });
});

serial('readParameters should return the object param', async t => {
  await createParams(defaultParams);
  await createParams(defaultReferralParams);
  await updateStages(defaultStages);

  const result = await readParameters();

  await result.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.not(data, null);
      t.false(Array.isArray(data));
      t.is(typeof data, 'object');
      t.is(Object.keys(data).length, 12);
      t.is(data.closingDate, defaultParams.closingDate);
      t.is(data.openingDate, defaultParams.openingDate);
      t.is(data.hardCap, defaultParams.hardCap);
      t.is(data.softCap, defaultParams.softCap);
      t.is(data.ticker, defaultParams.ticker);
      t.is(data.isBountyEnabled, defaultParams.isBountyEnabled);
      t.is(data.followerReward, defaultReferralParams.followerReward);
      t.true(Array.isArray(data.countryRestriction));
      t.is(data.isReferralEnabled, defaultParams.isReferralEnabled);
      t.is(data.coinName, defaultParams.coinName);
      t.is(data.referralAllocation, defaultReferralParams.referralAllocation);
      t.is(data.initiatorReward, defaultReferralParams.initiatorReward);
    }
  });
});

serial('createBankDetails should create bank details and return them', async t => {
  const bankDetails = {
    bankName: 'bankName',
    iban: '12345678'
  };

  const createBankDetailsResult = await createBankDetails(bankDetails);

  createBankDetailsResult.matchWith({
    Just: ({value}) => {
      t.is(value.getIn([0, 'bankName']), 'bankName');
      t.is(value.getIn([0, 'iban']), '12345678');
    },
    Nothing: () => t.fail('Bank details not created correctly')
  });
});

serial('readBankDetails details should return the bank details', async t => {
  const bankDetails = {
    bankName: 'bankName',
    iban: '12345678'
  };

  await createBankDetails(bankDetails);

  const readBankDetailsResult = await readBankDetails();

  readBankDetailsResult.matchWith({
    Just: ({value}) => {
      t.is(value.get('bankName'), 'bankName');
      t.is(value.get('iban'), '12345678');
    },
    Nothing: () => t.fail('Error reading bank details')
  });
});

serial('readBankDetails details should return Maybe.Nothing() if bank details do not exist', async t => {
  const readBankDetailsResult = await readBankDetails();

  readBankDetailsResult.matchWith({
    Just: () => t.fail('Bank details should not exist'),
    Nothing: () => t.pass()
  });
});

serial('deleteBankDetails should delete the bank details', async t => {
  const bankDetails = {
    bankName: 'bankName',
    iban: '12345678'
  };

  await createBankDetails(bankDetails);

  await deleteBankDetails();

  const readBankDetailsResult = await readBankDetails();

  readBankDetailsResult.matchWith({
    Just: () => t.fail('Bank details should not exist'),
    Nothing: () => t.pass()
  });
});
