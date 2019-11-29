const adaptCreateTransaction = (transactionData = {}) => {
  const {params, ...rests} = transactionData;

  return {
    params: JSON.stringify(params),
    ...rests
  };
};

module.exports = {
  adaptCreateTransaction
};
