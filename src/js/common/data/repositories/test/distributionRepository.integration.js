const {test, serial} = require('ava');
const Maybe = require('folktale/maybe');
const {initDB} = require('../../../test/helpers');
const {
  maybeValueReturn,
  maybeValueGet,
  ignoreProp,
  ignoreProps
} = require('../../../fn');
const {
  createDistributionEvent: createDistributionEventDB,
  cloneDistributionEvent,
  createDistributionFile,
  hardDeleteDistributionContract,
  readDistributionEventFile,
  readDistributionContracts,
  readDistributionEvent,
  readDistributionEvents,
  createDistributionContract,
  readDistributionFiles,
  readDistributionFile,
  updateDistributionBatch,
  readDistributionBatch,
  readDistributionBatchByAddress,
  readBatchByAddresses,
  deleteDistributionFile,
  deleteDistributionFiles,
  deleteDistributionContracts,
  deleteDistributionEvents,
  saveDistributionContractsBatch,
  getDistributionContracts,
  getDistributionContract,
  hardDeleteDistributionContracts,
  saveLastDistributionSuccessfullBlock,
  getLastDistributionSuccessfullBlock,
  createDistributionBatch: createDistributionBatchDB,
  readDistributionNonce,
  updateDistributionEventStatus,
  getRunningDistributions,
  hardDeleteDistributionEvents,
  deleteDistributionEvent,

  deleteDistributionContract: deleteDistributionContractDb,
  storeBatchSignature
} = require('../distributionRepository');
const {
  createExtendedUser,
  DEFAULT_USER_ID,
  deleteAccount
} = require('../../../../common-api/test/helpers/account');
const {
  DEFAULT_DIST_ADDRESS,
  createDistributionEvent,
  createNewDistributionContract,
  createAndStoreDistributionFile,
  deleteDistributionContract,
  getGenerateDistAddress,
  createDistributionFileData,
  createDistributionBatchData,
  createDistributionBatch,
  updateDistributionBatchData,
  getGenerateTxHash,
  createDistributionEventWithBatches,
  getBatchesFromEventResult
} = require('../../../../common-api/test/helpers/distribution');

const {
  PRIMARY_TOKEN_ADDRESS
} = require('../../../../common-api/test/helpers/token');
const {cleanDb} = require('../testRepository');

test.before(async () => {
  await initDB();
});

test.beforeEach(async () => {
  await createExtendedUser(DEFAULT_USER_ID);
  await createNewDistributionContract();
});

test.afterEach.always(async () => {
  await cleanDb();
});

serial('createDistributionContract should create a DistributionContract correctly', async t => {
  await createDistributionContract('test');
  const contractsResult = await readDistributionContracts();

  contractsResult.matchWith({
    Just: ({value}) => {
      const contracts = value.toJS();
      t.truthy(contracts.find(({address}) => address === 'test'));
    }
  });
});

serial('readDistributionContracts should return an array of distributon contracts', async t => {
  await createDistributionContract('test');
  const contractsResult = await readDistributionContracts();

  contractsResult.matchWith({
    Just: ({value}) => {
      const contracts = value.toJS();

      t.truthy(contracts.find(({address}) => address === 'test'));
      t.true(Array.isArray(contracts));
    }
  });
});

serial('readDistributionContracts should return emptyArray if no distribution contracts are stored', async t => {
  await deleteDistributionContracts();

  const contractsResult = await readDistributionContracts();
  contractsResult.matchWith({
    Just: ({value}) => t.deepEqual(value.toJS(), []),
    Nothing: t.fail.bind(t)
  });
});

serial('hardDeleteDistributionContract should hard delete a DistributionContract correctly', async t => {
  await createDistributionContract('test');

  const contractsResult = await readDistributionContracts();
  contractsResult.matchWith({
    Just: ({value}) => {
      const contracts = value.toJS();

      t.truthy(contracts.find(({address}) => address === 'test'));
      t.true(Array.isArray(contracts));
      t.is(contracts.length, 2);
    }
  });

  await hardDeleteDistributionContract('test');

  const contractsResult2 = await readDistributionContracts();
  contractsResult2.matchWith({
    Just: ({value}) => {
      const contracts = value.toJS();

      t.falsy(contracts.find(({address}) => address === 'test'));
      t.true(Array.isArray(contracts));
      t.is(contracts.length, 1);
    }
  });
});

serial('deleteDistributionContracts should delete all DistributionContracts correctly', async t => {
  const contractsResult = await readDistributionContracts();
  contractsResult.matchWith({
    Just: ({value}) => {
      const contracts = value.toJS();

      t.true(Array.isArray(contracts));
      t.is(contracts.length, 1);
    }
  });

  await deleteDistributionContracts();

  const contractsResult2 = await readDistributionContracts();
  contractsResult2.matchWith({
    Just: ({value}) => t.deepEqual(value.toJS(), []),
    Nothing: t.fail.bind(t)
  });
});

serial('deleteDistributionEvents should delete all DistributionEvents correctly', async t => {
  await createDistributionEvent();

  const readDistributionEventsResult = await readDistributionEvents(DEFAULT_DIST_ADDRESS);
  readDistributionEventsResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.true(Array.isArray(data));
      t.is(data.length, 1);
    }
  });

  await deleteDistributionEvents();
  const readDistributionEventsResult2 = await readDistributionEvents(DEFAULT_DIST_ADDRESS);
  readDistributionEventsResult2.matchWith({
    Just: ({value}) => t.deepEqual(value.toJS(), []),
    Nothing: t.fail.bind(t)
  });
});

serial('deleteDistributionEvent should delete the DistributionEvent correctly', async t => {
  const eventResult = await createDistributionEvent();
  const event = eventResult.matchWith({
    Just: maybeValueReturn(v => v.toJS())
  });

  await deleteDistributionEvent(event.id);

  const readEventResult = await readDistributionEvent(event.id);

  readEventResult.matchWith({
    Just: () => {
      t.fails();
    },
    Nothing: () => {
      t.pass();
    }
  });
});

serial('createDistributionEvent should create a distributionEvent withouth optional file id and return object', async t => {
  const eventResult = await createDistributionEvent();
  const event = eventResult.matchWith({
    Just: maybeValueReturn(v => v.toJS())
  });

  const readEventResult = await readDistributionEvent(event.id);

  const storedEvent = readEventResult.matchWith({
    Just: maybeValueReturn(v => v.toJS())
  });

  const expectedEvent = {
    ...event,
    addressCount: 0,
    distributionContract: DEFAULT_DIST_ADDRESS,
    distributionBatches: [],
    distributionFileId: null,
    distributionFileName: null,
    distributionValue: 0,
    transfersCompleted: 0,
    signed: 0
  };

  t.deepEqual(storedEvent, expectedEvent);
});

serial('createDistributionEvent should create a distributionEvent and append the optional fileId correctly', async t => {
  const distributionFileData = createDistributionFileData({});
  const createDistributionFileResult = await createDistributionFile(
    ...Object.values(distributionFileData)
  );
  const file = await createDistributionFileResult.matchWith({
    Just: maybeValueReturn(v => v.toJS())
  });

  const eventResult = await createDistributionEvent(DEFAULT_USER_ID, DEFAULT_DIST_ADDRESS, file.id);
  const event = eventResult.matchWith({
    Just: maybeValueReturn(v => v.toJS())
  });

  const readEventResult = await readDistributionEvent(event.id);

  const storedEvent = readEventResult.matchWith({
    Just: maybeValueReturn(v => v.toJS())
  });

  const expectedEvent = {
    ...event,
    addressCount: 0,
    distributionContract: DEFAULT_DIST_ADDRESS,
    distributionBatches: [],
    distributionFileId: file.id,
    distributionFileName: distributionFileData.name,
    distributionValue: 0,
    transfersCompleted: 0,
    signed: 0
  };

  t.deepEqual(storedEvent, expectedEvent);
});

serial('createDistributionEvent should return Nothing if the distAddress does not exist', async t => {
  const createDistributionEventResult = await createDistributionEventDB('fake address');
  createDistributionEventResult.matchWith({
    Nothing: t.pass.bind(t)
  });
});

serial('readDistributionEvents should return the existing events of a given Distribution Contract', async t => {
  await createDistributionEvent();
  await createDistributionEvent();

  const readDistributionEventsResult = await readDistributionEvents(DEFAULT_DIST_ADDRESS);
  readDistributionEventsResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.true(Array.isArray(data));
      t.is(data.length, 2);
    }
  });
});

serial('readDistributionEvents should return empty array if the no events exist', async t => {
  const readDistributionEventsResult = await readDistributionEvents(DEFAULT_DIST_ADDRESS);
  readDistributionEventsResult.matchWith({
    Just: ({value}) => t.deepEqual(value.toJS(), []),
    Nothing: t.fail.bind(t)
  });
});

serial('readDistributionEvent should return the relative DistributionEvent object', async t => {
  const createEventResult = await createDistributionEvent();
  const event = createEventResult.matchWith({
    Just: maybeValueReturn(v => v.toJS())
  });

  const readDistributionEventResult = await readDistributionEvent(event.id);
  readDistributionEventResult.matchWith({
    Just: ({value}) => {
      const storedEvent = value.toJS();

      const expectedEvent = {
        ...event,
        distributionValue: 0,
        addressCount: 0,
        distributionContract: DEFAULT_DIST_ADDRESS,
        distributionBatches: [],
        distributionFileId: null,
        distributionFileName: null,
        transfersCompleted: 0,
        signed: 0
      };

      t.deepEqual(expectedEvent, storedEvent);
    }
  });
});

serial('readDistributionEvent should return Nothing if the event does not exist', async t => {
  const readDistributionEventResult = await readDistributionEvent(0);
  readDistributionEventResult.matchWith({
    Nothing: t.pass.bind(t)
  });
});

serial('readDistributionEventFile should return the relative file of the DistributionEvent', async t => {
  const distributionFileData = createDistributionFileData({});
  const createDistributionFileResult = await createDistributionFile(
    ...Object.values(distributionFileData)
  );
  const distributionFile = await createDistributionFileResult.matchWith({
    Just: maybeValueReturn(v => v.toJS())
  });

  const createEventResult = await createDistributionEvent(
    DEFAULT_USER_ID,
    DEFAULT_DIST_ADDRESS,
    distributionFile.id
  );
  const event = createEventResult.matchWith({
    Just: maybeValueReturn(v => v.toJS())
  });

  const readDistributionEventFileResult = await readDistributionEventFile(event.id);
  const storedDistributionFile = await readDistributionEventFileResult.matchWith({
    Just: maybeValueReturn(v => v.toJS())
  });

  t.deepEqual(storedDistributionFile, distributionFile);
});

serial('readDistributionEventFile should return Nothing if the event does not exist or hase no file', async t => {
  // if event has not files attached
  const createEventResult = await createDistributionEvent();
  createEventResult.matchWith({
    Just: async ({value: event}) => {
      const readDistributionEventFileResult = await readDistributionEventFile(event.get('id'));
      await readDistributionEventFileResult.matchWith({
        Nothing: t.pass.bind(t)
      });
    }
  });

  // if eventId does not exist
  const readDistributionEventFileResult = await readDistributionEventFile(0);
  await readDistributionEventFileResult.matchWith({
    Nothing: t.pass.bind(t)
  });
});

serial('createDistributionFile should create distribution file and return object', async t => {
  const distributionFileData = createDistributionFileData({});
  const createDistributionFileResult = await createDistributionFile(
    ...Object.values(distributionFileData)
  );

  const distributionFile = await createDistributionFileResult.matchWith({
    Just: maybeValueReturn(v => v.toJS())
  });

  const expectedDistributionFile = {
    id: distributionFile.id,
    name: distributionFileData.name,
    numOfTokens: distributionFileData.numOfTokens,
    numOfTransfers: distributionFileData.numOfTransfers,
    path: distributionFileData.filePath,
    softDeleted: false
  };

  t.deepEqual(expectedDistributionFile, distributionFile);

  const readDistributionFileResult = await readDistributionFile(distributionFile.id);
  await readDistributionFileResult.matchWith({
    Just: ({value}) => {
      t.is(value.get('id'), distributionFile.id);
    }
  });
});

serial('createDistributionFile should return Nothing if userId not found', async t => {
  const distributionFileData = createDistributionFileData({userId: 'test'});
  const createDistributionFileResult = await createDistributionFile(
    ...Object.values(distributionFileData)
  );

  t.true(Maybe.Nothing.hasInstance(createDistributionFileResult));
});

serial('readDistributionFiles should return array of distribution files', async t => {
  const expectedFile1 = await createAndStoreDistributionFile({});
  const expectedFile2 = await createAndStoreDistributionFile({filePath: 'testpath'});

  const readDistributionFilesResult = await readDistributionFiles();
  await readDistributionFilesResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.true(Array.isArray(data));
      t.is(data.length, 2);
      t.deepEqual(data.find(({id}) => id === expectedFile1.id), expectedFile1);
      t.deepEqual(data.find(({id}) => id === expectedFile2.id), expectedFile2);
    }
  });
});

serial('readDistributionFiles should return empty array if no distribution files exist', async t => {
  const readDistributionFilesResult = await readDistributionFiles();
  await readDistributionFilesResult.matchWith({
    Just: ({value}) => t.deepEqual(value.toJS(), []),
    Nothing: t.fail.bind(t)
  });
});

serial('deleteDistributionFiles should delete all DistributionFiles', async t => {
  const expectedFile1 = await createAndStoreDistributionFile({});
  const expectedFile2 = await createAndStoreDistributionFile({filePath: 'testpath'});

  const readDistributionFilesResult = await readDistributionFiles();
  await readDistributionFilesResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.true(Array.isArray(data));
      t.is(data.length, 2);
      t.deepEqual(data.find(({id}) => id === expectedFile1.id), expectedFile1);
      t.deepEqual(data.find(({id}) => id === expectedFile2.id), expectedFile2);
    }
  });

  await deleteDistributionFiles();

  const readDistributionFilesResult2 = await readDistributionFiles();
  await readDistributionFilesResult2.matchWith({
    Just: ({value}) => t.deepEqual(value.toJS(), []),
    Nothing: t.fail.bind(t)
  });
});

serial('readDistributionFile should return distribution file object', async t => {
  const distributionFile = await createAndStoreDistributionFile({});

  const readDistributionFileResult = await readDistributionFile(distributionFile.id);
  await readDistributionFileResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.deepEqual(data, distributionFile);
    }
  });
});

serial('readDistributionFile should return Nothing if distributionId not found', async t => {
  const readDistributionFileResult = await readDistributionFile(-1);

  t.true(Maybe.Nothing.hasInstance(readDistributionFileResult));
});

serial('createDistributionBatch should create a distribution batch and echo distribution batch object', async t => {
  const eventResult = await createDistributionEvent();
  const event = eventResult.matchWith({
    Just: maybeValueReturn(v => v.toJS())
  });

  const {addresses, balances, batchValue} = createDistributionBatchData({});
  const createDistributionBatchResult = await createDistributionBatchDB(
    event.id,
    addresses,
    balances,
    batchValue
  );

  const expectedBatch = {
    addresses,
    balances,
    status: 0,
    batchValue
  };

  return createDistributionBatchResult.matchWith({
    Just: ({value}) => {
      t.deepEqual(ignoreProp('id')(value.toJS()), expectedBatch);
    }
  });
});

serial('createDistributionBatch should return Nothing if eventId not found', async t => {
  const distributionBatchData = createDistributionBatchData({});
  const createDistributionBatchResult = await createDistributionBatch(0, distributionBatchData);

  t.true(Maybe.Nothing.hasInstance(createDistributionBatchResult));
});

serial('updateDistributionBatch should update distribution batch and echo it', async t => {
  const eventResult = await createDistributionEvent();
  const event = eventResult.matchWith({
    Just: maybeValueReturn(v => v.toJS())
  });

  const distributionBatchData = createDistributionBatchData({});
  const distributionBatchResult = await createDistributionBatch(event.id, distributionBatchData);
  const distributionBatch = distributionBatchResult.matchWith({
    Just: maybeValueReturn(v => v.toJS())
  });

  const updDistributionBatchData = updateDistributionBatchData({
    status: 1,
    blockNumber: 42,
    input: 'input',
    transactionIndex: 43
  });

  const update = {
    status: 1,
    blockNumber: 42,
    input: 'input',
    transactionIndex: 43
  };
  const txHash = getGenerateTxHash(1);

  const updateDistributionBatchResult = await updateDistributionBatch(
    event.id,
    distributionBatch.id,
    txHash,
    update,
    1
  );

  const expectedResult = {
    ...distributionBatch,
    ...updDistributionBatchData,
    txHash
  };

  await updateDistributionBatchResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();
      t.deepEqual(data, expectedResult);
    }
  });
});

serial('updateDistributionBatch should return Nothing if batchId not found', async t => {
  const updDistributionBatchData = updateDistributionBatchData({});
  const updateDistributionBatchResult = await updateDistributionBatch(
    0,
    1,
    'fakeHash',
    updDistributionBatchData,
    1
  );

  t.true(Maybe.Nothing.hasInstance(updateDistributionBatchResult));
});

serial('readDistributionBatch should return distribution batch object', async t => {
  const eventResult = await createDistributionEvent();
  const event = eventResult.matchWith({
    Just: maybeValueReturn(v => v.toJS())
  });

  const distributionBatchData = createDistributionBatchData({});
  const createDistributionBatchResult = await createDistributionBatch(
    event.id,
    distributionBatchData
  );
  const distributionBatch = createDistributionBatchResult.matchWith({
    Just: maybeValueReturn(v => v.toJS())
  });

  const readDistributionBatchResult = await readDistributionBatch(event.id, distributionBatch.id);
  await readDistributionBatchResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      // most values are null before updateBatch is called
      const expectedBatch = {
        ...distributionBatch,
        status: 0,
        blockNumber: null,
        input: null,
        addressCount: distributionBatch.addresses.length,
        batchSignature: null,
        txHash: null,
        transactionIndex: null
      };

      t.deepEqual(data, expectedBatch);
    }
  });
});

serial('readDistributionBatch should return Nothing if distributionBatchId not found', async t => {
  const readDistributionBatchResult = await readDistributionBatch(0, 0);

  t.true(Maybe.Nothing.hasInstance(readDistributionBatchResult));
});

serial('readBatchByAddresses should return the distributor batch for the given fileId and list of addresses', async t => {
  const eventResult = await createDistributionEvent();
  const event = eventResult.matchWith({
    Just: maybeValueReturn(v => v.toJS())
  });

  const distributionBatchData = createDistributionBatchData({});
  const createDistributionBatchResult = await createDistributionBatch(
    event.id,
    distributionBatchData
  );
  const distributionBatch = createDistributionBatchResult.matchWith({
    Just: maybeValueReturn(v => v.toJS())
  });

  const readBatchByAddressesResult = await readBatchByAddresses(
    event.id,
    distributionBatchData.addresses
  );

  await readBatchByAddressesResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      const expectedBatch = {
        ...distributionBatch,
        status: 0,
        blockNumber: null,
        input: null,
        addressCount: distributionBatch.addresses.length,
        txHash: null
      };

      t.deepEqual(data, expectedBatch);
    }
  });
});

serial('readBatchByAddresses should return Nothing if the criterion not found', async t => {
  const eventResult = await createDistributionEvent();
  const event = eventResult.matchWith({
    Just: maybeValueReturn(v => v.toJS())
  });

  const distributionBatchData = createDistributionBatchData({});
  await createDistributionBatch(event.id, distributionBatchData);

  // with non-existing event it
  const readBatchByAddressesResult1 = await readBatchByAddresses(
    0,
    distributionBatchData.addresses
  );
  t.true(Maybe.Nothing.hasInstance(readBatchByAddressesResult1));

  // with non-existing addresses array
  const readBatchByAddressesResult2 = await readBatchByAddresses(event.id, []);
  t.true(Maybe.Nothing.hasInstance(readBatchByAddressesResult2));
});

serial('deleteDistributionFile should set the property softDelete to true distribution file', async t => {
  const distributionData = createDistributionFileData({});
  const createDistributionFileResult = await createDistributionFile(
    ...Object.values(distributionData)
  );

  const distributionId = await createDistributionFileResult.matchWith({
    Just: ({value}) => value.get('id')
  });

  await deleteDistributionFile(distributionId);

  const readDistributionFileResult = await readDistributionFile(distributionId);
  await readDistributionFileResult.matchWith({
    Just: ({value}) => {
      t.true(value.get('softDeleted'));
    }
  });
});

serial('deleteDistributionFile should do nothing if distributionId not found', async t => {
  const distributionData = createDistributionFileData({});
  const createDistributionFileResult = await createDistributionFile(
    ...Object.values(distributionData)
  );

  const distributionId = await createDistributionFileResult.matchWith({
    Just: ({value}) => value.get('id')
  });

  await deleteDistributionFile(-1);

  const readDistributionFileResult = await readDistributionFile(distributionId);
  await readDistributionFileResult.matchWith({
    Just: ({value}) => {
      t.false(value.get('softDeleted'));
    }
  });
});

serial('saveDistributionContract should save the distribution contract in the database', async t => {
  const address = getGenerateDistAddress(1);
  const tokenAddress = PRIMARY_TOKEN_ADDRESS;
  const txHash = 'txHash';

  const saveDistributionResult = await saveDistributionContractsBatch([{
    tokenDistribution: address,
    token: tokenAddress,
    txHash
  }]);

  const storedDistribution = saveDistributionResult.matchWith({
    Just: maybeValueReturn(v => v.toJS())
  });

  const expectedDistribution = {
    tokenAddress,
    address,
    softDeleted: false,
    txHash,
    nonce: 0
  };

  t.deepEqual(expectedDistribution, storedDistribution);
});

serial('getDistributionContracts should return the distribution contracts from the database', async t => {
  await hardDeleteDistributionContracts();
  const distAddress = getGenerateDistAddress(1);
  const tokenAddress = PRIMARY_TOKEN_ADDRESS;
  await saveDistributionContractsBatch([{
    tokenDistribution: distAddress,
    token: tokenAddress,
    txHash: 'fakeHash'
  }]);

  const getDistributionContractsResult = await getDistributionContracts(0, 1000);

  const firstStoredContract = getDistributionContractsResult.matchWith({
    Just: maybeValueReturn(v => v.get(0).toJS())
  });

  const expectedContract = {
    tokenAddress,
    txHash: 'fakeHash',
    softDeleted: false,
    address: distAddress,
    nonce: 0
  };

  t.deepEqual(expectedContract, firstStoredContract);
});

serial('getDistributionContracts should only return the distribution contracts that are not soft deleted', async t => {
  await hardDeleteDistributionContracts();
  const distAddress1 = getGenerateDistAddress(1);
  const distAddress2 = getGenerateDistAddress(2);
  const tokenAddress = PRIMARY_TOKEN_ADDRESS;
  await saveDistributionContractsBatch([{
    tokenDistribution: distAddress1,
    token: tokenAddress,
    txHash: 'fakeHash'
  }]);
  await saveDistributionContractsBatch([{
    tokenDistribution: distAddress2,
    token: tokenAddress,
    txHash: 'fakeHash'
  }]);
  await deleteDistributionContract(distAddress1);

  const getDistributionContractsResult = await getDistributionContracts();

  getDistributionContractsResult.matchWith({
    Just: ({value: contracts}) => {
      const storedDistributionContract = contracts.get(0).toJS();

      const expectedDistributionContract = {
        tokenAddress,
        address: distAddress2,
        softDeleted: false,
        txHash: 'fakeHash',
        nonce: 0
      };

      t.deepEqual(expectedDistributionContract, storedDistributionContract);
      t.is(contracts.size, 1);
    }
  });
});

serial('deleteDistributionContract should soft delete the disrtibution contract from the database', async t => {
  const distAddress = getGenerateDistAddress(1);
  const tokenAddress = PRIMARY_TOKEN_ADDRESS;

  await saveDistributionContractsBatch([{
    tokenDistribution: distAddress,
    token: tokenAddress,
    txHash: 'fakeHash'
  }]);
  const deleteDistributionContractresult = await deleteDistributionContract(distAddress);

  const deletedContract = deleteDistributionContractresult.matchWith({
    Just: maybeValueReturn(v => v.toJS())
  });

  const expectedResult = {
    tokenAddress,
    softDeleted: true,
    txHash: 'fakeHash',
    address: distAddress,
    nonce: 0
  };

  t.deepEqual(deletedContract, expectedResult);
});

serial('saveLastDistributionSuccessfullBlock should save the block height and return the value', async t => {
  const blockHeight = 10;
  const saveBlockHeightResult = await saveLastDistributionSuccessfullBlock(blockHeight);

  const storedBlock = saveBlockHeightResult.matchWith({
    Just: maybeValueReturn(v => v.toJS())
  });

  const expectedBlock = {
    exists: true,
    lastSuccessfullHeight: blockHeight
  };

  t.deepEqual(storedBlock, expectedBlock);
});

serial('saveLastDistributionSuccessfullBlock should update the block height and return the value', async t => {
  const blockHeight1 = 10;
  const blockHeight2 = 20;
  await saveLastDistributionSuccessfullBlock(blockHeight1);
  const saveBlockHeightResult2 = await saveLastDistributionSuccessfullBlock(blockHeight2);

  const storedBlock = saveBlockHeightResult2.matchWith({
    Just: maybeValueReturn(v => v.toJS())
  });

  const expectedBlock = {
    exists: true,
    lastSuccessfullHeight: blockHeight2
  };

  t.deepEqual(storedBlock, expectedBlock);
});

serial('getLastDistributionSuccessfullBlock should return the last successfull block height', async t => {
  const blockHeight1 = 10;
  const blockHeight2 = 20;
  await saveLastDistributionSuccessfullBlock(blockHeight1);
  await saveLastDistributionSuccessfullBlock(blockHeight2);

  const getBlockHeightResult = await getLastDistributionSuccessfullBlock();
  const storedBlock = getBlockHeightResult.matchWith({
    Just: maybeValueReturn(v => v.toJS())
  });

  const expectedBlock = {
    exists: true,
    lastSuccessfullHeight: blockHeight2
  };

  t.deepEqual(storedBlock, expectedBlock);
});

serial('getDistributionContract should return the distribution contract from the database', async t => {
  const distAddress = getGenerateDistAddress(1);
  const tokenAddress = PRIMARY_TOKEN_ADDRESS;
  await saveDistributionContractsBatch([{
    tokenDistribution: distAddress,
    token: tokenAddress,
    txHash: 'fakeHash'
  }]);

  const getDistributionContractResult = await getDistributionContract(distAddress);

  getDistributionContractResult
    .matchWith({
      Just: ({value}) => {
        const expectedContract = {
          tokenAddress,
          txHash: 'fakeHash',
          softDeleted: false,
          address: distAddress,
          nonce: 0
        };

        t.deepEqual(expectedContract, value.toJS());
      }
    });
});

serial('getDistributionContract should return Nothing if the distribution contracts is soft deleted', async t => {
  const distAddress = getGenerateDistAddress(1);
  const tokenAddress = PRIMARY_TOKEN_ADDRESS;

  await saveDistributionContractsBatch([{
    tokenDistribution: distAddress,
    token: tokenAddress,
    txHash: 'fakeHash'
  }]);
  await deleteDistributionContract(distAddress);

  const getDistributionContractResult = await getDistributionContract(distAddress);

  t.true(Maybe.Nothing.hasInstance(getDistributionContractResult));
});

serial('getDistributionContract should return Nothing when there are no distribution contracts in the database', async t => {
  const distAddress = getGenerateDistAddress(1);

  const getDistributionContractResult = await getDistributionContract(distAddress);

  t.true(Maybe.Nothing.hasInstance(getDistributionContractResult));
});

serial('readDistributionNonce should return the nonce of the distribution contract', async t => {
  const distAddress = getGenerateDistAddress(1);
  const tokenAddress = PRIMARY_TOKEN_ADDRESS;
  await saveDistributionContractsBatch([{
    tokenDistribution: distAddress,
    token: tokenAddress,
    txHash: 'fakeHash'
  }]);

  const getDistributionNonceResult = await readDistributionNonce(distAddress);

  const nonce = getDistributionNonceResult
    .matchWith({
      Just: ({value}) => value,
      Nothing: () => {
        throw new Error('could not find distribution cotnract');
      }
    });
  t.is(nonce, 0);
});

serial('updateDistributionEventStatus should update the status of the distribution event', async t => {
  const eventResult = await createDistributionEvent();
  const event = eventResult.matchWith({
    Just: maybeValueReturn(v => v.toJS())
  });
  const eventBeforeUpdate = await readDistributionEvent(event.id);
  await updateDistributionEventStatus(event.id, 'updated');
  const eventAfterUpdate = await readDistributionEvent(event.id);

  const statusBeforeUpdate = eventBeforeUpdate.matchWith({
    Just: ({value}) => value.get('status'),
    Nothing: () => {
      throw new Error('Distribution event not found');
    }
  });

  const statusAfterUpdate = eventAfterUpdate.matchWith({
    Just: ({value}) => value.get('status'),
    Nothing: () => {
      throw new Error('Distribution event not found');
    }
  });

  t.is(statusBeforeUpdate, 'pending');
  t.is(statusAfterUpdate, 'updated');
});

serial('cloneDistributionEvent should duplicate an event correctly', async t => {
  const {id: originalEventId} = await createDistributionEventWithBatches();

  const readEventResult = await readDistributionEvent(originalEventId);
  const storedEvent = readEventResult.matchWith({
    Just: maybeValueReturn(v => v.toJS())
  });

  const filteredEvent = ignoreProps([
    'id'
  ])(storedEvent);

  const expectedEvent = {
    ...filteredEvent,
    distributionContract: DEFAULT_DIST_ADDRESS,
    distributionFileId: null,
    distributionFileName: null,
    distributionValue: 3,
    addressCount: 15,
    transfersCompleted: 0,
    signed: 0,
    status: 'pending'
  };

  t.deepEqual(filteredEvent, expectedEvent);
});

serial('cloneDistributionEvent should not duplicate batches but update batch edge', async t => {
  const {id: originalEventId} = await createDistributionEventWithBatches();

  const readOriginalEventResult = await readDistributionEvent(originalEventId);
  const originalEvent = readOriginalEventResult.matchWith({
    Just: maybeValueReturn(v => v.toJS())
  });
  const oldBatchesResult = await Promise.all(
    originalEvent.distributionBatches
      .map(({id}) => readDistributionBatch(originalEvent.id, id))
  );
  const oldBatches = oldBatchesResult.map(getBatchesFromEventResult);

  const repeatDistributionEventResult = await cloneDistributionEvent(
    DEFAULT_USER_ID,
    originalEventId
  );
  const id = repeatDistributionEventResult.matchWith({
    Just: maybeValueGet('id'),
    Nothing: () => {
      throw new Error('Repeated Distribution event not found');
    }
  });

  const readClonedEventResult = await readDistributionEvent(id);
  const clonedEvent = readClonedEventResult.matchWith({
    Just: maybeValueReturn(v => v.toJS())
  });

  const newBatchesResult = await Promise.all(
    clonedEvent.distributionBatches
      .map(({id}) => readDistributionBatch(clonedEvent.id, id))
  );
  const newBatches = newBatchesResult.map(getBatchesFromEventResult);

  newBatches.forEach(newBatch => {
    const originalBatch = oldBatches
      .find(({id}) => (id === newBatch.id));

    const expectedNewBatch = {
      ...originalBatch,
      status: 0,
      txHash: null,
      blockNumber: null,
      batchSignature: null,
      transactionIndex: null,
      input: null
    };

    t.deepEqual(newBatch, expectedNewBatch);
  });
});

serial('cloneDistributionEvent should update userId, status and timestamp correctly', async t => {
  const newUserId = 'userId1';
  const {id: originalEventId} = await createDistributionEventWithBatches();

  const repeatDistributionEventResult = await cloneDistributionEvent(newUserId, originalEventId);
  const clonedEventId = repeatDistributionEventResult.matchWith({
    Just: maybeValueGet('id'),
    Nothing: () => {
      throw new Error('Repeated Distribution event not found');
    }
  });

  const readOriginalEventResult = await readDistributionEvent(originalEventId);
  const originalEvent = readOriginalEventResult.matchWith({
    Just: maybeValueReturn(v => v.toJS())
  });

  const readClonedEventResult = await readDistributionEvent(clonedEventId);
  const clonedEvent = readClonedEventResult.matchWith({
    Just: maybeValueReturn(v => v.toJS())
  });

  t.is(clonedEvent.initiatedBy, newUserId);
  t.is(clonedEvent.status, 'pending');
  t.true(clonedEvent.timestamp > originalEvent.timestamp);
});

serial('cloneDistributionEvent should keep the same DistributionFile node without duplicating, if exists', async t => {
  const distributionFileData = createDistributionFileData({});
  const createDistributionFileResult = await createDistributionFile(
    ...Object.values(distributionFileData)
  );
  const {id: fileId} = await createDistributionFileResult.matchWith({
    Just: maybeValueReturn(v => v.toJS())
  });

  const {id: originalEventId} = await createDistributionEventWithBatches(
    undefined,
    undefined,
    fileId
  );

  const repeatDistributionEventResult = await cloneDistributionEvent(
    DEFAULT_USER_ID,
    originalEventId
  );
  const id = repeatDistributionEventResult.matchWith({
    Just: maybeValueGet('id'),
    Nothing: () => {
      throw new Error('Repeated Distribution event not found');
    }
  });

  const readOriginalEventResult = await readDistributionEvent(originalEventId);
  const originalEvent = readOriginalEventResult.matchWith({
    Just: maybeValueReturn(v => v.toJS())
  });

  const readClonedEventResult = await readDistributionEvent(id);
  const clonedEvent = readClonedEventResult.matchWith({
    Just: maybeValueReturn(v => v.toJS())
  });

  t.is(clonedEvent.fileId, originalEvent.fileId);
});

serial('cloneDistributionEvent should keep the same DistributionContract node withot duplicating it', async t => {
  const {id: originalEventId} = await createDistributionEventWithBatches();

  const repeatDistributionEventResult = await cloneDistributionEvent(
    DEFAULT_USER_ID,
    originalEventId
  );
  const id = repeatDistributionEventResult.matchWith({
    Just: maybeValueGet('id'),
    Nothing: () => {
      throw new Error('Repeated Distribution event not found');
    }
  });

  const readOriginalEventResult = await readDistributionEvent(originalEventId);
  const originalEvent = readOriginalEventResult.matchWith({
    Just: maybeValueReturn(v => v.toJS())
  });

  const readClonedEventResult = await readDistributionEvent(id);
  const clonedEvent = readClonedEventResult.matchWith({
    Just: maybeValueReturn(v => v.toJS())
  });

  t.is(clonedEvent.distributionContract, originalEvent.distributionContract);
});

serial('cloneDistributionEvent should not duplicate events with no batches', async t => {
  const eventResult = await createDistributionEvent();
  const originalEventId = eventResult.matchWith({
    Just: maybeValueGet('id')
  });

  const repeatDistributionEventResult = await cloneDistributionEvent(
    DEFAULT_USER_ID,
    originalEventId
  );
  repeatDistributionEventResult.matchWith({
    Just: () => {
      throw new Error('Repeated Distribution event not found');
    },
    Nothing: t.pass.bind(t)
  });
});

serial('getRunningDistributions should return events with state `executing`', async t => {
  let eventResult = await createDistributionEvent();
  let event = eventResult.matchWith({
    Just: maybeValueReturn(v => v.toJS())
  });
  const executingId = event.id;
  await updateDistributionEventStatus(executingId, 'executing');

  eventResult = await createDistributionEvent();
  event = eventResult.matchWith({
    Just: maybeValueReturn(v => v.toJS())
  });

  const getRunningDistributionsResult = await getRunningDistributions();

  getRunningDistributionsResult.matchWith({
    Just: ({value: data}) => {
      t.is(data.size, 1);
      t.is(data.getIn([0, 'id']), executingId);
    },
    Nothing: () => {
      t.fail('No running contracts found');
    }
  });
});

serial('getRunningDistributions should return all events with state `executing`', async t => {
  let eventResult = await createDistributionEvent();
  let event = eventResult.matchWith({
    Just: maybeValueReturn(v => v.toJS())
  });
  const executingId1 = event.id;
  await updateDistributionEventStatus(executingId1, 'executing');

  eventResult = await createDistributionEvent();
  event = eventResult.matchWith({
    Just: maybeValueReturn(v => v.toJS())
  });
  const executingId2 = event.id;
  await updateDistributionEventStatus(executingId2, 'executing');

  const getRunningDistributionsResult = await getRunningDistributions();

  getRunningDistributionsResult.matchWith({
    Just: ({value: data}) => {
      t.is(data.size, 2);
      t.truthy(data.find(d => d.get('id') === executingId2));
      t.truthy(data.find(d => d.get('id') === executingId1));
    },
    Nothing: () => {
      t.fail('No running contracts found');
    }
  });
});

serial('getRunningDistributions should return empty array when there are no executing events', async t => {
  await createDistributionEvent();
  await createDistributionEvent();

  const getRunningDistributionsResult = await getRunningDistributions();

  getRunningDistributionsResult.matchWith({
    Just: ({value}) => {
      t.deepEqual(value.toJS(), []);
    },
    Nothing: () => {
      t.fail();
    }
  });
});

serial('deleteDistributionContract should delete a DistributionContract correctly', async t => {
  await hardDeleteDistributionContracts();
  await createDistributionContract('test1');
  await createDistributionContract('test2');

  await deleteDistributionContractDb('test1');

  const contractsResult = await getDistributionContracts();

  contractsResult.matchWith({
    Just: ({value: contracts}) => {
      t.truthy(contracts.size === 1);
      t.truthy(contracts.find(contract => contract.get('address') === 'test2'));
    }
  });
});

serial('deleteDistributionContract should delete nothing if the distribution contract does not exist', async t => {
  await hardDeleteDistributionContracts();
  await createDistributionContract('test1');
  await createDistributionContract('test2');

  await deleteDistributionContractDb('test3');

  const contractsResult = await getDistributionContracts();

  contractsResult.matchWith({
    Just: ({value: contracts}) => {
      t.truthy(contracts.size === 2);
      t.truthy(contracts.find(contract => contract.get('address') === 'test1'));
      t.truthy(contracts.find(contract => contract.get('address') === 'test2'));
    }
  });
});

serial('storeBatchSignature should save the signature for the specified bathc', async t => {
  const eventResult = await createDistributionEvent();
  const event = eventResult.matchWith({
    Just: maybeValueReturn(v => v.toJS())
  });

  const distributionBatchData = createDistributionBatchData({});
  const createDistributionBatchResult = await createDistributionBatch(
    event.id,
    distributionBatchData
  );

  const createdBatch = createDistributionBatchResult.matchWith({
    Just: maybeValueReturn(v => v.toJS())
  });

  await storeBatchSignature(event.id, createdBatch.id, 'signature', '0x123abc');

  const readEventResult = await readDistributionEvent(event.id);

  const storedEvent = readEventResult.matchWith({
    Just: maybeValueReturn(v => v.toJS())
  });

  t.is(storedEvent.distributionBatches[0].batchSignature, 'signature');
});

serial('readDistributionBatchByAddress should return the distribution batch that contains the address ', async t => {
  const eventResult = await createDistributionEvent();
  const event = eventResult.matchWith({
    Just: maybeValueReturn(v => v.toJS())
  });

  const distributionBatchData = createDistributionBatchData(
    {
      addresses: Array.from({length: 5}).map((_, i) => `test1${i}`),
      balances: Array.from({length: 5}).map((_, i) => `${i}`),
      batchValue: 0
    }
  );
  const distributionBatchData1 = createDistributionBatchData(
    {
      addresses: Array.from({length: 5}).map((_, i) => `test2${i}`),
      balances: Array.from({length: 5}).map((_, i) => `${i}`),
      batchValue: 1
    }
  );

  const createDistributionBatchResult = await createDistributionBatch(
    event.id,
    distributionBatchData
  );
  const createDistributionBatchResult1 = await createDistributionBatch(
    event.id,
    distributionBatchData1
  );

  const distributionBatch = createDistributionBatchResult.matchWith({
    Just: maybeValueReturn(v => v.toJS())
  });
  const distributionBatch1 = createDistributionBatchResult1.matchWith({
    Just: maybeValueReturn(v => v.toJS())
  });

  const readDistributionBatchResult = await readDistributionBatchByAddress(event.id, 'test11');
  await readDistributionBatchResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      const expectedBatch = {
        ...distributionBatch,
        status: 0,
        blockNumber: null,
        input: null,
        addressCount: distributionBatch.addresses.length,
        batchSignature: null,
        txHash: null,
        transactionIndex: null
      };

      t.deepEqual(data, expectedBatch);
    }
  });
});

serial('readDistributionBatchByAddress should return Nothing if the distribution baches does not contain the address', async t => {
  const eventResult = await createDistributionEvent();
  const event = eventResult.matchWith({
    Just: maybeValueReturn(v => v.toJS())
  });
  const readDistributionBatchResult = await readDistributionBatchByAddress(event.id, 'test11');

  t.true(Maybe.Nothing.hasInstance(readDistributionBatchResult));
});

serial('readDistributionBatchByAddress should return Nothing if the distribution event does not exists', async t => {
  const readDistributionBatchResult = await readDistributionBatchByAddress(0, 'test11');

  t.true(Maybe.Nothing.hasInstance(readDistributionBatchResult));
});
