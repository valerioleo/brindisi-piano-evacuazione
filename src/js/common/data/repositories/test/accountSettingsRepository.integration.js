const {test, serial} = require('ava');
const Maybe = require('folktale/maybe');
const {initDB} = require('../../../test/helpers');
const {
  DEFAULT_USER_ID,
  createExtendedUser,
  deleteAccount
} = require('../../../../common-api/test/helpers/account');
const {
  createOtpSettings,
  readAccountSettings,
  updateAccountSettings,
  readAccountOTPSecret
} = require('../accountSettingsRepository');
const {
  createOtpSettingsData
} = require('../../../../common-api/test/helpers/accountSettings');
const {cleanDb} = require('../testRepository');

test.before(async () => {
  await initDB();
});

test.beforeEach(async t => {
  await createExtendedUser(DEFAULT_USER_ID);
});

test.afterEach.always(async () => {
  await cleanDb();
});

serial('createOtpSettings should create otp settings by user and return object', async t => {
  const otpSettingsData = createOtpSettingsData({});
  const createOtpSettingsResult = await createOtpSettings(DEFAULT_USER_ID, otpSettingsData);

  createOtpSettingsResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.deepEqual(data, otpSettingsData);
    }
  });

  const readAccountSettingsResult = await readAccountSettings(DEFAULT_USER_ID);

  await readAccountSettingsResult.matchWith({
    Just: ({value}) => {
      t.is(value.get('otpAuthUrl'), otpSettingsData.otpAuthUrl);
    }
  });
});

serial('createOtpSettings should return Nothing if userId not found', async t => {
  const otpSettingsData = createOtpSettingsData({});
  const createOtpSettingsResult = await createOtpSettings('test', otpSettingsData);

  t.true(Maybe.Nothing.hasInstance(createOtpSettingsResult));

  const readAccountSettingsResult = await readAccountSettings(DEFAULT_USER_ID);

  t.true(Maybe.Nothing.hasInstance(readAccountSettingsResult));
});

serial('readAccountSettings should return an object of account settings', async t => {
  const otpSettingsData = createOtpSettingsData({});
  await createOtpSettings(DEFAULT_USER_ID, otpSettingsData);

  const readAccountSettingsResult = await readAccountSettings(DEFAULT_USER_ID);

  await readAccountSettingsResult.matchWith({
    Just: ({value}) => {
      t.is(value.get('otpAuthUrl'), otpSettingsData.otpAuthUrl);
      t.is(value.get('is2FAEnabled'), null);
    }
  });
});

serial('readAccountSettings should return Nothing if userId not found', async t => {
  const otpSettingsData = createOtpSettingsData({});
  await createOtpSettings(DEFAULT_USER_ID, otpSettingsData);

  const readAccountSettingsResult = await readAccountSettings('test');

  t.true(Maybe.Nothing.hasInstance(readAccountSettingsResult));
});

serial('readAccountSettings should return Nothing if userId not found if account settings are not created', async t => {
  const readAccountSettingsResult = await readAccountSettings(DEFAULT_USER_ID);

  t.true(Maybe.Nothing.hasInstance(readAccountSettingsResult));
});

serial('updateAccountSettings should update property is2FAEnabled and return object', async t => {
  const otpSettingsData = createOtpSettingsData({});
  await createOtpSettings(DEFAULT_USER_ID, otpSettingsData);

  const updateAccountSettingsResult = await updateAccountSettings(
    DEFAULT_USER_ID,
    {is2FAEnabled: true}
  );

  await updateAccountSettingsResult.matchWith({
    Just: ({value}) => {
      t.true(value.get('is2FAEnabled'));
    }
  });

  const readAccountSettingsResult = await readAccountSettings(DEFAULT_USER_ID);

  await readAccountSettingsResult.matchWith({
    Just: ({value}) => {
      t.true(value.get('is2FAEnabled'));
    }
  });
});

serial('updateAccountSettings should return Nothing if userId not found', async t => {
  const otpSettingsData = createOtpSettingsData({});
  await createOtpSettings(DEFAULT_USER_ID, otpSettingsData);

  const updateAccountSettingsResult = await updateAccountSettings(
    'test',
    {is2FAEnabled: true}
  );

  t.true(Maybe.Nothing.hasInstance(updateAccountSettingsResult));

  const readAccountSettingsResult = await readAccountSettings(DEFAULT_USER_ID);

  await readAccountSettingsResult.matchWith({
    Just: ({value}) => {
      t.is(value.get('is2FAEnabled'), null);
    }
  });
});

serial('updateAccountSettings should return Nothing if account settings not created', async t => {
  const updateAccountSettingsResult = await updateAccountSettings(
    DEFAULT_USER_ID,
    {is2FAEnabled: true}
  );

  t.true(Maybe.Nothing.hasInstance(updateAccountSettingsResult));
});

serial('readAccountOTPSecret should return an object of account settings', async t => {
  const otpSettingsData = createOtpSettingsData({});
  await createOtpSettings(DEFAULT_USER_ID, otpSettingsData);

  const readAccountOTPSecretResult = await readAccountOTPSecret(DEFAULT_USER_ID);

  await readAccountOTPSecretResult.matchWith({
    Just: ({value}) => {
      t.is(value.get('otpSecret'), otpSettingsData.otpSecret);
    }
  });
});

serial('readAccountOTPSecret should return Nothing if userId not found', async t => {
  const otpSettingsData = createOtpSettingsData({});
  await createOtpSettings(DEFAULT_USER_ID, otpSettingsData);

  const readAccountOTPSecretResult = await readAccountOTPSecret('test');

  t.true(Maybe.Nothing.hasInstance(readAccountOTPSecretResult));
});

serial('readAccountOTPSecret should return Nothing if account setting not created', async t => {
  const readAccountOTPSecretResult = await readAccountOTPSecret(DEFAULT_USER_ID);

  readAccountOTPSecretResult.matchWith({
    Just: () => t.fail(),
    Nothing: () => t.pass()
  });
});
