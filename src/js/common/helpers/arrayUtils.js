const shallowCompareArrays = (a = [], b = []) => {
  if(a.length !== b.length) {
    return false;
  }

  a.sort();
  b.sort();
  return a.reduce((acc, curr, i) => curr === b[i] && acc, true);
};

module.exports = {
  shallowCompareArrays
};
