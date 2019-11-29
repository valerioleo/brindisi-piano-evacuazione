const {test, serial} = require('ava');
const {initDB} = require('../../../test/helpers');
const {cleanDb} = require('../testRepository');
const {
  createTransaction,
  updateTransaction,
  updateTransactionsStatusBatch,
  connectTransactionTokenBatch,
  readTransactionAction,
  readTransaction,
  readTransactions
} = require('../transactionsRepository');
const {adaptCreateTransaction} = require('../adapters/transactionsAdapters');
const {createToken} = require('../tokenRepository');
const {
  ignoreProp,
  maybeValueReturn,
  toJS,
  maybeValueGet
} = require('../../../../common/fn');
const {TRANSACTION_STATES} = require('../../../constants');
const {createTokenData} = require('../../../../common-api/test/helpers/token');
const {VALID_ETH_ADDRESS} = require('../../../../common-api/test/helpers/account');

const token1 = createTokenData('1');

test.before(async () => {
  await initDB();
});

test.afterEach.always(async () => {
  await cleanDb();
});

serial('createTransaction should create a new transaction with the provided properties and return it', async t => {
  const properties = {
    from: VALID_ETH_ADDRESS,
    params: {
      address: '0x123',
      value: '0x12333321'
    },
    tags: ['tag1', 'tag2']
  };
  const createTransactionResult = await createTransaction(adaptCreateTransaction(properties));
  const createdTransaction = createTransactionResult.matchWith({
    Just: maybeValueReturn(toJS),
    Nothing: t.fail.bind(t)
  });

  t.deepEqual({
    ...adaptCreateTransaction(properties),
    status: TRANSACTION_STATES.WAITING_FOR_TX_HASH
  },
  ignoreProp('id')(createdTransaction));
});

serial('readTransactions should return an array with all the transactions with the specified status', async t => {
  const transaction1 = {
    txHash: 'txhash1',
    status: TRANSACTION_STATES.WAITING_FOR_TX_HASH,
    createdAt: 1,
    params: {
      address: VALID_ETH_ADDRESS
    }
  };
  const transaction2 = {
    txHash: 'txhash2',
    status: TRANSACTION_STATES.WAITING_FOR_TX_HASH,
    createdAt: 2
  };
  const transaction3 = {
    txHash: 'txhash3',
    status: TRANSACTION_STATES.PENDING,
    createdAt: 3
  };

  await createTransaction(adaptCreateTransaction(transaction1));
  await createTransaction(adaptCreateTransaction(transaction2));
  await createTransaction(adaptCreateTransaction(transaction3));

  const readTransactionsResult = await readTransactions({
    status: TRANSACTION_STATES.WAITING_FOR_TX_HASH
  });
  const transactions = readTransactionsResult.matchWith({
    Just: maybeValueReturn(toJS),
    Nothing: t.fail.bind(t)
  });
  const expectedTransaction1 = {
    ...transaction1,
    params: JSON.stringify(transaction1.params),
    tags: []
  };
  const expectedTransaction2 = {
    ...transaction2,
    tags: []
  };

  t.deepEqual(expectedTransaction2, ignoreProp('id')(transactions[0]));
  t.deepEqual(expectedTransaction1, ignoreProp('id')(transactions[1]));
});

serial('readTransactions should return an empty array if there are no transactions with the specified status', async t => {
  const transaction1 = {
    txHash: 'txhash1',
    status: TRANSACTION_STATES.WAITING_FOR_TX_HASH,
    createdAt: 1
  };
  const transaction2 = {
    txHash: 'txhash2',
    status: TRANSACTION_STATES.WAITING_FOR_TX_HASH,
    createdAt: 2
  };
  const transaction3 = {
    txHash: 'txhash3',
    status: TRANSACTION_STATES.PENDING,
    createdAt: 3
  };

  await createTransaction(transaction1);
  await createTransaction(transaction2);
  await createTransaction(transaction3);

  const readTransactionsResult = await readTransactions({status: TRANSACTION_STATES.CONFIRMED});
  const transactions = readTransactionsResult.matchWith({
    Just: maybeValueReturn(toJS),
    Nothing: t.fail.bind(t)
  });

  t.deepEqual(transactions, []);
});

serial('readTransaction should return Maybe.Nothing() if the transaction with the specified txHash does not exist', async t => {
  const transaction1 = {
    txHash: 'txhash1',
    status: TRANSACTION_STATES.WAITING_FOR_TX_HASH,
    createdAt: 1
  };
  const transaction2 = {
    txHash: 'txhash2',
    status: TRANSACTION_STATES.WAITING_FOR_TX_HASH,
    createdAt: 2
  };

  await createTransaction(transaction1);
  await createTransaction(transaction2);

  const readTransactionResult = await readTransaction({txHash: 'nonexistent'});
  readTransactionResult.matchWith({
    Just: t.fail.bind(t),
    Nothing: t.pass.bind(t)
  });
});

serial('readTransaction should return the transaction with the specified txHash', async t => {
  const transaction1 = {
    txHash: 'txhash1',
    status: TRANSACTION_STATES.WAITING_FOR_TX_HASH,
    createdAt: 1
  };
  const transaction2 = {
    txHash: 'txhash2',
    status: TRANSACTION_STATES.WAITING_FOR_TX_HASH,
    createdAt: 2
  };

  await createTransaction(transaction1);
  await createTransaction(transaction2);

  const readTransactionByTxHashResult = await readTransactions({txHash: transaction1.txHash});
  const returnedTransaction = readTransactionByTxHashResult.matchWith({
    Just: maybeValueReturn(toJS),
    Nothing: t.fail.bind(t)
  });
  const expectedTransaction = {
    txHash: 'txhash1',
    status: TRANSACTION_STATES.WAITING_FOR_TX_HASH,
    createdAt: 1,
    tags: []
  };

  t.deepEqual(expectedTransaction, ignoreProp('id')(returnedTransaction[0]));
});

serial('updateTransaction should update the provided transaction properties', async t => {
  const properties = {
    txHash: 'txhash',
    prop1: 'prop1',
    prop2: 'prop2'
  };
  const createTransactionResult = await createTransaction(properties);
  const createdTransactionId = createTransactionResult.matchWith({
    Just: maybeValueGet('id'),
    Nothing: t.fail.bind(t)
  });
  const update = {
    status: TRANSACTION_STATES.PENDING,
    prop1: 'prop1update'
  };

  await updateTransaction(createdTransactionId, update);

  const readTransactionResult = await readTransaction({id: createdTransactionId});
  const transaction = readTransactionResult.matchWith({
    Just: maybeValueReturn(toJS),
    Nothing: t.fail.bind(t)
  });
  const expectedTransaction = {
    txHash: 'txhash',
    prop1: 'prop1update',
    prop2: 'prop2',
    tags: [],
    status: TRANSACTION_STATES.PENDING
  };

  t.deepEqual(expectedTransaction, ignoreProp('id')(transaction));
});

serial('updateTransactionStatusBatch should update the status of the provided transactions', async t => {
  const transaction1 = {
    txHash: 'txhash1',
    status: TRANSACTION_STATES.WAITING_FOR_TX_HASH,
    createdAt: 1
  };
  const transaction2 = {
    txHash: 'txhash2',
    status: TRANSACTION_STATES.WAITING_FOR_TX_HASH,
    createdAt: 2
  };
  const transaction3 = {
    txHash: 'txhash3',
    status: TRANSACTION_STATES.PENDING,
    createdAt: 3
  };
  const createTransactionResult1 = await createTransaction(transaction1);
  const createTransactionResult2 = await createTransaction(transaction2);
  await createTransaction(transaction3);

  const createdTransactionId1 = createTransactionResult1.matchWith({
    Just: maybeValueGet('id'),
    Nothing: t.fail.bind(t)
  });
  const createdTransactionId2 = createTransactionResult2.matchWith({
    Just: maybeValueGet('id'),
    Nothing: t.fail.bind(t)
  });

  await updateTransactionsStatusBatch(
    [{id: createdTransactionId1}, {id: createdTransactionId2}],
    TRANSACTION_STATES.CONFIRMED
  );

  const expectedTransaction1 = {
    txHash: 'txhash1',
    status: TRANSACTION_STATES.CONFIRMED,
    createdAt: 1,
    tags: []
  };
  const expectedTransaction2 = {
    txHash: 'txhash2',
    status: TRANSACTION_STATES.CONFIRMED,
    createdAt: 2,
    tags: []
  };
  const readTransactionResult1 = await readTransaction({id: createdTransactionId1});
  const readTransaction1 = readTransactionResult1.matchWith({
    Just: maybeValueReturn(toJS),
    Nothing: t.fail.bind(t)
  });
  const readTransactionResult2 = await readTransaction({id: createdTransactionId2});
  const readTransaction2 = readTransactionResult2.matchWith({
    Just: maybeValueReturn(toJS),
    Nothing: t.fail.bind(t)
  });

  t.deepEqual(expectedTransaction1, ignoreProp('id')(readTransaction1));
  t.deepEqual(expectedTransaction2, ignoreProp('id')(readTransaction2));
});

serial('connectTransactionTokenBatch should connect the specified transaction with the specified token node', async t => {
  const createTokenResult = await createToken(...Object.values(token1));
  const createdTokenAddress = createTokenResult.matchWith({
    Just: maybeValueGet('address'),
    Nothing: t.fail.bind(t)
  });

  const properties = {
    txHash: 'txhash',
    prop1: 'prop1',
    prop2: 'prop2'
  };
  const createTransactionResult = await createTransaction(properties);
  const createdTransactionId = createTransactionResult.matchWith({
    Just: maybeValueGet('id'),
    Nothing: t.fail.bind(t)
  });

  await connectTransactionTokenBatch([
    {
      transactionId: createdTransactionId,
      tokenAddress: createdTokenAddress
    }
  ]);

  const readTransactionActionResult = await readTransactionAction(createdTransactionId);
  const transactionAction = readTransactionActionResult.matchWith({
    Just: maybeValueReturn(toJS),
    Nothing: t.fail.bind(t)
  });

  const expectedTransaction = {
    txHash: 'txhash',
    prop1: 'prop1',
    prop2: 'prop2',
    tags: [],
    status: TRANSACTION_STATES.WAITING_FOR_TX_HASH
  };
  const expectedAction = {
    address: token1.tokenAddress,
    name: token1.name,
    symbol: token1.symbol,
    softDeleted: false,
    tclControllerAddress: token1.tclController,
    tclRepositoryAddress: token1.tclRepository,
    interface: token1.tokenInterface,
    blockHeight: token1.blockHeight
  };

  t.deepEqual(expectedTransaction, ignoreProp('id')(transactionAction.transaction));
  t.deepEqual(expectedAction, ignoreProp('id')(transactionAction.triggered));
});
