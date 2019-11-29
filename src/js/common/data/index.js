const neo4j = require('neo4j-driver').v1;
const logger = require('../helpers/logger');
const {initQueryEngine} = require('./query');

const config = {
  maxConnectionPoolSize: 500,
  connectionAcquisitionTimeout: 300000
};

const initDB = () => new Promise((resolve, reject) => {
  try {
    const driver = neo4j.driver(
      process.env.DB_URL,
      neo4j.auth.basic(process.env.DB_USERNAME, process.env.DB_PASSWORD),
      config
    );

    driver.onCompleted = function (error) {
      resolve(driver);
      initQueryEngine(driver);
      logger.info('Connected to the db');
    };

    driver.onError = function (error) {
      logger.error(`Driver instantiation failed: ${error.message}`);
      throw error;
    };
  }
  catch(error) {
    reject(error);
  }
});

module.exports = {initDB};
