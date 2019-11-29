import {createAction} from 'redux-actions';
import fetch from 'Website/data/services/api';

export const LOAD_LAST_TWEETS = 'SOCIAL:LOAD_LAST_TWEETS';
export const LOAD_LAST_MEDIUM_POSTS = 'SOCIAL:LOAD_LAST_MEDIUM_POSTS';

export const loadLastTweetsRoot = fetch => () => {
  const async = fetch('/tweets', 'GET');

  return createAction(
    LOAD_LAST_TWEETS
  )({async});
};

export const loadLastMediumPostsRoot = fetch => () => {
  const async = fetch('/medium-posts', 'GET');

  return createAction(
    LOAD_LAST_MEDIUM_POSTS
  )({async});
};

export const loadLastTweets = loadLastTweetsRoot(fetch);
export const loadLastMediumPosts = loadLastMediumPostsRoot(fetch);
