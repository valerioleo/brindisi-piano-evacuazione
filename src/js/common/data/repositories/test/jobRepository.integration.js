const {test, serial} = require('ava');
const {initDB} = require('../../../test/helpers');
const {ignoreProp, maybeValueGet} = require('../../../../common/fn');
const {createJobData} = require('../../../../common-api/test/helpers/job');
const {maybeValueReturn, toJS} = require('../../../fn');
const {
  createJob,
  readJobs,
  updateJob,
  createJobStep
} = require('../jobRepository');
const {cleanDb} = require('../testRepository');

test.before(async () => {
  await initDB();
});

test.afterEach.always(async () => {
  await cleanDb();
});

serial('createJob should create Job node with the provided data and return it', async t => {
  const jobData = createJobData({someDat: '123'});

  const expectedResult = {
    state: 'pending',
    ...jobData
  };

  const result = await createJob(jobData);
  result.matchWith({
    Just: ({value}) => {
      t.deepEqual(ignoreProp('id')(value.toJS()), expectedResult);
    },
    Nothing: () => t.fail()
  });

  const readJobsResult = await readJobs();
  readJobsResult.matchWith({
    Just: ({value}) => {
      t.deepEqual(
        value.toJS().map(ignoreProp('id')),
        [{...jobData, state: 'pending', steps: []}]
      );
    },
    Nothing: () => t.fail()
  });
});

serial('readJobs should return existing jobs', async t => {
  const jobData = createJobData({someDat: '123'});

  const expectedResult = {
    state: 'pending',
    steps: [],
    ...jobData
  };

  await createJob(jobData);
  await createJob(jobData);
  await createJob(jobData);

  const readJobsResult = await readJobs();
  readJobsResult.matchWith({
    Just: ({value}) => {
      t.deepEqual(
        value.toJS().map(ignoreProp('id')),
        [expectedResult, expectedResult, expectedResult]
      );
    },
    Nothing: () => t.fail()
  });
});

serial('readJobs should return existing jobs filtered by query', async t => {
  const jobData1 = createJobData({someDat: '123'});
  const jobData2 = createJobData({someDat: '321'});

  await createJob(jobData1);
  await createJob(jobData2);

  const readJobsResult = await readJobs({someDat: '321'});
  readJobsResult.matchWith({
    Just: ({value}) => {
      const expectedResult = {
        state: 'pending',
        steps: [],
        ...jobData2
      };

      t.deepEqual(
        value.toJS().map(ignoreProp('id')),
        [expectedResult]
      );
    },
    Nothing: () => t.fail()
  });
});

serial('readJobs should return Nothing if no jobs exist', async t => {
  const readJobsResult = await readJobs();
  const jobs = readJobsResult.matchWith({
    Just: maybeValueReturn(toJS),
    Nothing: t.fail.bind(t)
  });
  t.deepEqual(jobs, []);
});

serial('updateJob should update the Job correctly and return it', async t => {
  const jobData = createJobData({someDat: '123'});
  const createJobResult = await createJob(jobData);
  const jobId = createJobResult.matchWith({
    Just: maybeValueGet('id')
  });

  const readJobsResult = await readJobs();
  readJobsResult.matchWith({
    Just: ({value}) => {
      const expectedResult = {
        state: 'pending',
        steps: [],
        ...jobData
      };

      t.deepEqual(
        value.toJS().map(ignoreProp('id')),
        [expectedResult]
      );
    },
    Nothing: () => t.fail()
  });

  await updateJob({jobId, someDat: '000'});

  const readJobsResult2 = await readJobs();
  readJobsResult2.matchWith({
    Just: ({value}) => {
      const expectedResult = {
        state: 'pending',
        steps: [],
        ...jobData,
        someDat: '000'
      };

      t.deepEqual(
        value.toJS().map(ignoreProp('id')),
        [expectedResult]
      );
    },
    Nothing: () => t.fail()
  });
});

serial('createJobSteps should create JobSteps correctly', async t => {
  const jobData = createJobData({someDat: '123'});
  const createJobResult = await createJob(jobData);
  const jobId = createJobResult.matchWith({
    Just: maybeValueGet('id')
  });

  const readJobsResult = await readJobs();
  readJobsResult.matchWith({
    Just: ({value}) => {
      const expectedResult = {
        state: 'pending',
        steps: [],
        ...jobData
      };

      t.deepEqual(
        value.toJS().map(ignoreProp('id')),
        [expectedResult]
      );
    },
    Nothing: () => t.fail()
  });

  await createJobStep({jobId, jobStepMetadata1: 'abc'});
  const readJobsResult2 = await readJobs();
  readJobsResult2.matchWith({
    Just: ({value}) => {
      const expectedResult = {
        state: 'pending',
        steps: [{jobStepMetadata1: 'abc'}],
        ...jobData
      };

      t.deepEqual(
        value.toJS().map(job => ({
          ...ignoreProp('id')(job),
          steps: job.steps.map(ignoreProp('createdAt'))
        })),
        [expectedResult]
      );
    },
    Nothing: () => t.fail()
  });
});
