const entries = function* (obj) {
  for(const key of Object.keys(obj)) {
    yield [key, obj[key]];
  }
};

module.exports = entries;
