const {test, serial} = require('ava');
const {initDB} = require('../../../test/helpers');
const {ignoreProp} = require('../../../fn');
const {Currencies} = require('../../constants');
const {
  createBtcDeposit,
  createEthDeposit,
  createFiatDeposit
} = require('../../../../common-api/test/helpers/deposit');
const {
  createExtendedUser,
  deleteAccount,
  getIndexedEthAddress,
  getIndexedUserId
} = require('../../../../common-api/test/helpers/account');
const {
  saveBatchFiatDeposit,
  saveBatchEthDeposit,
  saveBatchBtcDeposit,
  readEthDeposits,
  readBtcDeposits,
  readFiatDeposits,
  readDeposits,
  readBtcDepositsTotal,
  readEthDepositsTotal,
  readFiatDepositsTotal,
  readDepositsForCurrencies,
  readRawDeposits
} = require('../depositRepository');
const {cleanDb} = require('../testRepository');

test.before(async () => {
  await initDB();
});

test.beforeEach(async t => {
  const {account} = await createExtendedUser(getIndexedUserId(1), getIndexedEthAddress(1), getIndexedEthAddress(1), 1);
  const {account: account2} = await createExtendedUser(getIndexedUserId(2), getIndexedEthAddress(2), getIndexedEthAddress(2), 2);
  const {account: account3} = await createExtendedUser(getIndexedUserId(3), getIndexedEthAddress(3), getIndexedEthAddress(3), 3);

  account.matchWith({
    Just: ({value}) => t.context.btcAddress1 = value.get('btcAddress')
  });

  account2.matchWith({
    Just: ({value}) => t.context.btcAddress2 = value.get('btcAddress')
  });

  account3.matchWith({
    Just: ({value}) => t.context.btcAddress3 = value.get('btcAddress')
  });
});

test.afterEach.always(async () => {
  await cleanDb();
});

const saveMultipleFiatDeposits = async t => {
  t.context.fiatDeposit1 = createFiatDeposit(100);
  t.context.fiatDeposit2 = createFiatDeposit(200);
  t.context.fiatDeposit3 = createFiatDeposit(300);

  const deposit1 = {...t.context.fiatDeposit1, userId: getIndexedUserId(1)};
  const deposit2 = {...t.context.fiatDeposit2, userId: getIndexedUserId(2)};
  const deposit3 = {...t.context.fiatDeposit3, userId: getIndexedUserId(3)};

  return await saveBatchFiatDeposit([deposit1, deposit2, deposit3]);
};

const saveMultipleEthDeposits = async t => {
  t.context.ethDeposit1 = createEthDeposit(100);
  t.context.ethDeposit2 = createEthDeposit(200);
  t.context.ethDeposit3 = createEthDeposit(300);

  const deposit1 = {...t.context.ethDeposit1, beneficiary: getIndexedEthAddress(1)};
  const deposit2 = {...t.context.ethDeposit2, beneficiary: getIndexedEthAddress(2)};
  const deposit3 = {...t.context.ethDeposit3, beneficiary: getIndexedEthAddress(3)};

  return await saveBatchEthDeposit([deposit1, deposit2, deposit3]);
};

const saveMultipleBtcDeposits = async t => {
  t.context.btcDeposit1 = createBtcDeposit(100);
  t.context.btcDeposit2 = createBtcDeposit(200);
  t.context.btcDeposit3 = createBtcDeposit(300);

  const deposit1 = {...t.context.btcDeposit1, userId: getIndexedUserId(1), address: t.context.btcAddress1};
  const deposit2 = {...t.context.btcDeposit2, userId: getIndexedUserId(2), address: t.context.btcAddress2};
  const deposit3 = {...t.context.btcDeposit3, userId: getIndexedUserId(3), address: t.context.btcAddress3};

  return await saveBatchBtcDeposit([deposit1, deposit2, deposit3]);
};

serial('saveBatchFiatDeposit should save all fiat deposits', async t => {
  await saveMultipleFiatDeposits(t);
  const result = await readDeposits();
  const {
    [Currencies.BTC]: btc,
    [Currencies.FIAT]: fiat,
    [Currencies.Ether]: eth
  } = result.unsafeGet().toJS();

  t.is(eth.length, 0);
  t.is(fiat.length, 3);
  t.is(btc.length, 0);

  t.deepEqual(ignoreProp('createdAt')(fiat[0]), {...t.context.fiatDeposit3, userId: getIndexedUserId(3)});
  t.deepEqual(ignoreProp('createdAt')(fiat[1]), {...t.context.fiatDeposit2, userId: getIndexedUserId(2)});
  t.deepEqual(ignoreProp('createdAt')(fiat[2]), {...t.context.fiatDeposit1, userId: getIndexedUserId(1)});
});

serial('saveBatchFiatDeposit should return all fiat deposits', async t => {
  const depositsResult = await saveMultipleFiatDeposits(t);

  depositsResult.matchWith({
    Just: ({value}) => {
      const deposits = value.toJS();

      t.deepEqual(ignoreProp('createdAt')(deposits[0]), {...t.context.fiatDeposit1, userId: getIndexedUserId(1)});
      t.deepEqual(ignoreProp('createdAt')(deposits[1]), {...t.context.fiatDeposit2, userId: getIndexedUserId(2)});
      t.deepEqual(ignoreProp('createdAt')(deposits[2]), {...t.context.fiatDeposit3, userId: getIndexedUserId(3)});
    }
  });
});

serial('saveBatchEthDeposit should save all eth deposits', async t => {
  await saveMultipleEthDeposits(t);
  const result = await readDeposits();
  const {
    [Currencies.BTC]: btc,
    [Currencies.FIAT]: fiat,
    [Currencies.Ether]: eth
  } = result.unsafeGet().toJS();

  t.is(eth.length, 3);
  t.is(fiat.length, 0);
  t.is(btc.length, 0);

  t.deepEqual(ignoreProp('createdAt')(eth[0]), {...t.context.ethDeposit3, userId: getIndexedUserId(3)});
  t.deepEqual(ignoreProp('createdAt')(eth[1]), {...t.context.ethDeposit2, userId: getIndexedUserId(2)});
  t.deepEqual(ignoreProp('createdAt')(eth[2]), {...t.context.ethDeposit1, userId: getIndexedUserId(1)});
});

serial('saveBatchEthDeposit should return all eth deposits', async t => {
  const depositsResult = await saveMultipleEthDeposits(t);

  depositsResult.matchWith({
    Just: ({value}) => {
      const deposits = value.toJS();

      t.deepEqual(ignoreProp('createdAt')(deposits[0]), {...t.context.ethDeposit1, userId: getIndexedUserId(1)});
      t.deepEqual(ignoreProp('createdAt')(deposits[1]), {...t.context.ethDeposit2, userId: getIndexedUserId(2)});
      t.deepEqual(ignoreProp('createdAt')(deposits[2]), {...t.context.ethDeposit3, userId: getIndexedUserId(3)});
    }
  });
});

serial('saveBatchBtcDeposit should save all btc deposits', async t => {
  await saveMultipleBtcDeposits(t);
  const result = await readDeposits();
  const {
    [Currencies.BTC]: btc,
    [Currencies.FIAT]: fiat,
    [Currencies.Ether]: eth
  } = result.unsafeGet().toJS();

  t.is(eth.length, 0);
  t.is(fiat.length, 0);
  t.is(btc.length, 3);

  t.deepEqual(ignoreProp('createdAt')(btc[0]), {...t.context.btcDeposit3, userId: getIndexedUserId(3)});
  t.deepEqual(ignoreProp('createdAt')(btc[1]), {...t.context.btcDeposit2, userId: getIndexedUserId(2)});
  t.deepEqual(ignoreProp('createdAt')(btc[2]), {...t.context.btcDeposit1, userId: getIndexedUserId(1)});
});

serial('saveBatchBtcDeposit should save update the deposit status', async t => {
  await saveMultipleBtcDeposits(t);

  const btcDeposit2 = createBtcDeposit(200, 'updated');
  const deposit2 = {...btcDeposit2, address: t.context.btcAddress2};
  await saveBatchBtcDeposit([deposit2]);

  const result = await readDeposits();
  const {
    [Currencies.BTC]: btc,
    [Currencies.FIAT]: fiat,
    [Currencies.Ether]: eth
  } = result.unsafeGet().toJS();

  t.is(eth.length, 0);
  t.is(fiat.length, 0);
  t.is(btc.length, 3);

  t.is(btc[1].status, 'updated');
});

serial('saveBatchBtcDeposit should return all btc deposits', async t => {
  const depositsResult = await saveMultipleBtcDeposits(t);

  depositsResult.matchWith({
    Just: ({value}) => {
      const deposits = value.toJS();

      t.deepEqual(ignoreProp('createdAt')(deposits[0]), {...t.context.btcDeposit1, userId: getIndexedUserId(1)});
      t.deepEqual(ignoreProp('createdAt')(deposits[1]), {...t.context.btcDeposit2, userId: getIndexedUserId(2)});
      t.deepEqual(ignoreProp('createdAt')(deposits[2]), {...t.context.btcDeposit3, userId: getIndexedUserId(3)});
    }
  });
});

serial('readEthDeposits should return all the eth deposits', async t => {
  await saveMultipleEthDeposits(t);
  const depositsResult = await readEthDeposits();

  depositsResult.matchWith({
    Just: ({value}) => {
      const deposits = value.toJS();

      t.deepEqual(ignoreProp('createdAt')(deposits[2]), {...t.context.ethDeposit1, userId: getIndexedUserId(1)});
      t.deepEqual(ignoreProp('createdAt')(deposits[1]), {...t.context.ethDeposit2, userId: getIndexedUserId(2)});
      t.deepEqual(ignoreProp('createdAt')(deposits[0]), {...t.context.ethDeposit3, userId: getIndexedUserId(3)});
    },
    Nothing: () => {
      t.fails();
    }
  });
});

serial('readEthDeposits should only return the eth deposits', async t => {
  await saveMultipleEthDeposits(t);
  await saveMultipleBtcDeposits(t);
  await saveMultipleFiatDeposits(t);
  const depositsResult = await readEthDeposits();

  depositsResult.matchWith({
    Just: ({value}) => {
      const deposits = value.toJS();

      t.is(deposits[2].currency, Currencies.Ether);
      t.is(deposits[1].currency, Currencies.Ether);
      t.is(deposits[0].currency, Currencies.Ether);
      t.is(deposits.length, 3);
    },
    Nothing: () => {
      t.fails();
    }
  });
});

serial('readBtcDeposits should return all the btc deposits', async t => {
  await saveMultipleBtcDeposits(t);
  const depositsResult = await readBtcDeposits();

  depositsResult.matchWith({
    Just: ({value}) => {
      const deposits = value.toJS();

      t.deepEqual(ignoreProp('createdAt')(deposits[2]), {...t.context.btcDeposit1, userId: getIndexedUserId(1)});
      t.deepEqual(ignoreProp('createdAt')(deposits[1]), {...t.context.btcDeposit2, userId: getIndexedUserId(2)});
      t.deepEqual(ignoreProp('createdAt')(deposits[0]), {...t.context.btcDeposit3, userId: getIndexedUserId(3)});
    },
    Nothing: () => {
      t.fails();
    }
  });
});

serial('readBtcDeposits should only return the btc deposits', async t => {
  await saveMultipleEthDeposits(t);
  await saveMultipleBtcDeposits(t);
  await saveMultipleFiatDeposits(t);
  const depositsResult = await readBtcDeposits();

  depositsResult.matchWith({
    Just: ({value}) => {
      const deposits = value.toJS();

      t.is(deposits[2].currency, Currencies.BTC);
      t.is(deposits[1].currency, Currencies.BTC);
      t.is(deposits[0].currency, Currencies.BTC);
      t.is(deposits.length, 3);
    },
    Nothing: () => {
      t.fails();
    }
  });
});

serial('readFiatDeposits should return all the fiat deposits', async t => {
  await saveMultipleFiatDeposits(t);
  const depositsResult = await readFiatDeposits();

  depositsResult.matchWith({
    Just: ({value}) => {
      const deposits = value.toJS();

      t.deepEqual(ignoreProp('createdAt')(deposits[2]), {...t.context.fiatDeposit1, userId: getIndexedUserId(1)});
      t.deepEqual(ignoreProp('createdAt')(deposits[1]), {...t.context.fiatDeposit2, userId: getIndexedUserId(2)});
      t.deepEqual(ignoreProp('createdAt')(deposits[0]), {...t.context.fiatDeposit3, userId: getIndexedUserId(3)});
    },
    Nothing: () => {
      t.fails();
    }
  });
});

serial('readFiatDeposits should only return the fiat deposits', async t => {
  await saveMultipleEthDeposits(t);
  await saveMultipleBtcDeposits(t);
  await saveMultipleFiatDeposits(t);
  const depositsResult = await readFiatDeposits();

  depositsResult.matchWith({
    Just: ({value}) => {
      const deposits = value.toJS();

      t.is(deposits[2].currency, Currencies.FIAT);
      t.is(deposits[1].currency, Currencies.FIAT);
      t.is(deposits[0].currency, Currencies.FIAT);
      t.is(deposits.length, 3);
    },
    Nothing: () => {
      t.fails();
    }
  });
});

serial('readDeposits should return all the deposits', async t => {
  await saveMultipleEthDeposits(t);
  await saveMultipleBtcDeposits(t);
  await saveMultipleFiatDeposits(t);
  const depositsResult = await readDeposits();

  depositsResult.matchWith({
    Just: ({value}) => {
      const deposits = value.toJS();

      t.deepEqual(ignoreProp('createdAt')(deposits[Currencies.Ether][2]), {...t.context.ethDeposit1, userId: getIndexedUserId(1)});
      t.deepEqual(ignoreProp('createdAt')(deposits[Currencies.Ether][1]), {...t.context.ethDeposit2, userId: getIndexedUserId(2)});
      t.deepEqual(ignoreProp('createdAt')(deposits[Currencies.Ether][0]), {...t.context.ethDeposit3, userId: getIndexedUserId(3)});
      t.deepEqual(ignoreProp('createdAt')(deposits[Currencies.BTC][2]), {...t.context.btcDeposit1, userId: getIndexedUserId(1)});
      t.deepEqual(ignoreProp('createdAt')(deposits[Currencies.BTC][1]), {...t.context.btcDeposit2, userId: getIndexedUserId(2)});
      t.deepEqual(ignoreProp('createdAt')(deposits[Currencies.BTC][0]), {...t.context.btcDeposit3, userId: getIndexedUserId(3)});
      t.deepEqual(ignoreProp('createdAt')(deposits[Currencies.FIAT][2]), {...t.context.fiatDeposit1, userId: getIndexedUserId(1)});
      t.deepEqual(ignoreProp('createdAt')(deposits[Currencies.FIAT][1]), {...t.context.fiatDeposit2, userId: getIndexedUserId(2)});
      t.deepEqual(ignoreProp('createdAt')(deposits[Currencies.FIAT][0]), {...t.context.fiatDeposit3, userId: getIndexedUserId(3)});
    }
  });
});

serial('readEthDepositsTotal should return the eth deposits total', async t => {
  await saveMultipleEthDeposits(t);
  const depositsResult = await readEthDepositsTotal();

  depositsResult.matchWith({
    Just: ({value}) => {
      t.deepEqual(value.get('total'), 600);
    },
    Nothing: () => {
      t.fails();
    }
  });
});

serial('readBtcDepositsTotal should return the btc deposits total', async t => {
  await saveMultipleBtcDeposits(t);
  const depositsResult = await readBtcDepositsTotal();

  depositsResult.matchWith({
    Just: ({value}) => {
      t.deepEqual(value.get('total'), 600);
    },
    Nothing: () => {
      t.fails();
    }
  });
});

serial('readFiatDepositsTotal should return the fiat deposits total', async t => {
  await saveMultipleFiatDeposits(t);
  const depositsResult = await readFiatDepositsTotal();

  depositsResult.matchWith({
    Just: ({value}) => {
      t.deepEqual(value.get('total'), 600);
    },
    Nothing: () => {
      t.fails();
    }
  });
});

serial('readDepositsForCurrencies should only return the deposits with the requested currencies', async t => {
  await saveMultipleEthDeposits(t);
  await saveMultipleBtcDeposits(t);
  await saveMultipleFiatDeposits(t);

  const btcDepositsResult = await readDepositsForCurrencies([Currencies.BTC], {skip: 0, limit: 10});
  const fiatDepositsResult = await readDepositsForCurrencies([Currencies.FIAT], {skip: 0, limit: 10});

  btcDepositsResult.matchWith({
    Just: ({value}) => {
      const {deposits, count} = value.toJS();

      t.is(count, 3);
      t.is(deposits[2].currency, Currencies.BTC);
      t.is(deposits[1].currency, Currencies.BTC);
      t.is(deposits[0].currency, Currencies.BTC);
    },
    Nothing: () => {
      t.fails();
    }
  });

  fiatDepositsResult.matchWith({
    Just: ({value}) => {
      const {deposits, count} = value.toJS();

      t.is(count, 3);
      t.is(deposits[2].currency, Currencies.FIAT);
      t.is(deposits[1].currency, Currencies.FIAT);
      t.is(deposits[0].currency, Currencies.FIAT);
    },
    Nothing: () => {
      t.fails();
    }
  });
});

serial('readDepositsForCurrencies should return the deposits within the requested limit', async t => {
  await saveMultipleEthDeposits(t);
  await saveMultipleBtcDeposits(t);
  await saveMultipleFiatDeposits(t);

  const depositsResult = await readDepositsForCurrencies(
    [Currencies.BTC, Currencies.FIAT, Currencies.Ether],
    {skip: 0, limit: 5}
  );

  depositsResult.matchWith({
    Just: ({value}) => {
      const {deposits, count} = value.toJS();

      t.is(count, 9);
      t.is(deposits.length, 5);
    },
    Nothing: () => {
      t.fails();
    }
  });
});

serial('readRawDeposits should return the deposits within the requested limit', async t => {
  await saveMultipleEthDeposits(t);
  await saveMultipleBtcDeposits(t);
  await saveMultipleFiatDeposits(t);
  const userId = getIndexedUserId(1);
  const depositsResult = await readRawDeposits(userId, {skip: 0, limit: 10});

  depositsResult.matchWith({
    Just: ({value}) => {
      const {deposits, count} = value.toJS();

      t.is(count, 3);
      t.is(deposits.length, 3);
      t.true(deposits.every(d => d.userId === userId));
    },
    Nothing: () => {
      t.fails();
    }
  });
});
