const {runQuery} = require('../query');
const {unwrapCypherResult, normalizeParams} = require('../utils');

const storeMonitorData = async (address, eventName, blockHeight) => {
  try {
    return await runQuery(
      `
        MERGE (md:MonitorData {address: '${address}'})
        ON CREATE SET md += {${eventName}LastBlock: ${blockHeight}}
        ON MATCH SET md.${eventName}LastBlock = ${blockHeight}
      `
    );
  }
  catch(error) {
    throw new Error(`Error updating monitor data for smart contract ${address}: ${error.message}`);
  }
};

const readMonitorData = async address => {
  try {
    const result = await runQuery(
      `
        MATCH (md:MonitorData {address: '${address}'})
        RETURN md
      `
    );

    return unwrapCypherResult(result, 'md');
  }
  catch(error) {
    throw new Error(`Error reading monitor data for smart contract ${address} due to: ${error.message}`);
  }
};

const readLastScannedBlockByEvent = async (address, eventName) => {
  try {
    const result = await runQuery(
      `
        MATCH (md:MonitorData {address: '${address}'})
        RETURN md.${eventName}LastBlock
      `
    );

    return unwrapCypherResult(result)
      .map(v => v.getIn([0, `md.${eventName}LastBlock`]));
  }
  catch(error) {
    throw new Error(`Error reading monitor data for smart contract ${address} and event ${eventName} due to: ${error.message}`);
  }
};

module.exports = {
  storeMonitorData: normalizeParams(storeMonitorData),
  readMonitorData: normalizeParams(readMonitorData),
  readLastScannedBlockByEvent: normalizeParams(readLastScannedBlockByEvent)
};
