const {test, serial} = require('ava');
const matchesProperty = require('lodash.matchesproperty');
const {from} = require('rxjs');
const {concatMap} = require('rxjs/operators');
const {initDB} = require('../../../test/helpers');
const {
  getTransfers,
  getTokenHolders,
  getTokenHoldersTillDate,
  getTokenHolderLastTransferOnDate
} = require('../reportingModuleRepository');
const {
  ignoreProps,
  ignoreProp,
  maybeValueReturn,
  toJS
} = require('../../../../common/fn');
const {createTokenData} = require('../../../../common-api/test/helpers/token');
const {createNTransfers, getTotalTranferred} = require('../../../../common-api/test/helpers/transfer');
const {cleanDb} = require('../testRepository');
const {createTokenTransfer, updateTokenHolderData, createTokenBatch} = require('../tokenRepository');
const {ZERO_ADDRESS} = require('../../../../eth-utils/data/v1/address');

const token1 = createTokenData('1');

test.before(async () => {
  await initDB();
});

test.afterEach.always(async () => {
  await cleanDb();
});

serial('getTransfers should return the transfers for a token between tow dates', async t => {
  const transfers = createNTransfers(10, {to: '0x456', tokenAddress: token1.tokenAddress});

  await createTokenBatch([token1]);
  await from(transfers)
    .pipe(
      concatMap(async transfer => {
        await createTokenTransfer(transfer);
      })
    ).toPromise();

  const expectedTransfers = transfers
    .map(t => ({
      size: t.amount,
      createdAt: t.timestamp,
      ...ignoreProps(['address', 'amount', 'timestamp'])(t)
    })).filter(t => t.createdAt > 3 && t.createdAt <= 8);

  const transfersAsyncResult = await getTransfers({tokenAddress: token1.tokenAddress, fromDate: 4, toDate: 8});

  const transfersResult = transfersAsyncResult.matchWith({
    Just: maybeValueReturn(toJS),
    Nothing: () => t.fail()
  });

  const filteredResult = transfersResult.map(t => ignoreProp('id')(t));

  t.is(transfersResult.length, 5);
  t.deepEqual(expectedTransfers.reverse(), filteredResult);
});

serial('getTransfers should return empty array if there are no transfers between tow dates', async t => {
  const transfers = createNTransfers(10, {to: '0x456', tokenAddress: token1.tokenAddress});

  await createTokenBatch([token1]);
  await from(transfers)
    .pipe(
      concatMap(async transfer => {
        await createTokenTransfer(transfer);
      })
    ).toPromise();

  const transfersAsyncResult = await getTransfers({tokenAddress: token1.tokenAddress, fromDate: 30, toDate: 80});

  const transfersResult = transfersAsyncResult.matchWith({
    Just: maybeValueReturn(toJS),
    Nothing: t.fail.bind(t)
  });
  t.deepEqual(transfersResult, []);
});

serial('getTokenHolders should return the top n holders for the token', async t => {
  const transfers1 = createNTransfers(15, {to: '0x456', tokenAddress: token1.tokenAddress});
  const totalTransferred1 = getTotalTranferred(transfers1);

  const transfers2 = createNTransfers(13, {to: '0x333', tokenAddress: token1.tokenAddress});
  const totalTransferred2 = getTotalTranferred(transfers2);

  const transfers3 = createNTransfers(12, {to: '0x123', tokenAddress: token1.tokenAddress});
  const totalTransferred3 = getTotalTranferred(transfers3);

  await createTokenBatch([token1]);

  await from([...transfers1, ...transfers2, ...transfers3])
    .pipe(
      concatMap(async transfer => {
        await createTokenTransfer(transfer);
        await updateTokenHolderData(transfer);
      })
    ).toPromise();

  const holdersAsyncResult = await getTokenHolders(token1.tokenAddress, 2);

  const expectedResult = [
    {
      address: '0x456',
      balance: totalTransferred1
    },
    {
      address: '0x333',
      balance: totalTransferred2
    }
  ];

  const holdersResult = holdersAsyncResult.matchWith({
    Just: maybeValueReturn(toJS),
    Nothing: () => t.fail()
  });

  const filteredResult = holdersResult.map(t => ignoreProp('id')(t));

  t.is(holdersResult.length, 2);
  t.deepEqual(expectedResult, filteredResult);
});

serial('getTransfers should return the transfers between tow accounts', async t => {
  const transfers1 = createNTransfers(15, {to: '0x456', tokenAddress: token1.tokenAddress});
  const transfers2 = createNTransfers(13, {to: '0x333', tokenAddress: token1.tokenAddress});

  await createTokenBatch([token1]);

  await from([...transfers1, ...transfers2])
    .pipe(
      concatMap(async transfer => {
        await createTokenTransfer(transfer);
        await updateTokenHolderData(transfer);
      })
    ).toPromise();

  const expectedTransfers = transfers1
    .map(t => ({
      size: t.amount,
      createdAt: t.timestamp,
      ...ignoreProps(['address', 'amount', 'timestamp'])(t)
    }));

  const transfersAsyncResult = await getTransfers(
    {
      tokenAddress: token1.tokenAddress,
      senders: [ZERO_ADDRESS, '0x456'],
      receivers: [ZERO_ADDRESS, '0x456']
    }
  );

  const transfersResult = transfersAsyncResult.matchWith({
    Just: maybeValueReturn(toJS),
    Nothing: () => t.fail()
  });

  const filteredResult = transfersResult.map(t => ignoreProp('id')(t));
  t.is(transfersResult.length, 15);
  t.deepEqual(expectedTransfers.reverse(), filteredResult);
});

serial('getTransfers should return empty array if there are no transfers between tow accounts', async t => {
  const transfers1 = createNTransfers(15, {to: '0x456', tokenAddress: token1.tokenAddress});
  const transfers2 = createNTransfers(13, {to: '0x333', tokenAddress: token1.tokenAddress});

  await createTokenBatch([token1]);

  await from([...transfers1, ...transfers2])
    .pipe(
      concatMap(async transfer => {
        await createTokenTransfer(transfer);
        await updateTokenHolderData(transfer);
      })
    ).toPromise();

  const transfersAsyncResult = await getTransfers(
    {
      tokenAddress: token1.tokenAddress,
      senders: ['0x333', '0x456'],
      receivers: ['0x333', '0x456']
    }
  );

  const transfers = transfersAsyncResult.matchWith({
    Just: maybeValueReturn(toJS),
    Nothing: t.fail.bind(t)
  });
  t.deepEqual(transfers, []);
});

serial('getTokenHoldersTillDate should return all the holders until a specific date', async t => {
  const transfers1 = createNTransfers(15, {to: '0x456', tokenAddress: token1.tokenAddress});
  const transfers2 = createNTransfers(12, {to: '0x333', tokenAddress: token1.tokenAddress, timestamp: 15});
  const transfers3 = createNTransfers(10, {to: '0x123', tokenAddress: token1.tokenAddress, timestamp: 30});

  await createTokenBatch([token1]);

  await from([...transfers1, ...transfers2, ...transfers3])
    .pipe(
      concatMap(async transfer => {
        await createTokenTransfer(transfer);
        await updateTokenHolderData(transfer);
      })
    ).toPromise();

  const holdersAsyncResult = await getTokenHoldersTillDate(token1.tokenAddress, 20);
  const expectedResult = [ZERO_ADDRESS, '0x456', '0x333'];

  const holdersResult = holdersAsyncResult.matchWith({
    Just: maybeValueReturn(toJS),
    Nothing: () => t.fail()
  });

  t.is(holdersResult.length, expectedResult.length);
  expectedResult.forEach(holder => {
    t.true(holdersResult.includes(holder));
  });
});

serial('getTokenHoldersTillDate should return empty array if there are no holders until a specific date', async t => {
  const holdersAsyncResult = await getTokenHoldersTillDate(token1.tokenAddress, 20);

  const holders = holdersAsyncResult.matchWith({
    Just: maybeValueReturn(toJS),
    Nothing: t.fail.bind(t)
  });
  t.deepEqual(holders, []);
});

serial('getTokenHolderLastTransferOnDate should return the last transfer of holder till date', async t => {
  const transfers1 = createNTransfers(15, {to: '0x456', tokenAddress: token1.tokenAddress});
  const transfers2 = createNTransfers(13, {to: '0x333', tokenAddress: token1.tokenAddress});

  await createTokenBatch([token1]);

  await from([...transfers1, ...transfers2])
    .pipe(
      concatMap(async transfer => {
        await createTokenTransfer(transfer);
        await updateTokenHolderData(transfer);
      })
    ).toPromise();

  const expectedTransfers = transfers1
    .map(t => ({
      size: t.amount,
      createdAt: t.timestamp,
      ...ignoreProps(['address', 'amount', 'timestamp'])(t)
    }));

  const transfersAsyncResult = await getTokenHolderLastTransferOnDate(token1.tokenAddress, '0x456', 10);

  const transfersResult = transfersAsyncResult.matchWith({
    Just: maybeValueReturn(toJS),
    Nothing: () => t.fail()
  });

  t.deepEqual(expectedTransfers[10], transfersResult);
});

serial('getTokenHolderLastTransferOnDate should return nothing if there is no transfer of holder till date', async t => {
  const transfers1 = createNTransfers(15, {to: '0x456', tokenAddress: token1.tokenAddress});
  const transfers2 = createNTransfers(13, {to: '0x333', tokenAddress: token1.tokenAddress});

  await createTokenBatch([token1]);

  await from([...transfers1, ...transfers2])
    .pipe(
      concatMap(async transfer => {
        await createTokenTransfer(transfer);
        await updateTokenHolderData(transfer);
      })
    ).toPromise();

  const transfersAsyncResult = await getTokenHolderLastTransferOnDate(token1.tokenAddress, '0x111', 10);

  transfersAsyncResult.matchWith({
    Just: () => t.fail(),
    Nothing: () => t.pass()
  });
});
