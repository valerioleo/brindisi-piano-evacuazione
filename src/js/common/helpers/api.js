const https = require('https');
const fetch = require('node-fetch');
const FormData = require('form-data');
const {createQueryString} = require('./query');

// eslint-disable-next-line no-underscore-dangle
const _fetch = async (url, method = 'GET', headers = {}, body) => {
  try {
  // check this https://github.com/bitinn/node-fetch/issues/19#issuecomment-289709519
    const agent = new https.Agent({
      rejectUnauthorized: false
    });

    const options = {
      method,
      headers,
      agent,
      body
    };

    const response = await fetch(url, options);

    if([401, 404, 422, 500].includes(response.status)) {
      throw new Error(response.statusText);
    }

    if([201, 202, 204].includes(response.status)) {
      return response.text();
    }
    return response.json();
  }
  catch(error) {
    throw Error(`Fetch error: ${error.message}`);
  }
};

// used for application/x-www-form-urlencoded
const getFormContent = params => createQueryString(params);

// used for multipart/form-data content-type
const toFormData = data => Object.keys(data)
  .reduce((acc, curr) => {
    acc.append(curr, data[curr]);
    return acc;
  }, new FormData());

const hasQuery = ctx => (
  ctx.request.query
  && ctx.request.query != null
  && typeof ctx.request.query === 'object'
);

module.exports = {
  fetch: _fetch,
  toFormData,
  getFormContent,
  hasQuery
};
