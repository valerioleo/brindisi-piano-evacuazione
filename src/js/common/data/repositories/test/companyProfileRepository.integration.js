const {test, serial} = require('ava');
const {initDB} = require('../../../test/helpers');
const {ignoreProps} = require('../../../../common/fn');
const {
  createCompanyProfile,
  updateCompanyProfile,
  getCompanyProfile,
  deleteCompanyProfie,
  updateCompanyProfileLogo
} = require('../companyProfileRepository');
const {cleanDb} = require('../testRepository');

test.before(async () => {
  await initDB();
});

test.afterEach.always(async () => {
  await cleanDb();
});

serial('createCompanyProfile Should create company node on db', async t => {
  const name = 'name';
  const address = 'address';
  const logo = 'logo';

  await createCompanyProfile(name, address, logo);

  const result = await getCompanyProfile();

  const expectedResult = {
    name,
    address,
    logo
  };
  result.matchWith({
    Just: ({value}) => {
      const data = ignoreProps(['id', 'timestamp'])(value.toJS());
      t.deepEqual(expectedResult, data);
    }
  });
});

serial('updateCompanyProfile Should update name and address on db', async t => {
  const name = 'name';
  const address = 'address';
  const logo = 'logo';

  await createCompanyProfile(name, address, logo);
  await updateCompanyProfile('UpdatedName', 'UpdatedAddress');

  const result = await getCompanyProfile();

  const expectedResult = {
    name: 'UpdatedName',
    address: 'UpdatedAddress',
    logo
  };
  result.matchWith({
    Just: ({value}) => {
      const data = ignoreProps(['id', 'timestamp'])(value.toJS());
      t.deepEqual(expectedResult, data);
    }
  });
});

serial('updateCompanyProfile Should create company node on db if it does not exist', async t => {
  await updateCompanyProfile('UpdatedName', 'UpdatedAddress');

  const result = await getCompanyProfile();

  const expectedResult = {
    name: 'UpdatedName',
    address: 'UpdatedAddress'
  };
  result.matchWith({
    Just: ({value}) => {
      const data = ignoreProps(['id', 'timestamp'])(value.toJS());
      t.deepEqual(expectedResult, data);
    }
  });
});

serial('deleteCompanyProfile Should delete company node on db', async t => {
  const name = 'name';
  const address = 'address';
  const logo = 'logo';

  await createCompanyProfile(name, address, logo);
  await deleteCompanyProfie();
  const result = await getCompanyProfile();

  result.matchWith({
    Just: t.fail.bind(t),
    Nothing: t.pass.bind(t)
  });
});

serial('updateCompanyProfileLogo Should update the logo on db', async t => {
  const name = 'name';
  const address = 'address';
  const logo = 'logo';

  await createCompanyProfile(name, address, logo);
  await updateCompanyProfileLogo('UpdatedLogo');

  const result = await getCompanyProfile();

  const expectedResult = {
    name,
    address,
    logo: 'UpdatedLogo'
  };
  result.matchWith({
    Just: ({value}) => {
      const data = ignoreProps(['id', 'timestamp'])(value.toJS());
      t.deepEqual(expectedResult, data);
    }
  });
});
