const identity = require('folktale/core/lambda/identity');

// composition hack
// eslint-disable-next-line no-extend-native
Function.prototype['∘'] = function (f) {
  return x => this(f(x));
};

const partial = (fn, ...args) => (...restArgs) => fn.apply(this, args.concat(restArgs));
const partialSpread = (fn, obj = {}) => (restObj = {}) => fn.call(this, {...obj, ...restObj});

const prop = key => obj => obj[key];
const immutableGet = (key, modifier = identity) => obj => modifier(obj.get(key));
const immutableGetIn = (path, modifier = identity) => obj => modifier(obj.getIn(path));

const maybeValueReturn = (modifier = identity) => ({value}) => modifier(value);
const maybeValueGet = (key, modifier = identity) => ({value}) => modifier(value.get(key));
const maybeValueGetIn = (path, modifier = identity) => ({value}) => modifier(value.getIn(path));

const asyncDataReturn = (modifier = identity) => ({data}) => modifier(data);
const asyncDataGet = (key, modifier = identity) => ({data}) => modifier(data.get(key));
const asyncDataGetIn = (path, modifier = identity) => ({data}) => modifier(data.getIn(path));

const toJS = immutable => immutable.toJS();

const noop = () => {};
const constant = val => () => val;
const map = f => iterable => iterable.map(f);
const flatten = list => list.reduce(
  (a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), []
);

const removeNullProperties = obj => Object.keys(obj)
  .reduce((acc, key) => obj[key] === null ? acc : {...acc, [key]: obj[key]}, {});

const removeUndefinedProperties = obj => Object.keys(obj)
  .reduce((acc, key) => (obj[key] === undefined || obj[key] === null) ? acc : {...acc, [key]: obj[key]}, {});

const isFunction = func => typeof func === 'function';
const not = val => !val;
const last = arr => arr[arr.length - 1];
const head = arr => arr[0];
const ignoreProp = propKey => obj => {
  const {[propKey]: ingored, ...rest} = obj;

  return rest;
};

const ignoreProps = (props = []) => obj => props
  .reduce((acc, curr) => ignoreProp(curr)(acc), obj);

const removeLastItem = arr => {
  const copy = [...arr];
  copy.pop();
  return copy;
};

const ignoreAtIndex = (array, ignoreIndex) => array
  .reduce((acc, curr, i) => i === ignoreIndex ? acc : [...acc, curr], []);

const throwWithMessage = (message = '') => () => {
  throw Error(message);
};

module.exports = {
  identity,
  toJS,
  partial,
  partialSpread,
  prop,
  immutableGet,
  immutableGetIn,
  maybeValueReturn,
  maybeValueGet,
  maybeValueGetIn,
  asyncDataReturn,
  asyncDataGet,
  asyncDataGetIn,
  noop,
  constant,
  flatten,
  isFunction,
  not,
  head,
  last,
  removeNullProperties,
  removeUndefinedProperties,
  ignoreProp,
  ignoreProps,
  removeLastItem,
  ignoreAtIndex,
  throwWithMessage,
  map
};
