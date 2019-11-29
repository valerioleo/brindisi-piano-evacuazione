let total = 0;

const updateTotalFiatContribution = async size => {
  total = total + size;
}

const getTotalFiatContribution = async () => await total;

module.exports = {
  updateTotalFiatContribution,
  getTotalFiatContribution
}
