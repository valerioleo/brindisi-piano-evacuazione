const os = require('os');
const Transport = require('winston-transport');
const graylog = require('./graylog');

const getMessageLevel = (function () {
  const levels = {
    emerg: 'emergency',
    alert: 'alert',
    crit: 'critical',
    error: 'error',
    warning: 'warning',
    warn: 'warning',
    notice: 'notice',
    info: 'info',
    debug: 'debug'
  };
  return function (winstonLevel) {
    return levels[winstonLevel] || levels.info;
  };
}());

/** Class representing the Graylog2 Winston Transport */
class GraylogTransport extends Transport {
  /**
   * Create the transport
   * @param {Object} options - The options for configuring the transport.
   */
  constructor(options) {
    super(options);

    this.name = options.name || 'graylog';
    this.host = options.host || os.hostname();
    this.meta = options.meta;

    const {info, error} = graylog(options.graylog.host);

    this.info = info;
    this.error = error;
  }

  /**
   * Log a message to Graylog2.
   *
   * @param {Object} info - An object containing the `message` and `info`.
   * @param {function} callback - Winston's callback to itself.
   */
  log(info, callback) {
    const {
      message,
      level,
      type,
      meta
    } = info;
    const cleanedMessage = message || '';
    const shortMessage = cleanedMessage.substring(0, 100);

    // prettier-ignore
    setImmediate(() => {
      switch(getMessageLevel(level)) {
        case 'info': {
          if(type === 'audit') {
            this.info(shortMessage, this.host, {type, ...meta});
          }
          break;
        }
        case 'error':
          this.error(shortMessage, this.host, this.meta);
          break;
      }
    });

    callback();
  }

  /**
   * Closes the Graylog2 Winston Transport.
   */
  close() {
    this.graylog2Client.close();
  }
}

module.exports = GraylogTransport;
