const {fetch} = require('./api');

const LEVELS = {
  EMERG: 0, // system is unusable
  ALERT: 1, // action must be taken immediately
  CRIT: 2, // critical conditions
  ERR: 3, // error conditions
  ERROR: 3, // because people WILL typo
  WARNING: 4, // warning conditions
  NOTICE: 5, // normal, but significant, condition
  INFO: 6, // informational message
  DEBUG: 7 // debug level message
};

const normalizeAdditionalFields = additionalFields => Object.entries(additionalFields)
  .reduce((acc, [key, value]) => {
    acc[`_${key}`] = value;
    delete acc[key];

    return acc;
  }, {});

const packMessage = (shortMessage, host, level, additionalFields) => {
  const msg = {
    version: '1.1',
    short_message: shortMessage,
    host,
    level
  };

  return JSON.stringify({...msg, ...normalizeAdditionalFields(additionalFields)});
};

const log = graylogHost => level => async (
  message,
  host,
  additionalFields = {}
) => {
  try {
    await fetch(
      graylogHost,
      'POST',
      {'Content-Type': 'application/json'},
      packMessage(message, host, level, additionalFields)
    );
  }
  catch(error) {
    // do nothing
  }
};

module.exports = graylogHost => ({
  info: log(graylogHost)(LEVELS.INFO),
  warning: log(graylogHost)(LEVELS.WARNING),
  error: log(graylogHost)(LEVELS.ERROR)
});
