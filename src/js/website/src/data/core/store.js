import {createStore, applyMiddleware, compose} from 'redux';
import thunk from 'redux-thunk';
import taskMiddleware from 'Website/data/middleware/taskMiddleware';

const composeEnhancer = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

// create a store that has redux-thunk middleware enabled
export default (reducer, preloadState) => createStore(
  reducer,
  preloadState,
  composeEnhancer(applyMiddleware(taskMiddleware, thunk))
);
