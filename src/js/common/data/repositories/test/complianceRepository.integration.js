const {test, serial} = require('ava');
const matchesProperty = require('lodash.matchesproperty');
const {initDB} = require('../../../test/helpers');
const {DEFAULT_USER_ID, createExtendedUser} = require('../../../../common-api/test/helpers/account');
const {PRIMARY_TOKEN_ADDRESS} = require('../../../../common-api/test/helpers/token');
const {createCheckpointData} = require('../../../../common-api/test/helpers/compliance');
const {createToken} = require('../tokenRepository');
const {
  readTokenCheckpoints,
  updatePendingCheckpoint,
  saveCheckpoint,
  readPendingCheckpoints,
  saveCheckpointsBatch
} = require('../complianceRepository');
const {cleanDb} = require('../testRepository');

test.before(async () => {
  await initDB();
});

test.beforeEach(async () => {
  await createExtendedUser(DEFAULT_USER_ID);
});

test.afterEach.always(async () => {
  await cleanDb();
});

serial('readTokenCheckpoints should return the checkpoints of a given token', async t => {
  await createToken(PRIMARY_TOKEN_ADDRESS, 'token1', 'symbol1');
  await saveCheckpoint(PRIMARY_TOKEN_ADDRESS, ...Object.values(createCheckpointData(0)));

  const readTokenCheckpointsResult = await readTokenCheckpoints(PRIMARY_TOKEN_ADDRESS);
  readTokenCheckpointsResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      const expectedResponse = [{
        ...createCheckpointData(0),
        tokenAddress: PRIMARY_TOKEN_ADDRESS,
        tclRepositoryAddress: ''
      }];

      t.deepEqual(expectedResponse, data);
      t.is(data.length, 1);
    }
  });
});

serial('readTokenCheckpoints should return empty array if no checkpoint exists', async t => {
  await createToken(PRIMARY_TOKEN_ADDRESS, 'token1', 'symbol1');

  const readTokenCheckpointsResult = await readTokenCheckpoints(PRIMARY_TOKEN_ADDRESS);
  readTokenCheckpointsResult.matchWith({
    Just: ({value}) => t.deepEqual(value.toJS(), []),
    Nothing: t.pass.bind(t)
  });
});

serial('saveCheckpoint should link the checkpoints to the token correctly', async t => {
  await createToken(PRIMARY_TOKEN_ADDRESS, 'token1', 'symbol1');
  await saveCheckpoint(PRIMARY_TOKEN_ADDRESS, ...Object.values(createCheckpointData(0)));
  await saveCheckpoint(PRIMARY_TOKEN_ADDRESS, ...Object.values(createCheckpointData(1)));

  const readTokenCheckpointsResult = await readTokenCheckpoints(PRIMARY_TOKEN_ADDRESS);
  readTokenCheckpointsResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      const expectedResponse = [{
        ...createCheckpointData(1),
        tokenAddress: PRIMARY_TOKEN_ADDRESS,
        tclRepositoryAddress: ''
      }, {
        ...createCheckpointData(0),
        tokenAddress: PRIMARY_TOKEN_ADDRESS,
        tclRepositoryAddress: ''
      }];

      t.deepEqual(expectedResponse, data);
      t.is(data.length, 2);
    }
  });
});

serial('readPendingCheckpoints should return all the pending Checkpoints', async t => {
  await createToken(PRIMARY_TOKEN_ADDRESS, 'token1', 'symbol1');

  const pendingCheckpoint1 = createCheckpointData(1);
  const pendingCheckpoint2 = createCheckpointData(2);
  const pendingCheckpoint3 = createCheckpointData(3);

  await saveCheckpoint(PRIMARY_TOKEN_ADDRESS, ...Object.values(pendingCheckpoint1));
  await saveCheckpoint(PRIMARY_TOKEN_ADDRESS, ...Object.values(pendingCheckpoint2));
  await saveCheckpoint(PRIMARY_TOKEN_ADDRESS, ...Object.values(pendingCheckpoint3));

  const readPendingCheckpointsResult = await readPendingCheckpoints(PRIMARY_TOKEN_ADDRESS);
  readPendingCheckpointsResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      const pendingCheckpoint1Db = data
        .find(matchesProperty('checkpointName', pendingCheckpoint1.checkpointName));
      const pendingCheckpoint2Db = data
        .find(matchesProperty('checkpointName', pendingCheckpoint2.checkpointName));
      const pendingCheckpoint3Db = data
        .find(matchesProperty('checkpointName', pendingCheckpoint3.checkpointName));

      t.deepEqual(pendingCheckpoint1, pendingCheckpoint1Db);
      t.deepEqual(pendingCheckpoint2, pendingCheckpoint2Db);
      t.deepEqual(pendingCheckpoint3, pendingCheckpoint3Db);
      t.is(data.length, 3);
    }
  });
});

serial('updatePendingCheckpoint should update the pending Checkpoints', async t => {
  await createToken(PRIMARY_TOKEN_ADDRESS, 'token1', 'symbol1');

  const pendingCheckpoint1 = createCheckpointData(1);
  const pendingCheckpoint2 = createCheckpointData(2);
  const pendingCheckpoint3 = createCheckpointData(3);

  await saveCheckpoint(PRIMARY_TOKEN_ADDRESS, ...Object.values(pendingCheckpoint1));
  await saveCheckpoint(PRIMARY_TOKEN_ADDRESS, ...Object.values(pendingCheckpoint2));
  await saveCheckpoint(PRIMARY_TOKEN_ADDRESS, ...Object.values(pendingCheckpoint3));

  await readTokenCheckpoints(PRIMARY_TOKEN_ADDRESS)
    .then(res => res.matchWith({
      Just: ({value}) => {
        const data = value.toJS();

        const expectedResponse = [{
          ...pendingCheckpoint3,
          tokenAddress: PRIMARY_TOKEN_ADDRESS,
          tclRepositoryAddress: ''
        }, {
          ...pendingCheckpoint2,
          tokenAddress: PRIMARY_TOKEN_ADDRESS,
          tclRepositoryAddress: ''
        }, {
          ...pendingCheckpoint1,
          tokenAddress: PRIMARY_TOKEN_ADDRESS,
          tclRepositoryAddress: ''
        }];

        t.deepEqual(expectedResponse, data);
        t.is(data.length, 3);
      }
    }));

  await updatePendingCheckpoint('checkpointaddress_1');
  await updatePendingCheckpoint('checkpointaddress_2');

  await readTokenCheckpoints(PRIMARY_TOKEN_ADDRESS)
    .then(res => res.matchWith({
      Just: ({value}) => {
        const data = value.toJS();

        const expectedResponse = [{
          ...pendingCheckpoint3,
          tokenAddress: PRIMARY_TOKEN_ADDRESS,
          tclRepositoryAddress: ''
        }, {
          ...pendingCheckpoint2,
          tokenAddress: PRIMARY_TOKEN_ADDRESS,
          tclRepositoryAddress: '',
          status: 'ready'
        }, {
          ...pendingCheckpoint1,
          tokenAddress: PRIMARY_TOKEN_ADDRESS,
          tclRepositoryAddress: '',
          status: 'ready'

        }];

        t.deepEqual(expectedResponse, data);
        t.is(data.length, 3);
      }
    }));

  await readPendingCheckpoints(PRIMARY_TOKEN_ADDRESS)
    .then(res => res.matchWith({
      Just: ({value}) => {
        const data = value.toJS();

        const expectedResponse = [
          pendingCheckpoint3
        ];

        t.deepEqual(expectedResponse, data);
        t.is(data.length, 1);
      }
    }));
});

serial('saveCheckpointsBatch should link the checkpoints to the token correctly', async t => {
  await createToken(PRIMARY_TOKEN_ADDRESS, 'token1', 'symbol1');
  const checkpoints = [
    {
      token: PRIMARY_TOKEN_ADDRESS,
      ...createCheckpointData(0)
    },
    {
      token: PRIMARY_TOKEN_ADDRESS,
      ...createCheckpointData(1)
    }
  ];
  await saveCheckpointsBatch(checkpoints);

  const readTokenCheckpointsResult = await readTokenCheckpoints(PRIMARY_TOKEN_ADDRESS);

  readTokenCheckpointsResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      const first = data
        .find(matchesProperty('checkpointName', checkpoints[0].checkpointName));
      const second = data
        .find(matchesProperty('checkpointName', checkpoints[1].checkpointName));

      const expectedResponse = [{
        ...createCheckpointData(1),
        tokenAddress: PRIMARY_TOKEN_ADDRESS,
        tclRepositoryAddress: '',
        status: 'ready'
      }, {
        ...createCheckpointData(0),
        tokenAddress: PRIMARY_TOKEN_ADDRESS,
        tclRepositoryAddress: '',
        status: 'ready'
      }];
      t.deepEqual(expectedResponse, [second, first]);
      t.is(data.length, 2);
    }
  });
});
