const {test, serial} = require('ava');
const {initDB} = require('../../../test/helpers');
const {maybeValueReturn} = require('../../../fn');
const {
  storeVestingContractsBatch,
  getVestingContracts,
  deleteVestingContract,
  getLastSuccessfullBlock,
  saveLastSuccessFullBlock,
  hardDeleteVestingContracts,
  getAllVestingContracts
} = require('../vestingRepository');
const {
  createExtendedUser,
  DEFAULT_USER_ID,
  VALID_ETH_ADDRESS,
  deleteAccount
} = require('../../../../common-api/test/helpers/account');
const {cleanDb} = require('../testRepository');

test.before(async () => {
  await initDB();
});

test.beforeEach(async () => {
  await createExtendedUser(DEFAULT_USER_ID, VALID_ETH_ADDRESS, VALID_ETH_ADDRESS, 1);
});

test.afterEach.always(async () => {
  await cleanDb();
});

serial('storeVestingContract should create a vesting contract and return it', async t => {
  const address1 = 'address1';
  const txHash = 'txHash';

  const storeContractResult = await storeVestingContractsBatch([{
    tokenVesting: address1,
    beneficiary: VALID_ETH_ADDRESS,
    txHash
  }]);

  storeContractResult.matchWith({
    Just: ({value}) => {
      const contract = value.toJS();
      t.is(contract.length, 1);
      t.is(contract[0].address, address1);
    },
    Nothing: () => {
      t.fails();
    }
  });
});

serial('getVestingContracts should return the contracts that are not soft deleted', async t => {
  const address1 = 'address1';
  const address2 = 'address2';
  const txHash = 'txHash';

  await storeVestingContractsBatch([{
    tokenVesting: address1,
    beneficiary: VALID_ETH_ADDRESS,
    txHash
  }]);
  await storeVestingContractsBatch([{
    tokenVesting: address2,
    beneficiary: VALID_ETH_ADDRESS,
    txHash
  }]);

  const getContractsResult = await getVestingContracts();

  getContractsResult.matchWith({
    Just: ({value}) => {
      const contracts = value.toJS();
      const contr1 = contracts.find(
        elem => elem.address === address1
      );
      const contr2 = contracts.find(
        elem => elem.address === address2
      );
      t.is(contracts.length, 2);
      t.is(contr1.address, address1);
      t.is(contr1.softDeleted, false);
      t.is(contr2.address, address2);
      t.is(contr2.softDeleted, false);
    },
    Nothing: () => {
      t.fails();
    }
  });
});

serial('deleteVestingContract should soft delete the specified vesting contract', async t => {
  const address1 = 'address1';
  const address2 = 'address2';
  const txHash = 'txHash';

  await storeVestingContractsBatch([{
    tokenVesting: address1,
    beneficiary: VALID_ETH_ADDRESS,
    txHash
  }]);
  await storeVestingContractsBatch([{
    tokenVesting: address2,
    beneficiary: VALID_ETH_ADDRESS,
    txHash
  }]);

  await deleteVestingContract(address1);

  const getContractsResult = await getAllVestingContracts();

  getContractsResult.matchWith({
    Just: ({value}) => {
      const contract = value.toJS();
      t.is(contract.length, 2);
      t.is(contract[0].address, address2);
      t.is(contract[0].softDeleted, false);
      t.is(contract[1].address, address1);
      t.is(contract[1].softDeleted, true);
    },
    Nothing: () => {
      t.fails();
    }
  });
});

serial('deleteVestingContract should not delete anything if the contract is not found', async t => {
  const address1 = 'address1';
  const address2 = 'address2';
  const txHash = 'txHash';

  await storeVestingContractsBatch([{
    tokenVesting: address1,
    beneficiary: VALID_ETH_ADDRESS,
    txHash
  }]);
  await storeVestingContractsBatch([{
    tokenVesting: address2,
    beneficiary: VALID_ETH_ADDRESS,
    txHash
  }]);

  await deleteVestingContract('nonExistent');

  const getContractsResult = await getAllVestingContracts();

  getContractsResult.matchWith({
    Just: ({value}) => {
      const contract = value.toJS();
      t.is(contract.length, 2);
      t.is(contract[0].address, address2);
      t.is(contract[0].softDeleted, false);
      t.is(contract[1].address, address1);
      t.is(contract[1].softDeleted, false);
    },
    Nothing: () => {
      t.fails();
    }
  });
});

serial('saveLastSuccessFullBlock should save the block height and return the value', async t => {
  const blockHeight = 10;
  const saveBlockHeightResult = await saveLastSuccessFullBlock(blockHeight);

  const storedBlock = saveBlockHeightResult.matchWith({
    Just: maybeValueReturn(v => v.toJS())
  });

  const expectedBlock = [
    {
      td: {
        exists: true,
        lastSuccessfullHeight: blockHeight
      }
    }
  ];

  t.deepEqual(storedBlock, expectedBlock);
});

serial('saveLastSuccessFullBlock should update the block height and return the value', async t => {
  const blockHeight1 = 10;
  const blockHeight2 = 20;
  await saveLastSuccessFullBlock(blockHeight1);
  const saveBlockHeightResult2 = await saveLastSuccessFullBlock(blockHeight2);

  const storedBlock = saveBlockHeightResult2.matchWith({
    Just: maybeValueReturn(v => v.toJS())
  });

  const expectedBlock = [
    {
      td: {
        exists: true,
        lastSuccessfullHeight: blockHeight2
      }
    }
  ];

  t.deepEqual(storedBlock, expectedBlock);
});

serial('getLastSuccessfullBlock should return the last successfull block height', async t => {
  const blockHeight1 = 10;
  const blockHeight2 = 20;
  await saveLastSuccessFullBlock(blockHeight1);
  await saveLastSuccessFullBlock(blockHeight2);

  const getBlockHeightResult = await getLastSuccessfullBlock();
  const storedBlock = getBlockHeightResult.matchWith({
    Just: maybeValueReturn(v => v.toJS())
  });

  const expectedBlock = [
    {
      height: {
        exists: true,
        lastSuccessfullHeight: blockHeight2
      }
    }
  ];

  t.deepEqual(storedBlock, expectedBlock);
});
