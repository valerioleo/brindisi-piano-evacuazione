const union = require('folktale/adt/union/union');

const ContractResult = union('ContractResult', {
  Tx: data => (data),
  Call: data => (data)
});

ContractResult.unwrapCallResult = function () {
  return this.matchWith({
    Tx: () => {
      throw new Error('Could not unwrap Tx Result');
    },
    Call: ({result}) => result
  });
};

ContractResult.unwrapTxResult = function () {
  return this.matchWith({
    Tx: ({result}) => result,
    Call: () => {
      throw new Error('Could not unwrap Call Result');
    }
  });
};

module.exports = {ContractResult};
