export const getQueryParams = () => {
  const query =  location.search || location.hash; //document.getElementById('coinlab-ico-widget').contentWindow.location.search;
  if (!query) return {};

  return (/^[?#]/.test(query) ? query.slice(1) : query)
    .split('&')
    .reduce((params, param) => {
      const [key, value] = param.split('=');
      params[key] = value ? decodeURIComponent(value.replace(/\+/g, ' ')) : '';
      return params;
    }, {});
}
