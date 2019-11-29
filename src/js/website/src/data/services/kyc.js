import {MANUAL_USER_TYPE} from 'Common/constants'

export const hasRestrictedCountryOfResidence = (userProfile, parameters) => {
  if (userProfile.get('creationType') === MANUAL_USER_TYPE) {
    return false;
  }
  
  const countryRestriction = parameters.get('countryRestriction', []);
  const countryOfResidence = userProfile.getIn(['kyc', 'countryOfResidence']);

  return countryRestriction
    .includes(countryOfResidence);
}

export const isAmlClean = aml => {
  const {isOnPepList, isOnFraudList, isOnWatchList} = aml.toJS();
  return !isOnPepList && !isOnFraudList && !isOnWatchList;
}