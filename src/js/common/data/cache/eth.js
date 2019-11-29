const {Map} = require('immutable');

let confirmedTxs = Map();
let pendingTxs = Map();

const setConfirmedTxs = async txs => {
  confirmedTxs = txs.reduce((acc, tx) => acc.set(tx.get('txHash'), true), Map());
};

const addConfirmedTx = async tx => {
  confirmedTxs = confirmedTxs.set(tx, true);
};

const hasConfirmedTx = async tx => confirmedTxs.get(tx);

const setPendingTxs = async txs => {
  pendingTxs = txs.reduce((acc, tx) => acc.set(tx.get('txHash'), true), Map());
};

const addPendingTx = async tx => {
  pendingTxs = pendingTxs.set(tx, true);
};

const hasPendingTx = async tx => pendingTxs.get(tx);

module.exports = {
  setConfirmedTxs,
  addConfirmedTx,
  hasConfirmedTx,
  setPendingTxs,
  addPendingTx,
  hasPendingTx
};
