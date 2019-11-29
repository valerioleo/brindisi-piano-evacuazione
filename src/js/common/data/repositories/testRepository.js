const {runQuery} = require('../query');

const cleanDb = async () => {
  if(process.env.NODE_ENV === 'test') {
    await runQuery(
      `
        MATCH (n) 
        DETACH DELETE n
      `
    );
  }
}

module.exports = {cleanDb};
