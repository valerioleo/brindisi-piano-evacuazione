const {runQuery} = require('../query');
const {unwrapCypherResult, normalizeParams, unwrapCypherSingleResult} = require('../utils');

const createCompanyProfile = async (name = '', address = '', logo = '') => {
  try {
    const result = await runQuery(
      `
        CREATE (c:Company {
          name: "${name}",
          address: "${address}",
          logo: "${logo}"
        })
        RETURN c {
          .*,
          id: ID(c)
        }
      `
    );
    return unwrapCypherResult(result, 'c');
  }
  catch(error) {
    throw new Error(`Error creating company profile due to ${error.message}`);
  }
};

const updateCompanyProfile = async (name = '', address = '') => {
  try {
    const result = await runQuery(
      `
      MERGE (c:Company)
      ON MATCH SET c += {
        name: "${name}",
        address: "${address}"
      }
      ON CREATE SET c += {
        name: "${name}",
        address: "${address}"
      }
      RETURN c {
        .*,
        id: ID(c)
      }
      `
    );
    return unwrapCypherResult(result, 'c');
  }
  catch(error) {
    throw new Error(`Error updating company profile due to ${error.message}`);
  }
};

const updateCompanyProfileLogo = async logo => {
  try {
    const result = await runQuery(
      `
      MERGE (c:Company)
      ON MATCH SET c.logo="${logo}"
      ON CREATE SET c.logo="${logo}"
      RETURN c {
        .*,
        id: ID(c)
      }
      `
    );
    return unwrapCypherResult(result, 'c');
  }
  catch(error) {
    throw new Error(`Error updating company profile due to ${error.message}`);
  }
};

const getCompanyProfile = async () => {
  try {
    const result = await runQuery(
      `
      MATCH (c:Company)
      RETURN c {
        .*,
        id: ID(c)
      }
      `
    );

    return unwrapCypherSingleResult(result, 'c');
  }
  catch(error) {
    throw new Error(`Error reading company profile due to ${error.message}`);
  }
};

const deleteCompanyProfie = async () => {
  try {
    const result = await runQuery(
      `
      MATCH (c:Company)
      DELETE c
      `
    );

    return unwrapCypherResult(result);
  }
  catch(error) {
    throw new Error(`Error reading company profile due to ${error.message}`);
  }
};

module.exports = {
  createCompanyProfile: normalizeParams(createCompanyProfile),
  updateCompanyProfile: normalizeParams(updateCompanyProfile),
  getCompanyProfile: normalizeParams(getCompanyProfile),
  deleteCompanyProfie: normalizeParams(deleteCompanyProfie),
  updateCompanyProfileLogo: normalizeParams(updateCompanyProfileLogo)
};
