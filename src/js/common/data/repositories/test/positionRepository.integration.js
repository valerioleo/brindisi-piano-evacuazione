const {test, serial} = require('ava');
const {initDB} = require('../../../test/helpers');
const {maybeValueReturn, toJS} = require('../../../fn');
const {
  createPosition,
  readPositions,
  readPositionsByTokenAndState,
  readPosition,
  updatePositionStateBatch,
  deletePosition,
  readPositionsByCurrencyAndUser,
  updatePositionFillingHash,
  updatePosition,
  getPendingPositions,
  readPositionsBalanceByCurrencyAndUser,
  readPositionBalances
} = require('../positionRepository');
const {
  createToken
} = require('../tokenRepository');
const {cleanDb} = require('../testRepository');
const {ignoreProps} = require('../../../../common/fn');

test.before(async () => {
  await initDB();
});

test.afterEach.always(async () => {
  await cleanDb();
});

const getCreatePositionData = (salt, data = {txHash: 'txhash'}) => ({
  userId: `fakeId_${salt}`,
  token: `fake_token_${salt}`,
  size: salt,
  currency: `fakeCurrency_${salt}`,
  amount: salt,
  txHash: `${data.txHash}_${salt}`
});

const expectedSavedPosition = positionData => ({
  token: positionData.token,
  size: positionData.size,
  currency: positionData.currency,
  createdBy: positionData.userId,
  softDeleted: false,
  state: 'open',
  tokenAmount: positionData.amount,
  userAddress: null
});

const propsToIgnore = ['txHash', 'id', 'createdAt', ''];

serial('createPosition should create the position node and return it', async t => {
  const createPositionResult = await createPosition(
    ...Object.values(getCreatePositionData(1))
  );

  createPositionResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.deepEqual(
        ignoreProps([...propsToIgnore])(data),
        ignoreProps(['userAddress'])(expectedSavedPosition(getCreatePositionData(1)))
      );
    },
    Nothing: () => {
      throw new Error('Failed to create position');
    }
  });
});

serial('readPosition should return the specified position', async t => {
  const saveTokenResult = await createPosition(
    ...Object.values(getCreatePositionData(1))
  );

  const {id: createdId} = saveTokenResult.matchWith({
    Just: ({value}) => value.toJS(),
    Nothing: () => {
      throw new Error('Failed to create position');
    }
  });

  const readPositionResult = await readPosition(createdId);

  readPositionResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.deepEqual(
        ignoreProps([...propsToIgnore])(data),
        ignoreProps(['userAddress'])(expectedSavedPosition(getCreatePositionData(1)))
      );
    },
    Nothing: () => {
      throw new Error('Failed to get position');
    }
  });
});

serial('readPositions should return only the positions with the specified state', async t => {
  const position1Data = getCreatePositionData(1);
  const position2Data = getCreatePositionData(2);

  await createToken(
    position1Data.token,
    position1Data.token,
    position1Data.token,
    position1Data.token,
    1
  );

  await createToken(
    position2Data.token,
    position2Data.token,
    position2Data.token,
    position2Data.token,
    2
  );

  await createPosition(...Object.values(position1Data));
  const createPositionResult = await createPosition(...Object.values(position2Data));

  const {txHash} = createPositionResult.matchWith({
    Just: ({value}) => value.toJS(),
    Nothing: () => {
      throw new Error('Failed to create position');
    }
  });

  await updatePositionStateBatch([{txHash}], 'updated');

  const readPositionsResult = await readPositions({state: 'open'}, 0, 10);

  readPositionsResult.matchWith({
    Just: ({value}) => {
      const data = value.positions.toJS();
      t.is(data.length, 1);

      const expectedUserId1 = data
        .find(d => d.createdBy === position1Data.userId);

      t.deepEqual(
        ignoreProps(['createdAt', 'id'])(expectedUserId1),
        {
          createdBy: position1Data.userId,
          token: position1Data.token,
          size: position1Data.size,
          currency: position1Data.currency,
          tokenAmount: position1Data.amount,
          state: 'open',
          txHash: position1Data.txHash,
          name: position1Data.token,
          softDeleted: false,
          tokenAddress: position1Data.token,
          userAddress: null,
          userName: null
        }
      );
    },
    Nothing: () => {
      throw new Error('Failed to get positions');
    }
  });
});

serial('deletePosition should soft delete the position from the database', async t => {
  const position1Data = getCreatePositionData(1, {txHash: 'a_different_hash'});
  const createPositionResult = await createPosition(...Object.values(position1Data));

  const {id: createdId} = createPositionResult.matchWith({
    Just: ({value}) => value.toJS(),
    Nothing: () => {
      throw new Error('Failed to create position');
    }
  });

  await deletePosition(createdId);

  const readPositionResult = await readPosition(createdId);

  readPositionResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();
      t.is(data.softDeleted, true);
    },
    Nothing: () => {
      throw new Error('Failed to get position');
    }
  });
});

serial('updatePositionState should update the position state', async t => {
  const position1Data = getCreatePositionData(1, {txHash: 'a_different_hash'});
  const createPositionResult = await createPosition(...Object.values(position1Data));

  const {id: createdId, txHash} = createPositionResult.matchWith({
    Just: ({value}) => value.toJS(),
    Nothing: () => {
      throw new Error('Failed to create position');
    }
  });

  await updatePositionStateBatch([{txHash}], 'updatedState');

  const readPositionResult = await readPosition(createdId);

  readPositionResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.deepEqual(
        ignoreProps(['createdAt', 'updatedAt', 'id'])(data),
        {
          createdBy: position1Data.userId,
          token: position1Data.token,
          size: position1Data.size,
          currency: position1Data.currency,
          tokenAmount: position1Data.amount,
          state: 'updatedState',
          txHash: position1Data.txHash,
          softDeleted: false
        }
      );
    },
    Nothing: () => {
      throw new Error('Failed to get positions');
    }
  });
});

serial('updatePositionState should only update the specified token', async t => {
  const position1Data = getCreatePositionData(1);
  const position2Data = getCreatePositionData(2);

  await createToken(
    position2Data.token,
    position2Data.token,
    position2Data.token,
    position2Data.token,
    1
  );

  const createPositionResult = await createPosition(...Object.values(position1Data));
  await createPosition(...Object.values(position2Data));

  const {txHash} = createPositionResult.matchWith({
    Just: ({value}) => value.toJS(),
    Nothing: () => {
      throw new Error('Failed to create position');
    }
  });

  await updatePositionStateBatch([{txHash}], 'updated');

  const readPositionsResult = await readPositions({state: 'open'}, 0, 10);

  readPositionsResult.matchWith({
    Just: ({value}) => {
      const data = value.positions.toJS();
      t.is(data.length, 1);

      const expectedUserId2 = data.find(d => d.createdBy === position2Data.userId);
      t.deepEqual(
        ignoreProps(['createdAt', 'id'])(expectedUserId2),
        {
          createdBy: position2Data.userId,
          name: position2Data.token,
          token: position2Data.token,
          size: position2Data.size,
          currency: position2Data.currency,
          tokenAmount: position2Data.amount,
          state: 'open',
          txHash: position2Data.txHash,
          softDeleted: false,
          tokenAddress: position2Data.token,
          userAddress: null,
          userName: null
        }
      );
    },
    Nothing: () => t.fail('Failed to get positions')
  });
});

serial('readPositionsByTokenAndState should get all the positions with specified state for a token', async t => {
  const position1Data = getCreatePositionData(1);
  const position2Data = getCreatePositionData(2);

  await createPosition(...Object.values(position1Data));
  await createPosition(...Object.values(position2Data));

  const readPositionsResult = await readPositionsByTokenAndState(position1Data.token, {state: 'open'});

  readPositionsResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      const position1Db = data.find(d => d.createdBy === position1Data.userId);
      t.deepEqual(ignoreProps(['id', 'createdAt'])(position1Db),
        {
          createdBy: position1Data.userId,
          token: position1Data.token,
          size: position1Data.size,
          currency: position1Data.currency,
          tokenAmount: position1Data.amount,
          state: 'open',
          txHash: position1Data.txHash,
          softDeleted: false,
          userAddress: null,
          userName: null
        });

      const position2Db = data.find(d => d.createdBy === position1Data.userId);
      t.deepEqual(ignoreProps(['id', 'createdAt'])(position2Db),
        {
          createdBy: position1Data.userId,
          token: position1Data.token,
          size: position1Data.size,
          currency: position1Data.currency,
          tokenAmount: position1Data.amount,
          state: 'open',
          txHash: position1Data.txHash,
          softDeleted: false,
          userAddress: null,
          userName: null
        });
    },
    Nothing: () => {
      throw new Error('Failed to get open positions');
    }
  });
});

serial('readPositionsByTokenAndState should get only the positions with the specified state for a token', async t => {
  const position1Data = getCreatePositionData(1);
  const position2Data = getCreatePositionData(2);

  await createPosition(...Object.values(position1Data));
  const saveTokenResult = await createPosition(...Object.values(position2Data));

  const {id: createdId} = saveTokenResult.matchWith({
    Just: ({value}) => value.toJS(),
    Nothing: () => {
      throw new Error('Failed to create position');
    }
  });

  await deletePosition(createdId);

  const readPositionsResult = await readPositionsByTokenAndState(position1Data.token, {state: 'open'});

  readPositionsResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();
      t.is(data.length, 1);

      const expectedUserId1 = data.find(d => d.createdBy === position1Data.userId);
      t.deepEqual(
        ignoreProps(['createdAt', 'id'])(expectedUserId1),
        {
          createdBy: position1Data.userId,
          token: position1Data.token,
          size: position1Data.size,
          currency: position1Data.currency,
          tokenAmount: position1Data.amount,
          state: 'open',
          txHash: position1Data.txHash,
          softDeleted: false,
          userAddress: null,
          userName: null
        }
      );
    },
    Nothing: () => {
      throw new Error('Failed to get open position');
    }
  });
});

serial('readPositionsByTokenAndState should get the positions only for the specified token', async t => {
  const position1Data = getCreatePositionData(1);
  const position2Data = getCreatePositionData(2);

  await createPosition(...Object.values(position1Data));
  await createPosition(...Object.values(position2Data));

  const readPositionsResult = await readPositionsByTokenAndState(position1Data.token, {state: 'open'});

  readPositionsResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();
      t.is(data.length, 1);

      const expectedUserId1 = data.find(d => d.createdBy === position1Data.userId);
      t.deepEqual(
        ignoreProps(['createdAt', 'id'])(expectedUserId1),
        {
          createdBy: position1Data.userId,
          token: position1Data.token,
          size: position1Data.size,
          currency: position1Data.currency,
          tokenAmount: position1Data.amount,
          state: 'open',
          txHash: position1Data.txHash,
          softDeleted: false,
          userAddress: null,
          userName: null
        }
      );
    },
    Nothing: () => {
      throw new Error('Failed to get open position');
    }
  });
});

serial('readPositionsByCurrencyAndUser should return positions based on user and currency', async t => {
  const position1Data = getCreatePositionData(1);
  const position2Data = getCreatePositionData(1, {txHash: 'another_hash'});
  const position3Data = getCreatePositionData(3);

  await createPosition(...Object.values(position1Data));
  await createPosition(...Object.values(position2Data));
  await createPosition(...Object.values(position3Data));

  const readPositionsResult = await readPositionsByCurrencyAndUser(
    position1Data.userId,
    position1Data.currency,
    'open'
  );

  readPositionsResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();
      t.is(data.length, 2);

      const expectedUserId1 = data.find(d => d.txHash === position1Data.txHash);
      t.deepEqual(
        ignoreProps(['createdAt', 'id'])(expectedUserId1),
        {
          createdBy: position1Data.userId,
          token: position1Data.token,
          size: position1Data.size,
          currency: position1Data.currency,
          tokenAmount: position1Data.amount,
          state: 'open',
          txHash: position1Data.txHash,
          softDeleted: false
        }
      );

      const expectedUserId2 = data.find(d => d.txHash === position2Data.txHash);
      t.deepEqual(
        ignoreProps(['createdAt', 'id'])(expectedUserId2),
        {
          createdBy: position2Data.userId,
          token: position2Data.token,
          size: position2Data.size,
          currency: position2Data.currency,
          tokenAmount: position2Data.amount,
          state: 'open',
          txHash: position2Data.txHash,
          softDeleted: false
        }
      );
    },
    Nothing: () => t.fail('Failed to read position')
  });
});

serial('readPositionsByTokenAndState should return empty array if no positions match', async t => {
  const position1Data = getCreatePositionData(1);
  const position2Data = getCreatePositionData(2);
  const position3Data = getCreatePositionData(3);

  await createPosition(
    ...Object.values(position1Data)
  );

  await createPosition(
    ...Object.values(position2Data)
  );

  await createPosition(
    ...Object.values(position3Data)
  );

  const getPositionResult = await readPositionsByTokenAndState('token1', {state: 'filled'});

  const positions = getPositionResult.matchWith({
    Just: maybeValueReturn(toJS),
    Nothing: t.fail.bind(t)
  });

  t.deepEqual(positions, []);
});

serial('updatePositionFillingHash should update the hash', async t => {
  const position1Data = getCreatePositionData(1);

  const saveTokenResult = await createPosition(
    ...Object.values(position1Data)
  );

  const {id: tokenId} = saveTokenResult.matchWith({
    Just: ({value}) => value.toJS(),
    Nothing: () => {
      throw new Error('Failed to create position');
    }
  });

  await updatePositionFillingHash(tokenId, 'updatedash');

  const readPositionResult = await readPosition(tokenId);

  readPositionResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.deepEqual(
        ignoreProps(['createdAt', 'id', 'updatedAt'])(data),
        {
          createdBy: position1Data.userId,
          token: position1Data.token,
          size: position1Data.size,
          currency: position1Data.currency,
          tokenAmount: position1Data.amount,
          state: 'open',
          status: 'pending',
          txHash: 'updatedash',
          softDeleted: false
        }
      );
    },
    Nothing: () => {
      throw new Error('Failed to get position');
    }
  });
});

serial('readPositionsByCurrencyAndUser should return the positions for a user and with correct state', async t => {
  const position1Data = getCreatePositionData(1);
  const position2Data = getCreatePositionData(2);
  const position3Data = getCreatePositionData(3);

  await createToken(
    position1Data.token,
    position1Data.token,
    position1Data.token,
    position1Data.token,
    1
  );

  await createToken(
    position2Data.token,
    position2Data.token,
    position2Data.token,
    position2Data.token,
    1
  );

  await createPosition(
    ...Object.values(position1Data)
  );

  await createPosition(
    ...Object.values(position2Data)
  );

  const createPositionResult = await createPosition(
    ...Object.values(position3Data)
  );

  const {txHash} = createPositionResult.matchWith({
    Just: ({value}) => value.toJS(),
    Nothing: () => {
      throw new Error('Failed to create position');
    }
  });

  await updatePositionStateBatch([{txHash}], 'updated');

  const readPositionsResult = await readPositionsByCurrencyAndUser(
    position3Data.userId,
    position3Data.currency,
    'updated'
  );

  readPositionsResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();
      t.is(data.length, 1);

      const expectedPosition = data.find(d => d.txHash === position3Data.txHash);
      t.deepEqual(
        ignoreProps(['createdAt', 'updatedAt', 'id'])(expectedPosition),
        {
          createdBy: position3Data.userId,
          token: position3Data.token,
          size: position3Data.size,
          currency: position3Data.currency,
          tokenAmount: position3Data.amount,
          state: 'updated',
          txHash: position3Data.txHash,
          softDeleted: false
        }
      );
    },
    Nothing: () => {
      throw new Error('Failed to get positions');
    }
  });
});

serial('updatePosition should update any property', async t => {
  const position1Data = getCreatePositionData(1);

  const savePositionResult = await createPosition(
    ...Object.values(position1Data)
  );

  const {id: positionId} = savePositionResult.matchWith({
    Just: ({value}) => value.toJS(),
    Nothing: () => {
      throw new Error('Failed to create position');
    }
  });

  await updatePosition(positionId, {status: 'updatedStatus', state: 'updateState', txHash: 'updatedTxHash'});

  const readPositionResult = await readPosition(positionId);

  readPositionResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.deepEqual(
        ignoreProps(['createdAt', 'id', 'updatedAt'])(data),
        {
          createdBy: position1Data.userId,
          token: position1Data.token,
          size: position1Data.size,
          currency: position1Data.currency,
          tokenAmount: position1Data.amount,
          state: 'updateState',
          status: 'updatedStatus',
          txHash: 'updatedTxHash',
          softDeleted: false
        }
      );
    },
    Nothing: () => {
      throw new Error('Failed to get position');
    }
  });
});

serial('getPendingPositions should get all the pending positions', async t => {
  const position1Data = getCreatePositionData(1);
  const position2Data = getCreatePositionData(2);
  const position3Data = getCreatePositionData(3);

  const savePositionResult1 = await createPosition(...Object.values(position1Data));
  const savePositionResult2 = await createPosition(...Object.values(position2Data));
  await createPosition(...Object.values(position3Data));

  const {id: positionId1} = savePositionResult1.matchWith({
    Just: ({value}) => value.toJS(),
    Nothing: () => {
      throw new Error('Failed to create position');
    }
  });
  const {id: positionId2} = savePositionResult2.matchWith({
    Just: ({value}) => value.toJS(),
    Nothing: () => {
      throw new Error('Failed to create position');
    }
  });

  await updatePosition(positionId1, {status: 'pending'});
  await updatePosition(positionId2, {status: 'pending'});

  const readPositionsResult = await getPendingPositions();

  readPositionsResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      const position1Db = data.find(d => d.createdBy === position1Data.userId);
      t.deepEqual(ignoreProps(['id', 'createdAt', 'updatedAt', 'txHash'])(position1Db), ignoreProps(['userAddress'])({
        ...expectedSavedPosition(position1Data),
        status: 'pending'
      }));

      const position2Db = data.find(d => d.createdBy === position2Data.userId);
      t.deepEqual(ignoreProps(['id', 'createdAt', 'updatedAt', 'txHash'])(position2Db), ignoreProps(['userAddress'])({
        ...expectedSavedPosition(position2Data),
        status: 'pending'
      }));
    },
    Nothing: () => {
      throw new Error('Failed to get open positions');
    }
  });
});

serial('readPositionsBalanceByCurrencyAndUser should return the balance based on user and currency', async t => {
  const userId = 'fakeId_1';
  const token = 'fake_token';
  const size = 100;
  const currency = 'fakeCurrency';
  const amount = '10';
  const txHash = 'txHash';

  await createPosition(
    userId,
    token,
    size,
    currency,
    amount,
    txHash
  );

  await createPosition(
    userId,
    token,
    size,
    currency,
    amount,
    txHash
  );

  const readPositionsResult = await readPositionsBalanceByCurrencyAndUser(
    'fakeId_1',
    'fakeCurrency',
    'open'
  );

  readPositionsResult.matchWith({
    Just: ({value}) => {
      t.deepEqual(value.get('total'), 200);
    },
    Nothing: () => t.fail('Failed to read position')
  });
});

serial('readPositionBalances should return the balances for every token there is a position for', async t => {
  const userId = 'fakeId_1';
  const token = 'fake_token';
  const size = 100;
  const currency1 = 'fakeCurrency1';
  const currency2 = 'fakeCurrency2';
  const amount = '10';
  const txHash = 'txHash';

  await createPosition(
    userId,
    token,
    size,
    currency1,
    amount,
    txHash
  );

  await createPosition(
    userId,
    token,
    size,
    currency1,
    amount,
    txHash
  );

  await createPosition(
    userId,
    token,
    size,
    currency2,
    amount,
    txHash
  );

  const readPositionsResult = await readPositionBalances({token});
  const expectedBalance1 = {currency: currency1, size: 200};
  const expectedBalance2 = {currency: currency2, size: 100};

  readPositionsResult.matchWith({
    Just: ({value: balances}) => {
      const balance1 = balances.find(elem => elem.get('currency') === currency1);
      const balance2 = balances.find(elem => elem.get('currency') === currency2);

      t.deepEqual(expectedBalance1, balance1.toJS());
      t.deepEqual(expectedBalance2, balance2.toJS());
    },
    Nothing: () => t.fail()
  });
});

serial('readPositionBalances should return empty array if there are no positions', async t => {
  const readPositionsResult = await readPositionBalances({token: 'fake_token'});

  const positions = readPositionsResult.matchWith({
    Just: maybeValueReturn(toJS),
    Nothing: t.fail.bind(t)
  });

  t.deepEqual(positions, []);
});
