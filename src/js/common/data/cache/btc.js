const {Map} = require('immutable')

let pendingTxs = Map()
let confirmedTxs = Map()
let historicalBtcPrices = Map()

const setPendingTxs = async txs => {
  pendingTxs = txs.reduce((acc, tx) => acc.set(tx.get('txHash'), true), Map())
}
const setConfirmedTxs = async txs => {
  confirmedTxs = txs.reduce((acc, tx) => acc.set(tx.get('txHash'), true), Map())
}

const addPendingTx = async tx => {
  pendingTxs = pendingTxs.set(tx, true);
}

const addConfirmedTx = async tx => {
  confirmedTxs = confirmedTxs.set(tx, true);
}

const hasPendingTx = async tx => pendingTxs.get(tx)
const hasConfirmedTx = async tx => confirmedTxs.get(tx)

module.exports = {
  setPendingTxs,
  setConfirmedTxs,
  addPendingTx,
  addConfirmedTx,
  hasPendingTx,
  hasConfirmedTx,
}
