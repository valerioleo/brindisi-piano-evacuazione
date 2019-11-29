import decode from 'jwt-decode';
import {Set} from 'immutable';
import {duration} from 'Common/helpers/time';
import {UserManager} from 'oidc-client';
import {getQueryParams} from './urlParser';
import {getItem, setItem, removeItem} from './storage';

let userManager;

export const createUserManager = (redirectUri, postLogOutUri) => new UserManager({
  authority: 'https://auth.coincierge.io/auth/realms/coincierge',
  client_id: 'cabinet-local-jRn+VK9hJW1MPUUlizcE',
  redirect_uri: redirectUri,
  response_type: 'id_token token',
  scope: 'openid profile email',
  post_logout_redirect_uri: postLogOutUri
});

export const setupAuth = (redirectUri, postLogOutUri) => {
  userManager = createUserManager(redirectUri, postLogOutUri);
};

const storeReferral = () => {
  const {ref} = getQueryParams();

  if(ref) {
    setItem(process.env.REFERRAL_KEY, ref);
  }
};

export const storeRedirectUrl = (url = window.location.pathname) => {
  setItem(REDIRECT_URL_KEY, url);
};

export const login = async () => {
  storeRedirectUrl();
  storeReferral();
  await userManager.signinRedirect();
};

export const getReferral = () => getItem(process.env.REFERRAL_KEY);

export const redirectUrl = () => {
  const url = getItem(process.env.REDIRECT_URL_KEY);
  window.location.href = url;
};

export const getIdToken = () => getItem(process.env.ID_TOKEN_KEY);

const clearIdToken = () => {
  removeItem(process.env.ID_TOKEN_KEY);
};

const clearAccessToken = () => {
  removeItem(process.env.ACCESS_TOKEN_KEY);
};

export const logout = async returnTo => {
  clearIdToken();
  clearAccessToken();

  await userManager.signoutRedirect({post_logout_redirect_uri: returnTo});
};

export const getAccessToken = () => getItem(process.env.ACCESS_TOKEN_KEY);

const getTokenExpirationDate = encodedToken => {
  const token = decode(encodedToken);
  if(!token.exp) {
    return null;
  }

  const date = new Date(0);
  date.setUTCSeconds(token.exp);

  return date;
};

const isTokenExpired = token => {
  const expirationDate = getTokenExpirationDate(token);
  return expirationDate < new Date();
};

export const isLoggedIn = () => {
  const idToken = getAccessToken();
  return !!idToken && !isTokenExpired(idToken);
};

export const requireAuth = (nextState, replace) => {
  if(!isLoggedIn()) {
    replace({pathname: '/'});
  }
};

// Helper function that will allow us to extract the access_token and id_token
export const getParameterByName = name => {
  const match = RegExp(`[#&]${name}=([^&]*)`).exec(window.location.hash);
  return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
};

// Get and store access_token in local storage
export const setAccessToken = () => {
  const accessToken = getParameterByName('access_token');

  if(accessToken) {
    setItem(process.env.ACCESS_TOKEN_KEY, accessToken);
  }
};

export const getUserId = () => {
  try {
    return decode(getAccessToken()).sub;
  }
  catch(error) {
    console.error(`Could not decode the jwt token due to ${error.message}`);
  }
};

// Get and store id_token in local storage
export const setIdToken = () => {
  const idToken = getParameterByName('id_token');

  if(idToken) {
    setItem(ID_TOKEN_KEY, idToken);
  }
};

export const resetOTP = () => {
  // allow user to scan the qr code
  setItem(OTP_VERIFIED, Date.now() + duration.hours(1));
};

export const storeOTPTokenDate = () => {
  setItem(OTP_VERIFIED, Date.now() + duration.hours(1));
};

export const isOTPTokenExpired = () => {
  const expirationDate = Number(getItem(OTP_VERIFIED));
  return Date.now() > expirationDate;
};

const getRoles = () => decode(getAccessToken()).roles;

export const isAdmin = () => {
  const roles = getRoles() || ['user'];

  const commonRoles = Set(['admin', 'super_admin'])
    .intersect(Set(roles));

  return commonRoles.size > 0;
};

export const authorize = (_userRoles, pageRoles) => {
  const userRoles = getRoles() || ['user'];

  const commonRoles = Set(pageRoles)
    .intersect(Set(userRoles));

  if(!userRoles.includes('admin') && commonRoles.size === 0) {
    window.location.href = INVESTOR_APP;
    logout(INVESTOR_APP);
  }
};
