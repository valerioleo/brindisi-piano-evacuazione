
const toSentenceCase = string => string
  .replace(/([A-Z])/g, ' $1')
  .replace(/^./, str => str.toUpperCase());

const toLowerCase = string => String(string).toLowerCase();

const stringStartsWith = (
  string,
  comparison
) => typeof string === 'string' && string.slice(0, 2) === comparison;

module.exports = {
  toSentenceCase,
  toLowerCase,
  stringStartsWith
};
