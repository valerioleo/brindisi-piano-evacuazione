import {combineReducers} from 'redux';
import {reducer as formReducer} from 'redux-form';
import systemReducer from '../system/systemReducer';

export default combineReducers({
  form: formReducer,
  system: systemReducer
});
