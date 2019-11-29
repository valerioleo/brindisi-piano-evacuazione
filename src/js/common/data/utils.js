const neo4j = require('neo4j-driver').v1;
const Maybe = require('folktale/maybe');
const {Map, List, fromJS} = require('immutable');
const omit = require('lodash.omit');
const isPlainObject = require('lodash.isplainobject');
const isNumber = require('lodash.isnumber');
const isBoolean = require('lodash.isboolean');
const mapValues = require('lodash.mapvalues');
const entries = require('../helpers/entries');
const {removeUndefinedProperties, constant} = require('../../common/fn');

const isNodeInstance = instance => instance instanceof neo4j.types.Node;
const isEdgeInstance = instance => instance instanceof neo4j.types.Relationship;

const unwrapCypherResult = (result, prop) => {
  const visitNode = value => {
    if(isNodeInstance(value) || isEdgeInstance(value)) {
      return iterateObj(value.properties);
    }

    if(isPlainObject(value)) {
      return iterateObj(value);
    }

    if(neo4j.isInt(value)) {
      return getInteger(value);
    }

    if(Array.isArray(value)) {
      return iterateArray(value);
    }

    if(typeof value === 'string') {
      return unescape(value);
    }

    return value;
  };

  const iterateArray = arr => arr.reduce((acc, value) => acc.push(visitNode(value)), List());

  const iterateObj = obj => Object.entries(obj)
    .reduce(
      (acc, [key, value]) => acc.set(key, visitNode(value)),
      Array.isArray(obj) ? List() : Map()
    );

  return Maybe.fromNullable(
    fromJS(
      result
        .map(r => prop ? r.get(prop) : r.toObject())
        .map(visitNode)
    )
  );
};

const unwrapCypherSingleResult = (result, prop) => unwrapCypherResult(result, prop)
  .matchWith({
    Just: ({value}) => Maybe.fromNullable(value.get(0)),
    Nothing: Maybe.Nothing
  });

const createPaginationResult = (name, result, countResult, prop) => Maybe.Just(fromJS({
  [name]: unwrapCypherResult(result, prop).getOrElse(List([])),
  count: getInteger(countResult[0].get('total'))
}));

// creates a string that will be used in Cypher
const createMatchString = entity => [...entries(removeUndefinedProperties(entity))]
  .reduce((acc, [key, val]) => [
    ...acc,
    isNumber(val) || isBoolean(val)
      ? `${key}:${val}`
      : `${key}:"${val}"`
  ],
  []);

const createMatchObj = entity => [...entries(entity)]
  .reduce(
    (acc, [key, value]) => {
      acc[key] = Number.isInteger(value)
        ? neo4j.int(value)
        : value;

      return acc;
    },
    {}
  );

const constructFilters = (node, filters = Map()) => {
  const str = fromJS(filters)
    .reduce((acc, value, filter) => acc.push(`${node}.${filter} =~ '(?i).*${value}.*'`),
      List())
    .join(' OR ');

  return str ? `WHERE ${str}` : '';
};

const constructCreateMatchString = (entity, omitProps = []) => [
  '{',
  createMatchString(omit(entity, omitProps)).join(','),
  '}'
]
  .join('');

const getInteger = int => int.toNumber ? int.toNumber() : int;

const getCount = result => {
  const val = result[0];

  return val
    ? Maybe.Just(
      getInteger(result[0].get('count'))
    )
    : Maybe.Just(0);
};

const removeId = ({id, ...other}) => other;

const normalizeParams = func => (...args) => {
  const normalizeParam = param => {
    if(typeof param === 'string') {
      const escaped = escape(param);
      if(escaped.startsWith('0x')) {
        return escaped.toLowerCase();
      }
      return escaped;
    }

    if(isPlainObject(param)) {
      return iterateObj(param);
    }

    if(Array.isArray(param)) {
      return iterateArray(param);
    }

    return param;
  };

  const iterateArray = arr => arr.reduce((acc, value) => [...acc, normalizeParam(value)], []);

  const iterateObj = obj => Object.entries(obj)
    .reduce((acc, [key, value]) => {
      acc[key] = normalizeParam(value);
      return acc;
    }, {});

  return func(...args.map(normalizeParam));
};

const normalizeQueries = queries => mapValues(queries, normalizeParams);

const exists = async query => {
  const result = await query();

  return result.matchWith({
    Just: constant(true),
    Nothing: constant(false)
  });
};

module.exports = {
  unwrapCypherResult,
  unwrapCypherSingleResult,
  createPaginationResult,
  constructFilters,
  createMatchObj,
  constructCreateMatchString,
  getInteger,
  getCount,
  removeId,
  createMatchString,
  normalizeParams,
  normalizeQueries,
  exists
};
