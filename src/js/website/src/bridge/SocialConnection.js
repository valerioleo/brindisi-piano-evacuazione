import {connect} from 'react-redux'
import {loadLastTweets, loadLastMediumPosts} from 'Website/data/social/socialActions';

export default SocialPage => {
  const mapStateToProps = state => ({
    social: state.social
  });

  const mapDispatchToProps = dispatch => ({
    loadLastTweets: (dispatch)['∘'](loadLastTweets),
    loadLastMediumPosts: (dispatch)['∘'](loadLastMediumPosts)
  });

  return connect(mapStateToProps, mapDispatchToProps)(SocialPage);
};
