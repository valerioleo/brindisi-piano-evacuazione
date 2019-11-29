const {test} = require('ava');
const {
  validateCreateClaim,
  validateCreateClaimsRegistry,
  validateReadClaims,
  validateCreateRegistryAccount
} = require('../claimValidations');

test('validateCreateClaimsRegistry should validate the claimRegistryObject schema correctly', t => {
  let error;

  error = t.throws(() => validateCreateClaimsRegistry({address: 1}));
  t.is(error.details[0].message, '"address" must be a string');

  error = t.throws(() => validateCreateClaimsRegistry({address: '0x1'}));
  t.is(error.details[0].message, '0x1 is not a valid Ethereum address');
});

test('validateCreateClaim should validate the claimObject schema correctly', t => {
  let error;

  error = t.throws(() => validateCreateClaim({
    value: 42,
    key: '42',
    accountId: 'accountId'
  }));
  t.is(error.details[0].message, '"value" must be a string');

  error = t.throws(() => validateCreateClaim({
    value: undefined,
    key: '42',
    accountId: 'accountId'
  }));
  t.is(error.details[0].message, '"value" is required');

  error = t.throws(() => validateCreateClaim({
    value: 'value',
    key: 42,
    accountId: 'accountId'
  }));
  t.is(error.details[0].message, '"key" must be a string');

  error = t.throws(() => validateCreateClaim({
    value: 'value',
    key: undefined,
    accountId: 'accountId'
  }));
  t.is(error.details[0].message, '"key" is required');

  error = t.throws(() => validateCreateClaim({
    value: '42',
    key: '42',
    accountId: 42
  }));
  t.is(error.details[0].message, '"accountId" must be a string');

  error = t.throws(() => validateCreateClaim({
    value: '42',
    key: '42',
    accountId: undefined
  }));
  t.is(error.details[0].message, '"accountId" is required');
});

test('validateReadClaims should validate the claimObject schema correctly', t => {
  let error;

  error = t.throws(() => validateReadClaims({value: 42}));
  t.is(error.details[0].message, '"value" must be a string');

  error = t.throws(() => validateReadClaims({key: 42}));
  t.is(error.details[0].message, '"key" must be a string');

  error = t.throws(() => validateReadClaims({accountId: 123}));
  t.is(error.details[0].message, '"accountId" must be a string');

  error = t.throws(() => validateReadClaims({holderAddress: '0x1'}));
  t.is(error.details[0].message, '0x1 is not a valid Ethereum address');
});

test('validateCreateRegistryAccount should validate the claimObject schema correctly', t => {
  let error;

  error = t.throws(() => validateCreateRegistryAccount({}));
  t.is(error.details[0].message, '"accountId" is required');

  error = t.throws(() => validateCreateRegistryAccount({accountId: 123}));
  t.is(error.details[0].message, '"accountId" must be a string');

  error = t.throws(() => validateCreateRegistryAccount({accountId: '123'}));
  t.is(error.details[0].message, '"holderAddress" is required');

  error = t.throws(() => validateCreateRegistryAccount({accountId: '123', holderAddress: '0x1'}));
  t.is(error.details[0].message, '0x1 is not a valid Ethereum address');
});

