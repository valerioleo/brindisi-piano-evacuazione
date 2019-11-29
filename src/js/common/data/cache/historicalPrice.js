const {Map} = require('immutable')

let historicalPrices = Map()

const set = (ticker, day, pricePromise) => {
  historicalPrices = historicalPrices.setIn([ticker, day], pricePromise);
}

const get = (ticker, day) => historicalPrices.getIn([ticker, day])


module.exports = {set, get}
