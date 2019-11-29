const logger = require('../helpers/logger')
const {partial} = require('../fn')

let driver;

const initQueryEngine = _driver => driver = _driver;

const runQuery = async (query, params) => {
  if(!driver) throw new Error('Please initialize the query engine by passing the db driver');
  let session;

  try {
    session = driver.session();
    const result = await session.run(query, params);

    return result.records;
  }
  catch(error) {
    const msg = `Error running a query: ${error.message}`;
    logger.error(msg);
    throw new Error(msg);
  }
  finally {
    session.close();
  }
}

const commit = (tx, session) => new Promise((resolve, reject) => {
  tx.commit()
    .subscribe({
      onCompleted: () => {
        session.close();
        resolve();
      },
      onError: error => {
        logger.error(`Could not commit transaction due to ${error.message}`);
        reject(error);
      }
    });
})

const rollback = tx => tx.rollback();

const transaction = () => {
  if(!driver) throw new Error('Please initialize the query engine by passing the db driver');
  let session;
  let tx;

  try {
    session = driver.session();
    tx = session.beginTransaction();

    return {
      run: (query, params) => tx.run(query, params),
      commit: partial(commit, tx, session),
      rollback: partial(rollback, tx)
    }
  }
  catch(error) {
    logger.error(`Error running a db transaction due to ${error.message}`);
    tx.rollback();
  }
}

module.exports = {
  initQueryEngine, 
  runQuery,
  transaction
}
