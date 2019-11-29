const {test, serial} = require('ava');
const {initDB} = require('../../../test/helpers');
const {
  createBankDetails,
  readBankDetails,
  deleteBankDetails
} = require('../parametersRepository');

test.before(async () => {
  await initDB();
});

test.afterEach(async () => {
  await deleteBankDetails();
});


serial('createBankDetails should create bank details and return array of objects', async t => {
  const testBankDetails = {
    Country: 'Test',
    Curency: 'test',
    AccountHolderName: '',
    AccountNumber: '',
    IBAN: 'IBANTEST',
    BankName: '',
    BankAddress: 'test',
    SortCode: '',
    RoutingNumber: '',
    SWIFTBICcode: '',
    IFSCCode: '',
    RoutingCode: ''
  };


  const result = await createBankDetails(testBankDetails);
  await result.matchWith({
    Just: ({value}) => {
      const data = value.toJS();
      t.true(Array.isArray(data));
      t.is(data.length, 1);
      t.is(data[0].Country, testBankDetails.Country);
      t.is(data[0].Curency, testBankDetails.Curency);
      t.is(data[0].AccountHolderName, testBankDetails.AccountHolderName);
      t.is(data[0].AccountNumber, testBankDetails.AccountNumber);
      t.is(data[0].IBAN, testBankDetails.IBAN);
      t.is(data[0].BankName, testBankDetails.BankName);
      t.is(data[0].BankAddress, testBankDetails.BankAddress);
      t.is(data[0].SortCode, testBankDetails.SortCode);
      t.is(data[0].RoutingNumber, testBankDetails.RoutingNumber);
      t.is(data[0].SWIFTBICcode, testBankDetails.SWIFTBICcode);
      t.is(data[0].IFSCCode, testBankDetails.IFSCCode);
      t.is(data[0].RoutingCode, testBankDetails.RoutingCode);
    }
  });
});

serial('readParameters should return the object param', async t => {
  const testBankDetails = {
    Country: 'Test',
    Curency: 'test',
    AccountHolderName: '',
    AccountNumber: '',
    IBAN: 'IBANTEST',
    BankName: '',
    BankAddress: 'test',
    SortCode: '',
    RoutingNumber: '',
    SWIFTBICcode: '',
    IFSCCode: '',
    RoutingCode: ''
  };


  await createBankDetails(testBankDetails);

  const result = await readBankDetails();

  await result.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.not(data, null);
      t.false(Array.isArray(data));
      t.is(typeof data, 'object');
      t.is(Object.keys(data).length, 12);
      t.is(data.Country, testBankDetails.Country);
      t.is(data.Curency, testBankDetails.Curency);
      t.is(data.AccountHolderName, testBankDetails.AccountHolderName);
      t.is(data.AccountNumber, testBankDetails.AccountNumber);
      t.is(data.IBAN, testBankDetails.IBAN);
      t.is(data.BankName, testBankDetails.BankName);
      t.is(data.BankAddress, testBankDetails.BankAddress);
      t.is(data.SortCode, testBankDetails.SortCode);
      t.is(data.RoutingNumber, testBankDetails.RoutingNumber);
      t.is(data.SWIFTBICcode, testBankDetails.SWIFTBICcode);
      t.is(data.IFSCCode, testBankDetails.IFSCCode);
      t.is(data.RoutingCode, testBankDetails.RoutingCode);
    }
  });
});

serial('deleteBankDetails should delete bankDetails and return nothing', async t => {
  const testBankDetails = {
    Country: 'Test',
    Curency: 'test',
    AccountHolderName: '',
    AccountNumber: '',
    IBAN: 'IBANTEST',
    BankName: '',
    BankAddress: 'test',
    SortCode: '',
    RoutingNumber: '',
    SWIFTBICcode: '',
    IFSCCode: '',
    RoutingCode: ''
  };


  await createBankDetails(testBankDetails);
  await deleteBankDetails();
  const result = await readBankDetails();

  await result.matchWith({
    Nothing: () => {
      t.true(true);
    }
  });
});
