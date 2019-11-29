const {test, serial} = require('ava');
const {initDB} = require('../../../test/helpers');
const {
  createUserProvidedKycData,
  readUserProvidedKycData,
  readInitiatedKycApplications,
  saveInitiatedKycApplication,
  saveCompletedKycApplication,
  saveFailedKycApplication,
  kycProfileExists,
  amlResultExists,
  saveKycProfile,
  saveAmlResult,
  saveCountryOfResidence,
  readKycAmlData
} = require('../kycRepository');
const {getAccount} = require('../accountRepository');
const {
  defaultYotiKycData,
  defaultAmlData,
  defaultOnfidoKycData,
  defaultOnfidoApplicantData
} = require('../../../../common-api/test/helpers/kyc');
const {
  createExtendedUser,
  deleteAccount,
  DEFAULT_USER_ID
} = require('../../../../common-api/test/helpers/account');
const {cleanDb} = require('../testRepository');

test.before(async () => {
  await initDB();
});

test.beforeEach(async () => {
  await createExtendedUser(DEFAULT_USER_ID, undefined, undefined, 1, false);
});

test.afterEach.always(async () => {
  await cleanDb();
});

serial('createUserProvidedKycData should create a new node with the user provided data', async t => {
  await createUserProvidedKycData(DEFAULT_USER_ID, defaultOnfidoApplicantData);

  const kycData = await readUserProvidedKycData(DEFAULT_USER_ID);

  await kycData.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.is(data.postalAddress, defaultOnfidoApplicantData.postal_address);
      t.is(data.givenNames, defaultOnfidoApplicantData.first_name);
      t.is(data.familyName, defaultOnfidoApplicantData.last_name);
      t.is(data.countryOfResidence, defaultOnfidoApplicantData.country);
      t.is(data.nationality, defaultOnfidoApplicantData.nationality);
      t.is(data.countryOfResidence, defaultOnfidoApplicantData.country);
    }
  });
});

serial('createUserProvidedKycData should update an existing KYC node with user provided data', async t => {
  await createUserProvidedKycData(DEFAULT_USER_ID, defaultOnfidoApplicantData);
  await createUserProvidedKycData(DEFAULT_USER_ID, {...defaultOnfidoApplicantData, first_name: 'Nick'});

  const kycData = await readUserProvidedKycData(DEFAULT_USER_ID);

  await kycData.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.is(data.postalAddress, defaultOnfidoApplicantData.postal_address);
      t.is(data.givenNames, 'Nick');
      t.is(data.familyName, defaultOnfidoApplicantData.last_name);
      t.is(data.countryOfResidence, defaultOnfidoApplicantData.country);
      t.is(data.nationality, defaultOnfidoApplicantData.nationality);
      t.is(data.countryOfResidence, defaultOnfidoApplicantData.country);
    }
  });
});

serial('readInitiatedKycApplications should return an object of kyc application data', async t => {
  await createUserProvidedKycData(DEFAULT_USER_ID, defaultOnfidoApplicantData);
  await saveInitiatedKycApplication(DEFAULT_USER_ID, defaultOnfidoKycData);
  const readInitiatedKycApplicationsResult = await readInitiatedKycApplications(DEFAULT_USER_ID);

  await readInitiatedKycApplicationsResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.not(data, null);
      t.false(Array.isArray(data));
      t.is(typeof data, 'object');
      t.is(data.postalAddress, defaultOnfidoKycData.postalAddress);
      t.is(data.givenNames, defaultOnfidoKycData.givenNames);
      t.is(data.familyName, defaultOnfidoKycData.familyName);
      t.is(data.vendorName, defaultOnfidoKycData.vendorName);
      t.is(data.countryOfResidence, defaultOnfidoKycData.countryOfResidence);
      t.is(data.fullName, defaultOnfidoKycData.fullName);
      t.is(data.id, defaultOnfidoKycData.id);
      t.is(data.nationality, defaultOnfidoKycData.nationality);
      t.is(data.hasFailedKyc, null);
    }
  });
});

serial('saveInitiatedKycApplication should create kyc application data', async t => {
  await createUserProvidedKycData(DEFAULT_USER_ID, defaultOnfidoApplicantData);
  await saveInitiatedKycApplication(DEFAULT_USER_ID, defaultOnfidoKycData);

  const readInitiatedKycApplicationsResult = await readInitiatedKycApplications(DEFAULT_USER_ID);

  await readInitiatedKycApplicationsResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.not(data, null);
      t.false(Array.isArray(data));
      t.is(typeof data, 'object');
      t.is(data.postalAddress, defaultOnfidoKycData.postalAddress);
      t.is(data.givenNames, defaultOnfidoKycData.givenNames);
      t.is(data.familyName, defaultOnfidoKycData.familyName);
      t.is(data.vendorName, defaultOnfidoKycData.vendorName);
      t.is(data.countryOfResidence, defaultOnfidoKycData.countryOfResidence);
      t.is(data.fullName, defaultOnfidoKycData.fullName);
      t.is(data.id, defaultOnfidoKycData.id);
      t.is(data.nationality, defaultOnfidoKycData.nationality);
      t.is(data.hasFailedKyc, null);
    }
  });
});

serial('saveCompletedKycApplication should create successfully full kyc application', async t => {
  await createUserProvidedKycData(DEFAULT_USER_ID, defaultOnfidoApplicantData);
  await saveInitiatedKycApplication(DEFAULT_USER_ID, defaultOnfidoKycData);
  await saveCompletedKycApplication(DEFAULT_USER_ID);

  const kycProfileExistsResult = await kycProfileExists(DEFAULT_USER_ID);

  await kycProfileExistsResult.matchWith({
    Just: ({value}) => {
      t.true(value);
    }
  });
});

serial('saveFailedKycApplication should set the property hasFailedKyc to true', async t => {
  await createUserProvidedKycData(DEFAULT_USER_ID, defaultOnfidoApplicantData);
  await saveInitiatedKycApplication(DEFAULT_USER_ID, defaultOnfidoKycData);
  await saveFailedKycApplication(DEFAULT_USER_ID);

  const readInitiatedKycApplicationsResult = await readInitiatedKycApplications(DEFAULT_USER_ID);

  await readInitiatedKycApplicationsResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.not(data, null);
      t.false(Array.isArray(data));
      t.is(typeof data, 'object');
      t.true(data.hasFailedKyc);
    }
  });
});

serial('kycProfileExists should return true if create successfully full kyc application', async t => {
  await createUserProvidedKycData(DEFAULT_USER_ID, defaultOnfidoApplicantData);
  await saveInitiatedKycApplication(DEFAULT_USER_ID, defaultOnfidoKycData);
  await saveCompletedKycApplication(DEFAULT_USER_ID);

  const kycProfileExistsResult = await kycProfileExists(DEFAULT_USER_ID);

  await kycProfileExistsResult.matchWith({
    Just: ({value}) => {
      t.true(value);
    }
  });
});

serial('saveAmlResult should create aml and return object', async t => {
  const saveAmlResultResult = await saveAmlResult(DEFAULT_USER_ID, defaultAmlData);

  await saveAmlResultResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.true(Object.keys(data).length > 0);
      t.deepEqual(data.aml, defaultAmlData);
    }
  });
});

serial('amlResultExists should return true if create aml', async t => {
  const saveAmlResultResult = await saveAmlResult(DEFAULT_USER_ID, defaultAmlData);

  await saveAmlResultResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.true(Object.keys(data).length > 0);
      t.deepEqual(data.aml, defaultAmlData);
    }
  });

  const amlResultExistsResult = await amlResultExists(DEFAULT_USER_ID);

  await amlResultExistsResult.matchWith({
    Just: ({value}) => {
      t.true(value);
    }
  });
});

serial('saveKycProfile should create kyc profile data and return object', async t => {
  const YotiKycData = defaultYotiKycData(1);
  const saveKycProfileResult = await saveKycProfile(
    DEFAULT_USER_ID,
    YotiKycData,
    YotiKycData.receiptId,
    YotiKycData.vendorName
  );

  await saveKycProfileResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();
      
      t.true(Object.keys(data).length > 0);
      t.deepEqual(data.kyc, YotiKycData);
    }
  });
});

serial('saveCountryOfResidence should set the property countryOfResidence for user', async t => {
  const countryTest = 'test';
  await saveCountryOfResidence(DEFAULT_USER_ID, countryTest);

  const getAccountResult = await getAccount(DEFAULT_USER_ID);

  await getAccountResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.is(data.countryOfResidence, countryTest);
    }
  });
});

serial('readKycAmlData should return object with aml and kyc data', async t => {
  await createUserProvidedKycData(DEFAULT_USER_ID, defaultOnfidoApplicantData);
  await saveInitiatedKycApplication(DEFAULT_USER_ID, defaultOnfidoKycData);
  await saveCompletedKycApplication(DEFAULT_USER_ID, 'onfidoCheckReceipt');
  await saveAmlResult(DEFAULT_USER_ID, defaultAmlData);

  const readKycAmlDataResult = await readKycAmlData(DEFAULT_USER_ID);

  await readKycAmlDataResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.not(data, null);
      t.false(Array.isArray(data));
      t.is(typeof data, 'object');
      t.deepEqual(data.aml, defaultAmlData);
      t.deepEqual(data.kyc, {...defaultOnfidoKycData, receiptId: 'onfidoCheckReceipt'});
      t.is(data.userId, DEFAULT_USER_ID);
    }
  });
});
