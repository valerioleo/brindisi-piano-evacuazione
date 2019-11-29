const {test, serial} = require('ava');
const {toSatoshi} = require('../../../../bitcoin-utils/format');
const {toWei} = require('../../../../eth-utils/core/v1/index');
const {initDB} = require('../../../test/helpers');
const {ignoreProp} = require('../../../fn');
const {Currencies} = require('../../constants');
const {SettlementStatuses} = require('../../constants');
const {
  createBtcContribution,
  createEthContribution,
  createFiatContribution,
  createFiatFialure
} = require('../../../../common-api/test/helpers/contribution');
const {
  createExtendedUser,
  getIndexedEthAddress,
  getIndexedUserId
} = require('../../../../common-api/test/helpers/account');
const {getSizeForTokenSum} = require('../../../../microservices/test/helpers/params');
const {
  loadContributions,
  saveBatchBtcContribution,
  saveBatchEthContribution,
  saveBatchFiatContribution,
  saveFiatContribution,
  setManualContributionStatus,
  saveFiatFailure,
  loadFiatFailures,
  loadFiatFailure,
  deleteFiatFailure,
  readContributions,
  readOrphanContributions,
  readAllBtcContributions,
  readAllEthContributions,
  readTokensAndBonus,
  readContributionTotals
} = require('../contributionRepository');
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

const saveMultipleBtcContributions = async t => {
  t.context.btcContrib1 = createBtcContribution(100, 'pending');
  t.context.btcContrib2 = createBtcContribution(200, 'confirmed');
  t.context.btcContrib3 = createBtcContribution(300, 'confirmed');

  const contrib1 = {...t.context.btcContrib1, address: t.context.btcAddress1};
  const contrib2 = {...t.context.btcContrib2, address: t.context.btcAddress2};
  const contrib3 = {...t.context.btcContrib3, address: t.context.btcAddress3};

  return await saveBatchBtcContribution([contrib1, contrib2, contrib3]);
};

const saveMultipleEthContributions = async t => {
  t.context.ethContrib1 = createEthContribution(100);
  t.context.ethContrib2 = createEthContribution(200);
  t.context.ethContrib3 = createEthContribution(300);

  const contrib1 = {...t.context.ethContrib1, beneficiary: getIndexedEthAddress(1)};
  const contrib2 = {...t.context.ethContrib2, beneficiary: getIndexedEthAddress(2)};
  const contrib3 = {...t.context.ethContrib3, beneficiary: getIndexedEthAddress(3)};

  return await saveBatchEthContribution([contrib1, contrib2, contrib3]);
};

const saveMultipleStablecoinContributions = async t => {
  t.context.daiContrib1 = createEthContribution(100, Currencies.DAI);
  t.context.trueUsdContrib1 = createEthContribution(200, Currencies['True USD']);
  t.context.gUsdContrib1 = createEthContribution(300, Currencies['Gemini USD']);

  const contrib1 = {...t.context.daiContrib1, beneficiary: getIndexedEthAddress(1)};
  const contrib2 = {...t.context.trueUsdContrib1, beneficiary: getIndexedEthAddress(2)};
  const contrib3 = {...t.context.gUsdContrib1, beneficiary: getIndexedEthAddress(3)};

  return await saveBatchEthContribution([contrib1, contrib2, contrib3]);
};

const saveMultipleFiatContributions = async t => {
  t.context.fiatContribution1 = createFiatContribution(100);
  t.context.fiatContribution2 = createFiatContribution(200);
  t.context.fiatContribution3 = createFiatContribution(300);

  const contrib1 = {...t.context.fiatContribution1, userId: getIndexedUserId(1)};
  const contrib2 = {...t.context.fiatContribution2, userId: getIndexedUserId(2)};
  const contrib3 = {...t.context.fiatContribution3, userId: getIndexedUserId(3)};

  await saveFiatContribution(contrib1);
  await saveFiatContribution(contrib2);
  await saveFiatContribution(contrib3);
};

const saveBatchFiatContributions = async t => {
  t.context.fiatContribution1 = createFiatContribution(100);
  t.context.fiatContribution2 = createFiatContribution(200);
  t.context.fiatContribution3 = createFiatContribution(300);

  const contrib1 = {...t.context.fiatContribution1, userId: getIndexedUserId(1)};
  const contrib2 = {...t.context.fiatContribution2, userId: getIndexedUserId(2)};
  const contrib3 = {...t.context.fiatContribution3, userId: getIndexedUserId(3)};

  return await saveBatchFiatContribution([contrib1, contrib2, contrib3]);
};

const saveMultipleFiatFailures = async () => {
  const {
    size, userId, txHash, currency, time
  } = createFiatFialure(100, getIndexedUserId(1));
  const {
    size: size2, userId: userId2, txHash: txHash2, currency: currency2, time: time2
  } = createFiatFialure(200, getIndexedUserId(2));

  await saveFiatFailure(size, userId, txHash, currency, time);
  await saveFiatFailure(size2, userId2, txHash2, currency2, time2);

  return [
    {
      size, userId, txHash, currency, time
    },
    {
      size2, userId2, txHash2, currency2, time2
    }
  ];
};

const createOrphanContributions = async t => {
  t.context.orphanContrib1 = createBtcContribution(
    toSatoshi(getSizeForTokenSum(100)),
    'confirmed',
    SettlementStatuses.STAGE_NOT_FOUND
  );

  t.context.orphanContrib2 = createEthContribution(
    toWei('ether', getSizeForTokenSum(100)),
    'ETH',
    SettlementStatuses.STAGE_NOT_FOUND
  );

  t.context.orphanContrib3 = createFiatContribution(
    100,
    false,
    SettlementStatuses.STAGE_NOT_FOUND
  );

  const contrib1 = {...t.context.orphanContrib1, address: t.context.btcAddress1};
  const contrib2 = {...t.context.orphanContrib2, beneficiary: getIndexedEthAddress(2)};
  const contrib3 = {...t.context.orphanContrib3, userId: getIndexedUserId(3)};

  await saveBatchBtcContribution([contrib1]);
  await saveBatchEthContribution([contrib2]);
  await saveFiatContribution(contrib3);
};

serial('saveBatchBtcContribution should save all btc contributions', async t => {
  await saveMultipleBtcContributions(t);

  const contributionsResult = await loadContributions();
  const contributions = contributionsResult.unsafeGet();
  const {
    [Currencies.BTC]: btc,
    [Currencies.FIAT]: fiat,
    [Currencies.Ether]: eth
  } = contributions.toJS();

  t.is(eth.length, 0);
  t.is(fiat.length, 0);
  t.is(btc.length, 3);

  // desc ordering by time
  t.deepEqual(ignoreProp('createdAt')(btc[0]), t.context.btcContrib3);
  t.deepEqual(ignoreProp('createdAt')(btc[1]), t.context.btcContrib2);
  t.deepEqual(ignoreProp('createdAt')(btc[2]), t.context.btcContrib1);
});

serial('saveBatchBtcContribution should return all btc contributions', async t => {
  const contributionsResult = await saveMultipleBtcContributions(t);

  contributionsResult.matchWith({
    Just: ({value: contributions}) => {
      t.deepEqual(ignoreProp('createdAt')(contributions.get(0).toJS()), {...t.context.btcContrib1, userId: getIndexedUserId(1)});
      t.deepEqual(ignoreProp('createdAt')(contributions.get(1).toJS()), {...t.context.btcContrib2, userId: getIndexedUserId(2)});
      t.deepEqual(ignoreProp('createdAt')(contributions.get(2).toJS()), {...t.context.btcContrib3, userId: getIndexedUserId(3)});
    }
  });
});

serial('saveBatchBtcContribution should update an existing contribution', async t => {
  await saveMultipleBtcContributions(t);

  // this already exist, we just change the status to confirmed
  const contrib = {
    ...createBtcContribution(
      100,
      'confirmed'
    ),
    address: t.context.btcAddress1
  };

  await saveBatchBtcContribution([contrib]);

  const contributionsResult = await loadContributions();
  const contributions = contributionsResult.unsafeGet();
  const {
    [Currencies.BTC]: btc,
    [Currencies.FIAT]: fiat,
    [Currencies.Ether]: eth
  } = contributions.toJS();

  t.is(eth.length, 0);
  t.is(fiat.length, 0);
  t.is(btc.length, 3);

  delete contrib.address;

  t.deepEqual(btc[2].status, 'confirmed');
});

serial('saveBatchEthContribution should save all eth contributions', async t => {
  await saveMultipleEthContributions(t);
  
  const contributionsResult = await loadContributions();
  const contributions = contributionsResult.unsafeGet();
  const {
    [Currencies.BTC]: btc,
    [Currencies.FIAT]: fiat,
    [Currencies.Ether]: eth
  } = contributions.toJS();

  t.is(eth.length, 3);
  t.is(fiat.length, 0);
  t.is(btc.length, 0);

  t.deepEqual(eth[0], t.context.ethContrib3);
  t.deepEqual(eth[1], t.context.ethContrib2);
  t.deepEqual(eth[2], t.context.ethContrib1);
});

serial('saveBatchEthContribution should return all eth contributions', async t => {
  const contributionsResult = await saveMultipleEthContributions(t);

  contributionsResult.matchWith({
    Just: ({value: contributions}) => {
      t.deepEqual(ignoreProp('createdAt')(contributions.get(0).toJS()), {...t.context.ethContrib1, userId: getIndexedUserId(1)});
      t.deepEqual(ignoreProp('createdAt')(contributions.get(1).toJS()), {...t.context.ethContrib2, userId: getIndexedUserId(2)});
      t.deepEqual(ignoreProp('createdAt')(contributions.get(2).toJS()), {...t.context.ethContrib3, userId: getIndexedUserId(3)});
    }
  });
});

serial('saveBatchFiatContribution should save all fiat contributions', async t => {
  await saveBatchFiatContributions(t);

  const contributionsResult = await loadContributions();
  const contributions = contributionsResult.unsafeGet();
  const {
    [Currencies.BTC]: btc,
    [Currencies.FIAT]: fiat,
    [Currencies.Ether]: eth
  } = contributions.toJS();

  t.is(eth.length, 0);
  t.is(fiat.length, 3);
  t.is(btc.length, 0);

  t.deepEqual(fiat[0], t.context.fiatContribution3);
  t.deepEqual(fiat[1], t.context.fiatContribution2);
  t.deepEqual(fiat[2], t.context.fiatContribution1);
});

serial('saveBatchFiatContribution should return all fiat contributions', async t => {
  const contributionsResult = await saveBatchFiatContributions(t);

  contributionsResult.matchWith({
    Just: ({value: contributions}) => {
      t.deepEqual(ignoreProp('createdAt')(contributions.get(0).toJS()), {...t.context.fiatContribution1, userId: getIndexedUserId(1)});
      t.deepEqual(ignoreProp('createdAt')(contributions.get(1).toJS()), {...t.context.fiatContribution2, userId: getIndexedUserId(2)});
      t.deepEqual(ignoreProp('createdAt')(contributions.get(2).toJS()), {...t.context.fiatContribution3, userId: getIndexedUserId(3)});
    }
  });
});

serial('saveFiatContribution should save a new fiat contribution', async t => {
  await saveMultipleFiatContributions(t);

  const contributionsResult = await loadContributions();
  const contributions = contributionsResult.unsafeGet();
  const {
    [Currencies.BTC]: btc,
    [Currencies.FIAT]: fiat,
    [Currencies.Ether]: eth
  } = contributions.toJS();

  t.is(eth.length, 0);
  t.is(fiat.length, 3);
  t.is(btc.length, 0);

  t.deepEqual(fiat[0], t.context.fiatContribution3);
  t.deepEqual(fiat[1], t.context.fiatContribution2);
  t.deepEqual(fiat[2], t.context.fiatContribution1);
});

serial('saveFiatContribution should return the saved fiat contribution', async t => {
  const contrib1 = {...createFiatContribution(100), userId: getIndexedUserId(1)};

  const contributionResult = await saveFiatContribution(contrib1);

  contributionResult.matchWith({
    Just: ({value}) => {
      t.deepEqual(value.toJS(), contrib1);
    }
  });
});

serial('setManualContributionStatus should update the softDeleted property of the given fiat contribution', async t => {
  await saveMultipleFiatContributions(t);
  await setManualContributionStatus({
    txHash: t.context.fiatContribution1.txHash,
    softDeleted: true
  });

  const contributionsResult = await loadContributions();
  const contributions = contributionsResult.unsafeGet();
  const {[Currencies.FIAT]: fiat} = contributions.toJS();
  const contrib = fiat.find(c => c.txHash === t.context.fiatContribution1.txHash);

  t.deepEqual(contrib.softDeleted, true);
});

serial('setManualContributionStatus should return the updated contribution', async t => {
  await saveMultipleFiatContributions(t);
  const contributionResult = await setManualContributionStatus({
    txHash: t.context.fiatContribution1.txHash,
    softDeleted: true
  });

  contributionResult.matchWith({
    Just: ({value}) => {
      t.deepEqual(value.toJS(), {...t.context.fiatContribution1, softDeleted: true});
    }
  });
});

serial('saveFiatFailure should save the details of the failed fiat contribution', async t => {
  const {
    size, userId, txHash, currency, time
  } = createFiatFialure(100, getIndexedUserId(1));

  await saveFiatFailure(size, userId, txHash, currency, time);

  const fiatFailureResult = await loadFiatFailures(getIndexedUserId(1));
  fiatFailureResult.matchWith({
    Just: ({value}) => {
      const {id, ...obj} = value.get(0).toJS();
      t.is(value.size, 1);
      t.deepEqual(obj, {
        size, userId, txHash, currency, time
      });
    }
  });
});

serial('loadFiatFailures should return all fiat failures if userId is not provided', async t => {
  const [
    {
      size, userId, txHash, currency, time
    },
    {
      size2, userId2, txHash2, currency2, time2
    }
  ] = await saveMultipleFiatFailures();

  const fiatFailureResult = await loadFiatFailures();
  fiatFailureResult.matchWith({
    Just: ({value}) => {
      const {id, ...obj} = value.get(0).toJS();
      const {id: id2, ...obj2} = value.get(1).toJS();

      t.is(value.size, 2);
      t.deepEqual(obj, {
        size: size2, userId: userId2, txHash: txHash2, currency: currency2, time: time2
      });
      t.deepEqual(obj2, {
        size, userId, txHash, currency, time
      });
    }
  });
});

serial('loadFiatFailures should return fiat failures for the given userId', async t => {
  const [
    {
      size, userId, txHash, currency, time
    }
  ] = await saveMultipleFiatFailures();

  const fiatFailureResult = await loadFiatFailures(getIndexedUserId(1));
  fiatFailureResult.matchWith({
    Just: ({value}) => {
      const {id, ...obj} = value.get(0).toJS();
      t.is(value.size, 1);
      t.deepEqual(obj, {
        size, userId, txHash, currency, time
      });
    }
  });
});

serial('loadFiatFailure should return the give fiat failure', async t => {
  const [
    {
      size, userId, txHash, currency, time
    }
  ] = await saveMultipleFiatFailures();

  const fiatFailureResult = await loadFiatFailures(getIndexedUserId(1));
  await fiatFailureResult.matchWith({
    Just: async ({value}) => {
      const {id} = value.get(0).toJS();
      const failureResult = await loadFiatFailure(id);

      failureResult.matchWith({
        Just: ({value: failure}) => {
          t.deepEqual(failure.toJS(), {
            id, size, userId, txHash, currency, time
          });
        }
      });
    }
  });
});

serial('deleteFiatFailure should delete the given fiat failure', async t => {
  const [
    _,
    {
      size2, userId2, txHash2, currency2, time2
    }
  ] = await saveMultipleFiatFailures();

  const fiatFailureResult = await loadFiatFailures(getIndexedUserId(1));
  await fiatFailureResult.matchWith({
    Just: async ({value}) => {
      const {id} = value.get(0).toJS();
      await deleteFiatFailure(id);
      const newFiatFailureResult = await loadFiatFailures();

      newFiatFailureResult.matchWith({
        Just: ({value: failures}) => {
          const {id: id2, ...obj} = failures.get(0).toJS();
          t.is(failures.size, 1);
          t.deepEqual(obj, {
            size: size2, userId: userId2, txHash: txHash2, currency: currency2, time: time2
          });
        }
      });
    }
  });
});

serial('loadContributions should return all contributions if userId not provided', async t => {
  await saveMultipleBtcContributions(t);
  await saveMultipleEthContributions(t);
  await saveMultipleStablecoinContributions(t);
  await saveMultipleFiatContributions(t);

  const contributionsResult = await loadContributions();
  const contributions = contributionsResult.unsafeGet();
  const {
    [Currencies.BTC]: btc,
    [Currencies.FIAT]: fiat,
    [Currencies.Ether]: eth,
    [Currencies.DAI]: dai,
    [Currencies['True USD']]: trueUsd,
    [Currencies['Gemini USD']]: gUsd
  } = contributions.toJS();

  t.is(eth.length, 3);
  t.is(fiat.length, 3);
  t.is(btc.length, 3);
  t.is(dai.length, 1);
  t.is(trueUsd.length, 1);
  t.is(gUsd.length, 1);

  t.deepEqual(ignoreProp('createdAt')(btc[0]), t.context.btcContrib3);
  t.deepEqual(ignoreProp('createdAt')(btc[1]), t.context.btcContrib2);
  t.deepEqual(ignoreProp('createdAt')(btc[2]), t.context.btcContrib1);
  t.deepEqual(eth[0], t.context.ethContrib3);
  t.deepEqual(eth[1], t.context.ethContrib2);
  t.deepEqual(eth[2], t.context.ethContrib1);

  t.deepEqual(dai[0], t.context.daiContrib1);
  t.deepEqual(trueUsd[0], t.context.trueUsdContrib1);
  t.deepEqual(gUsd[0], t.context.gUsdContrib1);

  t.deepEqual(fiat[0], t.context.fiatContribution3);
  t.deepEqual(fiat[1], t.context.fiatContribution2);
  t.deepEqual(fiat[2], t.context.fiatContribution1);
});

serial('loadContributions should return all contributions for the given userId', async t => {
  await saveMultipleBtcContributions(t);
  await saveMultipleEthContributions(t);
  await saveMultipleStablecoinContributions(t);
  await saveMultipleFiatContributions(t);

  const contributionsResult = await loadContributions(getIndexedUserId(1));
  const contributions = contributionsResult.unsafeGet();
  const {
    [Currencies.BTC]: btc,
    [Currencies.FIAT]: fiat,
    [Currencies.Ether]: eth,
    [Currencies.DAI]: dai,
    [Currencies['True USD']]: trueUsd,
    [Currencies['Gemini USD']]: gUsd
  } = contributions.toJS();

  t.is(eth.length, 1);
  t.is(fiat.length, 1);
  t.is(btc.length, 1);
  t.is(dai.length, 1);
  t.is(trueUsd.length, 0);
  t.is(gUsd.length, 0);

  t.deepEqual(ignoreProp('createdAt')(btc[0]), t.context.btcContrib1);
  t.deepEqual(eth[0], t.context.ethContrib1);
  t.deepEqual(fiat[0], t.context.fiatContribution1);
  t.deepEqual(dai[0], t.context.daiContrib1);
});

serial('readContributions should return the correct paginated result', async t => {
  await saveMultipleBtcContributions(t);
  await saveMultipleEthContributions(t);
  await saveMultipleFiatContributions(t);

  const result = await readContributions('BTC')({skip: 0, limit: 2});

  result.matchWith({
    Just: ({value}) => {
      const {contributions, count} = value.toJS();;

      t.is(count, 3);
      t.is(contributions.length, 2);
      t.deepEqual(ignoreProp('createdAt')(contributions[0]), t.context.btcContrib3);
      t.deepEqual(ignoreProp('createdAt')(contributions[1]), t.context.btcContrib2);
    }
  });
});

serial('readContributions should return the correct contributions based on the time', async t => {
  await saveMultipleBtcContributions(t);
  await saveMultipleEthContributions(t);
  await saveMultipleFiatContributions(t);

  const result = await readContributions('ETH')({
    from: t.context.ethContrib1.time - 10,
    until: t.context.ethContrib2.time
  });

  result.matchWith({
    Just: ({value}) => {
      const {contributions, count} = value.toJS();;

      t.is(count, 2);
      t.is(contributions.length, 2);
      t.deepEqual(ignoreProp('createdAt')(contributions[0]), t.context.ethContrib2);
      t.deepEqual(ignoreProp('createdAt')(contributions[1]), t.context.ethContrib1);
    }
  });
});

serial('readContributions should use the default filtering and pagination', async t => {
  await saveMultipleBtcContributions(t);
  await saveMultipleEthContributions(t);
  await saveMultipleFiatContributions(t);

  const result = await readContributions('FIAT')();

  result.matchWith({
    Just: ({value}) => {
      const {contributions, count} = value.toJS();

      t.is(count, 3);
      t.is(contributions.length, 3);
      t.deepEqual(ignoreProp('createdAt')(contributions[0]), t.context.fiatContribution3);
      t.deepEqual(ignoreProp('createdAt')(contributions[1]), t.context.fiatContribution2);
      t.deepEqual(ignoreProp('createdAt')(contributions[2]), t.context.fiatContribution1);
    }
  });
});

serial('readOrphanContributions should return the correct paginated result', async t => {
  await createOrphanContributions(t);

  const result = await readOrphanContributions({skip: 0, limit: 2});

  result.matchWith({
    Just: ({value}) => {
      const contributions = value.toJS();

      t.is(contributions.length, 2);
      t.deepEqual(ignoreProp('createdAt')(contributions[0]), t.context.orphanContrib3);
      t.deepEqual(ignoreProp('createdAt')(contributions[1]), t.context.orphanContrib2);
    }
  });
});

serial('readOrphanContributions should return the correct contributions based on the time', async t => {
  await createOrphanContributions(t);

  const result = await readOrphanContributions({
    from: t.context.orphanContrib1.time - 10,
    until: t.context.orphanContrib2.time
  });

  result.matchWith({
    Just: ({value}) => {
      const contributions = value.toJS();

      t.is(contributions.length, 2);
      t.deepEqual(ignoreProp('createdAt')(contributions[0]), t.context.orphanContrib2);
      t.deepEqual(ignoreProp('createdAt')(contributions[1]), t.context.orphanContrib1);
    }
  });
});

serial('readOrphanContributions should use the default filtering and pagination', async t => {
  await createOrphanContributions(t);

  const result = await readOrphanContributions();

  result.matchWith({
    Just: ({value}) => {
      const contributions = value.toJS();

      t.is(contributions.length, 3);
      t.deepEqual(ignoreProp('createdAt')(contributions[0]), t.context.orphanContrib3);
      t.deepEqual(ignoreProp('createdAt')(contributions[1]), t.context.orphanContrib2);
      t.deepEqual(ignoreProp('createdAt')(contributions[2]), t.context.orphanContrib1);
    }
  });
});

serial('readAllBtcContributions should return btc contribution with given status', async t => {
  await saveMultipleBtcContributions(t);
  const result = await readAllBtcContributions('pending');

  result.matchWith({
    Just: ({value}) => {
      const contributions = value.toJS();

      t.is(contributions.length, 1);
      t.deepEqual(ignoreProp('createdAt')(contributions[0]), t.context.btcContrib1);
    }
  });
});

serial('readAllEthContributions should return all eth contributions', async t => {
  await saveMultipleEthContributions(t);
  const result = await readAllEthContributions();

  result.matchWith({
    Just: ({value}) => {
      const contributions = value.toJS();

      t.is(contributions.length, 3);

      const findContribution = ethContrib => contributions.find(c => c.txHash === ethContrib.txHash);
    
      t.deepEqual(ignoreProp('createdAt')(findContribution(t.context.ethContrib1)), t.context.ethContrib1);
      t.deepEqual(ignoreProp('createdAt')(findContribution(t.context.ethContrib2)), t.context.ethContrib2);
      t.deepEqual(ignoreProp('createdAt')(findContribution(t.context.ethContrib3)), t.context.ethContrib3);
    }
  });
});

serial('readTokensAndBonus should include tokens sold and bonuses', async t => {
  // 200 + 300 = 500 * 2 (the first tx is not included as it's still pending)
  await saveMultipleBtcContributions(t);

  // 100 + 200 + 300 = 600 * 2 tokens
  await saveMultipleEthContributions(t);

  // 100 + 200 + 300 = 600 * 2 tokens
  await saveMultipleFiatContributions(t);

  const netTokensResult = await readTokensAndBonus();

  netTokensResult.matchWith({
    Just: ({value}) => {
      t.is(value.get('totalTokens'), 3400);
    }
  });
});

serial('readContributionTotals should return the totals for all users', async t => {
  await saveMultipleBtcContributions(t);
  await saveMultipleEthContributions(t);
  await saveMultipleFiatContributions(t);
  await saveMultipleStablecoinContributions(t);

  const totalsResult = await readContributionTotals();

  totalsResult.matchWith({
    Just: ({value: total}) => {
      t.deepEqual(total.toJS(), {
        [Currencies.FIAT]: {
          tokens: 600,
          bonusTokens: 600,
          referralTokens: 600,
          fiatValue: 600,
          size: 600,
          totalTokens: 1800
        },
        [Currencies.BTC]: {
          tokens: 500,
          bonusTokens: 500,
          referralTokens: 500,
          fiatValue: 500,
          size: 500,
          totalTokens: 1500
        },
        [Currencies.Ether]: {
          tokens: 600,
          bonusTokens: 600,
          referralTokens: 600,
          fiatValue: 600,
          size: 600,
          totalTokens: 1800
        },
        [Currencies.DAI]: {
          tokens: 100,
          bonusTokens: 100,
          referralTokens: 100,
          fiatValue: 100,
          size: 100,
          totalTokens: 300
        },
        [Currencies['True USD']]: {
          tokens: 200,
          bonusTokens: 200,
          referralTokens: 200,
          fiatValue: 200,
          size: 200,
          totalTokens: 600
        },
        [Currencies['Gemini USD']]: {
          tokens: 300,
          bonusTokens: 300,
          referralTokens: 300,
          fiatValue: 300,
          size: 300,
          totalTokens: 900
        }
      });
    }
  });
});

serial('readContributionTotals should return the total when there are contributions of just one type i.e. stablecoins only', async t => {
  await saveMultipleStablecoinContributions(t);

  const totalsResult = await readContributionTotals();
  totalsResult.matchWith({
    Just: ({value: total}) => {
      t.deepEqual(total.toJS(), {
        [Currencies.DAI]: {
          tokens: 100,
          bonusTokens: 100,
          referralTokens: 100,
          fiatValue: 100,
          size: 100,
          totalTokens: 300
        },
        [Currencies['True USD']]: {
          tokens: 200,
          bonusTokens: 200,
          referralTokens: 200,
          fiatValue: 200,
          size: 200,
          totalTokens: 600
        },
        [Currencies['Gemini USD']]: {
          tokens: 300,
          bonusTokens: 300,
          referralTokens: 300,
          fiatValue: 300,
          size: 300,
          totalTokens: 900
        }
      });
    }
  });
});

serial('readContributionTotals should return the totals for a particular user', async t => {
  await saveMultipleBtcContributions(t);
  await saveMultipleEthContributions(t);
  await saveMultipleFiatContributions(t);
  await saveMultipleStablecoinContributions(t);

  const totalsResult = await readContributionTotals(getIndexedUserId(2));

  totalsResult.matchWith({
    Just: ({value: total}) => {
      t.deepEqual(total.toJS(), {
        [Currencies.FIAT]: {
          tokens: 200,
          bonusTokens: 200,
          referralTokens: 200,
          fiatValue: 200,
          size: 200,
          totalTokens: 600
        },
        [Currencies.BTC]: {
          tokens: 200,
          bonusTokens: 200,
          referralTokens: 200,
          fiatValue: 200,
          size: 200,
          totalTokens: 600
        },
        [Currencies.Ether]: {
          tokens: 200,
          bonusTokens: 200,
          referralTokens: 200,
          fiatValue: 200,
          size: 200,
          totalTokens: 600
        },
        [Currencies['True USD']]: {
          tokens: 200,
          bonusTokens: 200,
          referralTokens: 200,
          fiatValue: 200,
          size: 200,
          totalTokens: 600
        }
      });
    }
  });
});
