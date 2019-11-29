const {test, serial} = require('ava');
const sinon = require('sinon');
const {initDB} = require('../../../test/helpers');
const {
  DEFAULT_USER_ID,
  createExtendedUser,
  deleteAccount
} = require('../../../../common-api/test/helpers/account');
const {
  createBounty,
  deleteBounty,
  deleteBounties,
  readPartialBounties,
  updateBountyStatus,
  getBountyById,
  updateFieldsBounty,
  createBountyApplication,
  updateBountyApplication,
  readBountyApplications,
  updateApproveBountyApplication,
  readUserBountyApplications,
  readUserApplicationForBounty
} = require('../bountyRepository');
const {
  createBountyData,
  createBountyApplicationData
} = require('../../../../common-api/test/helpers/bounty');
const {cleanDb} = require('../testRepository');

test.before(async () => {
  await initDB();
});

test.beforeEach(async t => {
  await createExtendedUser(DEFAULT_USER_ID);
});

test.afterEach.always(async () => {
  await cleanDb();
});

serial('createBounty should create bounty and return object', async t => {
  const bountyData = createBountyData();
  const createBountyResult = await createBounty(bountyData);

  await createBountyResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.not(data, null);
      t.false(Array.isArray(data));
      t.is(typeof data, 'object');
      t.true(Object.keys(data).length > 1);
      t.is(data.reward, bountyData.reward);
      t.is(data.tokensAllocated, bountyData.tokensAllocated);
      t.is(data.endDate, bountyData.endDate);
      t.is(data.description, bountyData.description);
      t.true(data.isActive);
      t.is(data.campaignName, bountyData.campaignName);
      t.is(data.startDate, bountyData.startDate);
    }
  });
});

serial('deleteBounty should remove bounty and return bountyId', async t => {
  const bountyData = createBountyData();
  const createBountyResult = await createBounty(bountyData);

  const bountyId = await createBountyResult.matchWith({
    Just: ({value}) => value.get('id')
  });

  const deleteBountyResult = await deleteBounty(bountyId);

  await deleteBountyResult.matchWith({
    Just: ({value}) => {
      t.deepEqual(value, {bountyId});
    }
  });
});

serial('deleteBounties should remove all bounties and return Nothing', async t => {
  const bountyData = createBountyData();
  const nestedBountyData = createBountyData(1);

  await createBounty(bountyData);
  await createBounty(nestedBountyData);

  const readPartialBountiesResult = await readPartialBounties({skip: 0, limit: 10});

  await readPartialBountiesResult.matchWith({
    Just: ({value}) => {
      const {bounties, count} = value.toJS();

      t.true(count > 0);
      t.true(bounties.length > 0);
    }
  });

  const deleteBountiesResult = await deleteBounties();

  await deleteBountiesResult.matchWith({
    Just: ({value}) => {
      t.is(value, 2);
    }
  });
});

serial('readPartialBounties should return array of objects', async t => {
  const bountyData = createBountyData();
  await createBounty(bountyData);

  const readPartialBountiesResult = await readPartialBounties({skip: 0, limit: 10});

  await readPartialBountiesResult.matchWith({
    Just: ({value}) => {
      const {bounties, count} = value.toJS();
      const data = bounties[0];

      t.is(count, 1);
      t.is(bounties.length, 1);
      t.is(data.reward, bountyData.reward);
      t.is(data.tokensAllocated, bountyData.tokensAllocated);
      t.is(data.endDate, bountyData.endDate);
      t.is(data.description, bountyData.description);
      t.true(data.isActive);
      t.is(data.campaignName, bountyData.campaignName);
      t.is(data.startDate, bountyData.startDate);
    }
  });
});

serial('updateBountyStatus should update bounty status data and return object', async t => {
  const bountyData = createBountyData();
  const createBountyResult = await createBounty(bountyData);

  const bountyId = await createBountyResult.matchWith({
    Just: ({value}) => value.get('id')
  });

  const updateBountyResult = await updateBountyStatus(bountyId, {isActive: false});

  await updateBountyResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.is(data.reward, bountyData.reward);
      t.is(data.tokensAllocated, bountyData.tokensAllocated);
      t.is(data.endDate, bountyData.endDate);
      t.is(data.description, bountyData.description);
      t.is(data.id, bountyId);
      t.false(data.isActive);
      t.is(data.campaignName, bountyData.campaignName);
      t.is(data.startDate, bountyData.startDate);
    }
  });
});

serial('getBountyById should return bounty object by Id', async t => {
  const bountyData = createBountyData();
  const nestedBountyData = createBountyData(2);

  await createBounty(nestedBountyData);
  const createBountyResult = await createBounty(bountyData);

  const bountyId = await createBountyResult.matchWith({
    Just: ({value}) => value.get('id')
  });

  const getBountyByIdResult = await getBountyById(bountyId);

  await getBountyByIdResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.not(data, null);
      t.false(Array.isArray(data));
      t.is(typeof data, 'object');
      t.is(data.reward, bountyData.reward);
      t.is(data.tokensAllocated, bountyData.tokensAllocated);
      t.is(data.description, bountyData.description);
      t.is(data.id, bountyId);
      t.true(data.isActive);
      t.is(data.campaignName, bountyData.campaignName);
      t.is(data.startDate, bountyData.startDate);
    }
  });
});

serial('updateFieldsBounty should update bounty data and return object', async t => {
  const bountyData = createBountyData();
  const createBountyResult = await createBounty(bountyData);

  const bountyId = await createBountyResult.matchWith({
    Just: ({value}) => value.get('id')
  });

  const newBountyData = createBountyData(2);
  const updateFieldsBountyResult = await updateFieldsBounty(bountyId, newBountyData);

  await updateFieldsBountyResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.not(data, null);
      t.false(Array.isArray(data));
      t.is(typeof data, 'object');
      t.is(data.reward, newBountyData.reward);
      t.is(data.tokensAllocated, newBountyData.tokensAllocated);
      t.is(data.description, newBountyData.description);
      t.is(data.id, bountyId);
      t.true(data.isActive);
      t.is(data.campaignName, newBountyData.campaignName);
      t.is(data.startDate, newBountyData.startDate);
      t.is(data.endDate, newBountyData.endDate);
    }
  });
});

serial('createBountyApplication should create application bounty and return object', async t => {
  const bountyData = createBountyData();
  const createBountyResult = await createBounty(bountyData);

  const bountyId = await createBountyResult.matchWith({
    Just: ({value}) => value.get('id')
  });

  const bountyApplicationData = createBountyApplicationData();
  const createBountyApplicationResult = await createBountyApplication(
    DEFAULT_USER_ID,
    {bountyId, ...bountyApplicationData}
  );

  await createBountyApplicationResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.not(data, null);
      t.false(Array.isArray(data));
      t.is(typeof data, 'object');
      t.is(data.link, bountyApplicationData.link);
      t.is(data.message, bountyApplicationData.message);
      t.false(data.isApproved);
      t.is(typeof data.applicationId, 'number');
    }
  });
});

serial('updateBountyApplication should update bounty application data and return object', async t => {
  const bountyData = createBountyData();
  const createBountyResult = await createBounty(bountyData);

  const bountyId = await createBountyResult.matchWith({
    Just: ({value}) => value.get('id')
  });

  const bountyApplicationData = createBountyApplicationData();
  const createApplicationBountyResult = await createBountyApplication(
    DEFAULT_USER_ID,
    {bountyId, ...bountyApplicationData}
  );

  const applicationId = await createApplicationBountyResult.matchWith({
    Just: ({value}) => value.get('applicationId')
  });

  const newBountyApplicationData = createBountyApplicationData(2);
  const updateBountyApplicationResult = await updateBountyApplication(
    DEFAULT_USER_ID,
    {applicationId, ...newBountyApplicationData}
  );

  await updateBountyApplicationResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.not(data, null);
      t.false(Array.isArray(data));
      t.is(typeof data, 'object');
      t.is(data.link, newBountyApplicationData.link);
      t.is(data.message, newBountyApplicationData.message);
      t.is(data.applicationId, applicationId);
      t.false(data.isApproved);
    }
  });
});

serial('readBountyApplications should return an object with array of bounty objects and a counter', async t => {
  const bountyData = createBountyData();
  const createBountyResult = await createBounty(bountyData);

  const bountyId = await createBountyResult.matchWith({
    Just: ({value}) => value.get('id')
  });

  const bountyApplicationData = createBountyApplicationData();
  const createBountyApplicationResult = await createBountyApplication(
    DEFAULT_USER_ID,
    {bountyId, ...bountyApplicationData}
  );
  await createBountyApplication(
    DEFAULT_USER_ID,
    {bountyId, ...bountyApplicationData}
  );

  const readBountyApplicationsResult = await readBountyApplications(bountyId, {skip: 0, limit: 10});

  await readBountyApplicationsResult.matchWith({
    Just: ({value}) => {
      const {list, count} = value.toJS();

      t.is(count, 2);
      t.is(list.length, 2);

      const data = list[0];

      t.is(data.link, bountyApplicationData.link);
      t.is(data.message, bountyApplicationData.message);
      t.is(data.id, bountyId);
      t.false(data.isApproved);
      t.is(data.userId, DEFAULT_USER_ID);
    }
  });
});

serial('updateApproveBountyApplication should update approved bounty application and return object', async t => {
  const bountyData = createBountyData();
  const createBountyResult = await createBounty(bountyData);

  const bountyId = await createBountyResult.matchWith({
    Just: ({value}) => value.get('id')
  });

  const bountyApplicationData = createBountyApplicationData();
  const createBountyApplicationResult = await createBountyApplication(
    DEFAULT_USER_ID,
    {bountyId, ...bountyApplicationData}
  );

  const applicationId = await createBountyApplicationResult.matchWith({
    Just: ({value}) => value.get('applicationId')
  });

  const updateApproveBountyApplicationResult = await updateApproveBountyApplication({
    bountyId,
    userId: DEFAULT_USER_ID,
    applicationId,
    isApproved: true
  });

  await updateApproveBountyApplicationResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.not(data, null);
      t.false(Array.isArray(data));
      t.is(typeof data, 'object');
      t.is(data.link, bountyApplicationData.link);
      t.is(data.message, bountyApplicationData.message);
      t.true(data.isApproved);
      t.is(data.applicationId, applicationId);
    }
  });
});

serial('readUserBountyApplications should return an object with array of bounty application objects and a counter by userId', async t => {
  const bountyData = createBountyData();
  const createBountyResult = await createBounty(bountyData);

  const bountyId = await createBountyResult.matchWith({
    Just: ({value}) => value.get('id')
  });

  const bountyApplicationData = createBountyApplicationData();
  const createBountyApplicationResult = await createBountyApplication(
    DEFAULT_USER_ID,
    {bountyId, ...bountyApplicationData}
  );

  const applicationId = await createBountyApplicationResult.matchWith({
    Just: ({value}) => value.get('applicationId')
  });

  const readUserBountyApplicationsResult = await readUserBountyApplications(
    DEFAULT_USER_ID,
    {skip: 0, limit: 10}
  );

  await readUserBountyApplicationsResult.matchWith({
    Just: ({value}) => {
      const {list, count} = value.toJS();

      t.is(count, 1);
      t.is(list.length, 1);

      const bounty = list[0];
      const application = list[0].application;

      t.is(bounty.reward, bountyData.reward);
      t.is(bounty.tokensAllocated, bountyData.tokensAllocated);
      t.is(bounty.endDate, bountyData.endDate);
      t.is(bounty.description, bountyData.description);
      t.is(bounty.id, bountyId);
      t.true(bounty.isActive);
      t.is(bounty.campaignName, bountyData.campaignName);
      t.is(bounty.startDate, bountyData.startDate);
      t.is(application.link, bountyApplicationData.link);
      t.is(application.message, bountyApplicationData.message);
      t.is(application.id, applicationId);
      t.false(application.isApproved);
    }
  });
});

serial('readUserApplicationForBounty should return bounty application object by userId and bountyId', async t => {
  const bountyData = createBountyData();
  const createBountyResult = await createBounty(bountyData);

  const bountyId = await createBountyResult.matchWith({
    Just: ({value}) => value.get('id')
  });

  const bountyApplicationData = createBountyApplicationData();
  const createBountyApplicationResult = await createBountyApplication(
    DEFAULT_USER_ID,
    {bountyId, ...bountyApplicationData}
  );

  const applicationId = await createBountyApplicationResult.matchWith({
    Just: ({value}) => value.get('applicationId')
  });

  const readUserApplicationForBountyResult = await readUserApplicationForBounty(
    DEFAULT_USER_ID,
    bountyId
  );

  await readUserApplicationForBountyResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();

      t.not(data, null);
      t.false(Array.isArray(data));
      t.is(typeof data, 'object');
      t.is(data.id, applicationId);
      t.is(data.link, bountyApplicationData.link);
      t.is(data.message, bountyApplicationData.message);
      t.false(data.isApproved);
    }
  });
});
