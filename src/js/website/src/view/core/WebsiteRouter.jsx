import React, {Component} from 'react';
import {Route, BrowserRouter as Router, Switch} from 'react-router-dom';
import {hot} from 'react-hot-loader/root';
import HomePage from 'Website/view/pages/home-page';

class RouterComponent extends Component {
  // There is no need to update this component once it's been mounted
  shouldComponentUpdate() {
    return false;
  }

  render() {
    return (
      <Router>
        <Switch>
          <Route exact path='/' component={HomePage}/>
        </Switch>
      </Router>
    );
  }
}

export default hot(RouterComponent);
