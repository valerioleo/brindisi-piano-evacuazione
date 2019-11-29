const Maybe = require('folktale/maybe');
const {maybeValueReturn} = require('../../fn');

// This is useful when we can tell with high confidence that the 
// value is Just i.e. knowing that orElse was used to return always Just
Maybe.get = function() {
  return this.matchWith({
    Just: maybeValueReturn(),
    Nothing: () => {
      throw new Error('Can get value from Nothing');
    }
  });
};
