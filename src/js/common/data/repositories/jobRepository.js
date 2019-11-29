const {runQuery} = require('../query');
const {
  createMatchString,
  unwrapCypherResult,
  unwrapCypherSingleResult,
  normalizeParams
} = require('../utils');

const createJob = async jobData => {
  const {
    jobType,
    ...rest
  } = jobData;

  try {
    const result = await runQuery(
      `
        CREATE (j:Job {
          type: "${jobType}",
          ${createMatchString(rest)},
          state: 'pending'
        })
        RETURN j {
          .*,
          id: ID(j)
        }
      `
    );
    return unwrapCypherSingleResult(result, 'j');
  }
  catch(error) {
    throw new Error(`Error creating ${jobData.jobType} Job: ${error.message}`);
  }
};

const createJobStep = async ({jobId, ...rest}) => {
  try {
    const result = await runQuery(
      `
        MATCH (j:Job)
        WHERE ID(j)=${jobId}
        MERGE (j)-[:HAS_STEP]->(js:JobStep)
        SET js+={
          createdAt: ${Date.now()},
          ${createMatchString(rest)}
        }
        RETURN j {
          .*,
          id: ID(j)
        }
      `
    );
    return unwrapCypherSingleResult(result, 'j');
  }
  catch(error) {
    throw new Error(`Error creating JobStep forJob ${jobId}: ${error.message}`);
  }
};

const readJobs = async (query = {}) => {
  try {
    const result = await runQuery(
      `
      MATCH (j:Job {${createMatchString(query)}})
      OPTIONAL MATCH (j)-[:HAS_STEP]->(js:JobStep)
      WITH j, js
      ORDER BY js.createdAt

      RETURN j {
        .*,
        steps: collect(js),
        id: ID(j)
      }
      `
    );
    return unwrapCypherResult(result, 'j');
  }
  catch(error) {
    throw new Error(`Error fetching Jobs: ${error.message}`);
  }
};

const updateJob = async ({jobId, ...data}) => {
  try {
    const result = await runQuery(
      `
      MATCH (j:Job)
      WHERE ID(j) = ${jobId}
      SET j+= {${createMatchString(data)}}
      RETURN j {
        .*,
        id: ID(j)
      }
      `
    );
    return unwrapCypherSingleResult(result, 'j');
  }
  catch(error) {
    throw new Error(`Error updating Job ${jobId}: ${error.message}`);
  }
};

module.exports = {
  createJob: normalizeParams(createJob),
  createJobStep: normalizeParams(createJobStep),
  readJobs: normalizeParams(readJobs),
  updateJob: normalizeParams(updateJob)
};
