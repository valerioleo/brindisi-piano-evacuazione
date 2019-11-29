import {handleActions} from 'redux-actions';
import {Map} from 'immutable';
import {AsyncData} from 'Common/fn/monads/AsyncData';
import {LOAD_LAST_TWEETS, LOAD_LAST_MEDIUM_POSTS} from './systemActions';

const handleLoadLastTweets = (state, {payload}) => state.set('loadLastTweetsResult', payload.map(v => v.get('list')));
const handleLoadLasMediumPosts = (state, {payload}) => state.set('loadLastMediumPostsResult', payload.map(v => v.get('list')));

const SocialModel = Map({
  loadLastTweetsResult: AsyncData.Empty(),
  loadLastMediumPostsResult: AsyncData.Empty()
});

export default handleActions({
  [LOAD_LAST_TWEETS]: handleLoadLastTweets,
  [LOAD_LAST_MEDIUM_POSTS]: handleLoadLasMediumPosts
}, SocialModel);
