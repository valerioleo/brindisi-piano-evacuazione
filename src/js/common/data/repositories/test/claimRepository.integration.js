const matchesProperty = require('lodash.matchesproperty');
const {test, serial} = require('ava');
const {initDB} = require('../../../test/helpers');
const {ignoreProps, noop} = require('../../../../common/fn');
const {shallowCompareArrays} = require('../../../../common/helpers/arrayUtils');
const {cleanDb} = require('../testRepository');
const {getIndexedEthAddress} = require('../../../../common-api/test/helpers/account');
const {
  createClaimsRegistryAccountAndClaims,
  createClaimsRegistryAccount: createClaimsRegistryAccountHelper
} = require('../../../../common-api/test/helpers/claim');
const {
  createClaimsRegistry,
  readClaimsRegistry,
  readClaimsRegistryAccounts,
  createClaim,
  readClaims
} = require('../claimRepository');

const address = getIndexedEthAddress(1);

test.before(async () => {
  await initDB();
});

test.afterEach.always(async () => {
  await cleanDb();
});

serial('createClaimsRegistry should create a ClaimsRegistry node', async t => {
  let readClaimsRegistryResult;

  readClaimsRegistryResult = await readClaimsRegistry();
  readClaimsRegistryResult.matchWith({
    Just: () => t.fail(),
    Nothing: noop
  });

  await createClaimsRegistry({address});

  readClaimsRegistryResult = await readClaimsRegistry();
  readClaimsRegistryResult.matchWith({
    Just: ({value}) => {
      t.deepEqual({address}, value.toJS());
    }
  });
});

serial('readClaimsRegistry should return the ClaimsRegistry node', async t => {
  await createClaimsRegistry({address});

  const readClaimsRegistryResult = await readClaimsRegistry();
  readClaimsRegistryResult.matchWith({
    Just: ({value}) => {
      t.deepEqual({address}, value.toJS());
    }
  });
});

serial('createClaimsRegistryAccount should correctly create a ClaimsRegistry Account', async t => {
  const claimsRegistryAddress = address;
  await createClaimsRegistry({address: claimsRegistryAddress});

  const [
    createClaimsRegistryAccountResult,
    usedAccountData
  ] = await createClaimsRegistryAccountHelper(1);
  createClaimsRegistryAccountResult.matchWith({
    Just: ({value}) => {
      t.deepEqual({
        holderAddresses: [usedAccountData.holderAddress],
        accountId: usedAccountData.accountId,
        claimsRegistryAddress
      }, value.toJS());
    },
    Nothing: () => t.fail()
  });

  const readClaimsRegistryAccountsResult = await readClaimsRegistryAccounts();
  readClaimsRegistryAccountsResult.matchWith({
    Just: ({value}) => {
      t.deepEqual([{
        holderAddresses: [usedAccountData.holderAddress],
        accountId: usedAccountData.accountId,
        claimsRegistryAddress
      }], value.toJS());
    }
  });
});

serial('createClaimsRegistryAccount should not overwrite existing Accounts', async t => {
  const claimsRegistryAddress = address;
  await createClaimsRegistry({address: claimsRegistryAddress});

  await createClaimsRegistryAccountHelper(1);
  await createClaimsRegistryAccountHelper(1);
  await createClaimsRegistryAccountHelper(1);

  const readClaimsRegistryAccountsResult = await readClaimsRegistryAccounts();
  readClaimsRegistryAccountsResult.matchWith({
    Just: ({value}) => {
      t.is(1, value.size);
    }
  });
});

serial('createClaimsRegistryAccount should handle multiple holder address per accountId', async t => {
  const claimsRegistryAddress = address;
  await createClaimsRegistry({address: claimsRegistryAddress});

  const [createResult1, account1] = await createClaimsRegistryAccountHelper(1);
  const custom = {holderAddress: getIndexedEthAddress(2)};
  const [createResult2, account2] = await createClaimsRegistryAccountHelper(1, custom);

  createResult1.matchWith({
    Just: ({value}) => {
      t.deepEqual({
        holderAddresses: [account1.holderAddress],
        accountId: account1.accountId,
        claimsRegistryAddress
      }, value.toJS());
    },
    Nothing: () => t.fail()
  });

  createResult2.matchWith({
    Just: ({value}) => {
      const {holderAddresses, ...rest} = value.toJS();

      t.true(shallowCompareArrays(
        holderAddresses,
        [account1.holderAddress, account2.holderAddress]
      ));
      t.deepEqual({
        accountId: account1.accountId,
        claimsRegistryAddress
      }, rest);
    },
    Nothing: () => t.fail()
  });

  const readClaimsRegistryAccountsResult = await readClaimsRegistryAccounts();
  readClaimsRegistryAccountsResult.matchWith({
    Just: ({value}) => {
      const {holderAddresses, ...rest} = value.get(0).toJS();

      t.is(1, value.size);
      t.deepEqual({accountId: account1.accountId, claimsRegistryAddress}, rest);
      t.true(shallowCompareArrays(
        holderAddresses,
        [account2.holderAddress, account1.holderAddress]
      ));
    }
  });
});

serial('createClaim should correctly create a Claim', async t => {
  const claimsRegistryAddress = address;
  await createClaimsRegistry({address: claimsRegistryAddress});

  const [_, {accountId}] = await createClaimsRegistryAccountHelper(1);

  const claimObject = {
    value: 'value',
    key: 'key',
    accountId,
    issuer: getIndexedEthAddress(4),
    validTo: Date.now()
  };

  const createClaimResult = await createClaim(claimObject);
  createClaimResult.matchWith({
    Just: ({value}) => {
      t.deepEqual({
        ...ignoreProps(['accountId'])(claimObject),
        claimsRegistryAccountId: accountId,
        claimsRegistryAddress: address,
        provider: '',
        providerProof: ''
      }, value.toJS());
    }
  });
});

serial('createClaim should not create for non existing ClaimsRegistry', async t => {
  const [_, {accountId}] = await createClaimsRegistryAccountHelper(1);

  const claimObject = {
    value: 'value',
    key: 'key',
    accountId,
    issuer: getIndexedEthAddress(4),
    validTo: Date.now()
  };

  const createClaimResult = await createClaim(claimObject);
  createClaimResult.matchWith({
    Just: () => t.fail(),
    Nothing: () => t.pass()
  });
});

serial('createClaim should not create for non existing accountIds', async t => {
  const claimsRegistryAddress = address;
  await createClaimsRegistry({address: claimsRegistryAddress});

  const claimObject = {
    value: 'value',
    key: 'key',
    accountId: 'non_existing',
    issuer: getIndexedEthAddress(4),
    validTo: Date.now()
  };

  const createClaimResult = await createClaim(claimObject);
  createClaimResult.matchWith({
    Just: () => t.fail(),
    Nothing: () => t.pass()
  });
});

serial('readClaims should return a list of Claims', async t => {
  await createClaimsRegistry({address});

  const [_, {
    accountId,
    holderAddress,
    key,
    value,
    issuer,
    validTo
  }] = await createClaimsRegistryAccountAndClaims(1);

  const readClaimsResult = await readClaims();
  readClaimsResult.matchWith({
    Just: ({value: claim}) => {
      t.deepEqual([{
        holderAddresses: [holderAddress],
        claimsRegistryAccountId: accountId,
        claimsRegistryAddress: address,
        key,
        value,
        issuer,
        validTo,
        provider: '',
        providerProof: ''
      }], claim.toJS());
      t.is(claim.size, 1);
    }
  });
});

serial('readClaims should return a list of Claims with a correct array of holder addresses', async t => {
  await createClaimsRegistry({address});

  const [_, {
    accountId,
    holderAddress,
    key,
    value,
    issuer,
    validTo
  }] = await createClaimsRegistryAccountAndClaims(1);
  await createClaimsRegistryAccountAndClaims(1, {holderAddress: getIndexedEthAddress(2)});

  const readClaimsResult = await readClaims();
  readClaimsResult.matchWith({
    Just: ({value: claims}) => {
      const {holderAddresses, ...rest} = claims.get(0).toJS();
      t.is(claims.size, 1);
      t.deepEqual(holderAddresses, [getIndexedEthAddress(2), holderAddress]);
      t.deepEqual({
        claimsRegistryAccountId: accountId,
        claimsRegistryAddress: address,
        key,
        value,
        issuer,
        validTo,
        provider: '',
        providerProof: ''
      }, rest);
    }
  });
});

serial('readClaims should return a list of Claims', async t => {
  await createClaimsRegistry({address});

  const [_, {
    accountId: accountId1,
    holderAddress: holderAddress1
  }] = await createClaimsRegistryAccountAndClaims(1);
  await createClaimsRegistryAccountAndClaims(1, {holderAddress: getIndexedEthAddress(2)});
  await createClaimsRegistryAccountAndClaims(1, {key: 'anotherClaimKey'});
  await createClaimsRegistryAccountAndClaims(2);
  await createClaimsRegistryAccountAndClaims(3);

  const readClaimsResult = await readClaims();
  readClaimsResult.matchWith({
    Just: ({value}) => {
      const accountId1Claims = value
        .toJS()
        .filter(matchesProperty('claimsRegistryAccountId', accountId1));

      t.is(value.size, 4);
      t.is(accountId1Claims.length, 2);
      accountId1Claims.every(({holderAddresses}) => {
        const arraysAreEqual = shallowCompareArrays(
          holderAddresses,
          [getIndexedEthAddress(2), holderAddress1]
        );
        t.true(arraysAreEqual);
      });
    }
  });
});

serial('readClaims should return a filtered list of Claims', async t => {
  await createClaimsRegistry({address});
  let readClaimsResult;

  await createClaimsRegistryAccountAndClaims(1, {value: 'abc', key: 'custom1'});
  await createClaimsRegistryAccountAndClaims(1, {holderAddress: getIndexedEthAddress(5)});
  await createClaimsRegistryAccountAndClaims(2, {value: 'abc', key: 'custom1'});
  await createClaimsRegistryAccountAndClaims(2, {holderAddress: getIndexedEthAddress(6)});
  await createClaimsRegistryAccountAndClaims(4, {value: 'abc', key: 'custom1'});
  await createClaimsRegistryAccountAndClaims(3, {value: 'abc', key: 'custom2'});

  readClaimsResult = await readClaims();
  readClaimsResult.matchWith({
    Just: ({value}) => {
      t.is(value.size, 6);
    }
  });

  readClaimsResult = await readClaims({value: 'abc'});
  readClaimsResult.matchWith({
    Just: ({value}) => {
      t.is(value.size, 4);
    }
  });

  readClaimsResult = await readClaims({key: 'custom1'});
  readClaimsResult.matchWith({
    Just: ({value}) => {
      t.is(value.size, 3);
    }
  });

  readClaimsResult = await readClaims({holderAddress: getIndexedEthAddress(5)});
  readClaimsResult.matchWith({
    Just: ({value}) => {
      t.is(value.size, 2);
    }
  });

  readClaimsResult = await readClaims({key: 'custom1'});
  readClaimsResult.matchWith({
    Just: ({value}) => {
      t.is(value.size, 3);
    }
  });

  readClaimsResult = await readClaims({key: 'custom2'});
  readClaimsResult.matchWith({
    Just: ({value}) => {
      t.is(value.size, 1);
    }
  });

  readClaimsResult = await readClaims({key: 'inexistent_key'});
  readClaimsResult.matchWith({
    Just: ({value}) => {
      t.is(value.size, 0);
    }
  });

  readClaimsResult = await readClaims({accountId: 'inexistent_account_id'});
  readClaimsResult.matchWith({
    Just: ({value}) => {
      t.is(value.size, 0);
    }
  });

  readClaimsResult = await readClaims({holderAddress: getIndexedEthAddress(8)});
  readClaimsResult.matchWith({
    Just: ({value}) => {
      t.is(value.size, 0);
    }
  });
});
