const {createLogger, transports, format} = require('winston');
const GraylogTransport = require('./GraylogTransport');

const {timestamp} = format;

const grayLogOptions = {
  name: `[${process.env.NODE_ENV}] graylog`,
  graylog: {
    host: process.env.GRAYLOG_HOST
  },
  meta: {env: process.env.NODE_ENV}
};

const logger = createLogger({
  format: timestamp(),
  level: 'info',
  transports: [
    new GraylogTransport(grayLogOptions)
  ]
});

if(process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: format.simple()
  }));
}

module.exports = {
  info: msg => logger.info(msg),
  warn: msg => logger.warn(msg),
  error: msg => logger.error(msg),
  audit: (message, meta) => logger.info({message, type: 'audit', meta})
};
