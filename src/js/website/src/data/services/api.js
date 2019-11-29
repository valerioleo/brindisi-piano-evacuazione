const coinciergeApi = async (
  url,
  method = 'GET',
  body = {},
  headers,
  fileUpload
) => {
  const options = {
    method,
    headers
  };

  if(!fileUpload) {
    options.headers['content-type'] = 'application/json';
  }

  // disallow body inclusion for methods that don't support it
  if(method !== 'GET' && method !== 'DELETE') {
    options.body = fileUpload ? body : JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if(response.status === 401) {
    throw new Error(response.status);
  }

  if(response.status >= 400) {
    const text = await response.text();
    throw new Error(text);
  }

  // including the deleted resource is useful for any further actions
  if(response.status === 204) return {result: body};

  return await response.json();
};

export default coinciergeApi;
