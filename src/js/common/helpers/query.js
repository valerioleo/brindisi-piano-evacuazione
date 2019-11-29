const qs = require('qs');

const createQueryString = (obj = {}, options = {}) => {
  const {
    skipNulls = true,
    ...rest
  } = options;

  return qs.stringify(obj, {skipNulls, ...rest});
};

const stringifyRequestData = data => (
  qs.stringify(data, {
    serializeDate: d => Math.floor(d.getTime() / 1000)
  })
  // Don't use strict form encoding by changing the square bracket control
  // characters back to their literals. This is fine by the server, and
  // makes these parameter strings easier to read.
    .replace(/%5B/g, '[')
    .replace(/%5D/g, ']')
);

module.exports = {
  createQueryString,
  stringifyRequestData
};
