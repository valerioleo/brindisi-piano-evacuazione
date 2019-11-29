/* eslint-disable import/prefer-default-export */
import {asyncDataGet} from 'Common/fn';

export const getDefaultAccountFromState = state => state.common.account
  .get('getDefaultAccountResult')
  .mapPattern('Success', '', asyncDataGet('defaultAccount'));

export const getContractEventFromState = (state, contractAddress, eventName) => state
  .safeGetIn(['getContractEventsResult', contractAddress, eventName]);
