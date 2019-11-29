/* eslint-disable max-len */
const {test, serial} = require('ava');
const matchesProperty = require('lodash.matchesproperty');
const {from} = require('rxjs');
const {concatMap} = require('rxjs/operators');
const {initDB} = require('../../../test/helpers');
const {
  createToken,
  readToken,
  saveLastSuccessFullBlock,
  getLastSuccessfullBlock,
  createTokenBatch,
  tokenExists,
  loadTokens,
  removeToken,
  getTokensByInterface,
  createTokenTransfer,
  readTokenTransfersByToken,
  readHolderBalance,
  readTokenBalances,
  updateTokenHolderData,
  readHoldersCountries,
  addFileToToken,
  readTokenFiles,
  updateToken,
  removeTokenFile
} = require('../tokenRepository');
const {updateTokenSale, createTokenSaleBatch} = require('../tokenSaleRepository');
const {
  ignoreProps,
  ignoreProp,
  maybeValueReturn,
  toJS
} = require('../../../../common/fn');
const {VALID_ETH_ADDRESS, TOKEN_RECIPIENT_ADDRESS, createExtendedUser} = require('../../../../common-api/test/helpers/account');
const {saveKyc} = require('../../../../common-api/test/helpers/kyc');
const {ZERO_ADDRESS} = require('../../../../eth-utils/data/v1/address');
const {PRIMARY_TOKEN_ADDRESS, createTokenData, toDbTokenData} = require('../../../../common-api/test/helpers/token');
const {createNTransfers, getTotalTranferred} = require('../../../../common-api/test/helpers/transfer');
const {cleanDb} = require('../testRepository');

const token1 = createTokenData('1');
const token2 = createTokenData('2');
const token3 = createTokenData('3', {tokenInterface: 'CNG1400'});

test.before(async () => {
  await initDB();
});

test.afterEach.always(async () => {
  await cleanDb();
});

serial('saveLastSuccessFullBlock should save the block height and return the value', async t => {
  const blockHeight = 10;
  const saveBlockHeightResult = await saveLastSuccessFullBlock(blockHeight);

  saveBlockHeightResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();
      const {lastSuccessfullHeight} = data[0].td;
      t.deepEqual(blockHeight, lastSuccessfullHeight);
    }
  });
});

serial('saveLastSuccessFullBlock should update the block height and return the value', async t => {
  const blockHeight1 = 10;
  const blockHeight2 = 20;
  await saveLastSuccessFullBlock(blockHeight1);
  const saveBlockHeightResult2 = await saveLastSuccessFullBlock(blockHeight2);

  saveBlockHeightResult2.matchWith({
    Just: ({value}) => {
      const data = value.toJS();
      const {lastSuccessfullHeight} = data[0].td;
      t.deepEqual(blockHeight2, lastSuccessfullHeight);
    }
  });
});

serial('getLastSuccessfullBlock should return the last successfull block height', async t => {
  const blockHeight1 = 10;
  const blockHeight2 = 20;
  await saveLastSuccessFullBlock(blockHeight1);
  await saveLastSuccessFullBlock(blockHeight2);

  const getBlockHeightResult = await getLastSuccessfullBlock();

  getBlockHeightResult.matchWith({
    Just: ({value}) => {
      const data = value.toJS();
      const {lastSuccessfullHeight} = data[0].height;
      t.deepEqual(blockHeight2, lastSuccessfullHeight);
    }
  });
});

serial('readToken should return the Token and a tokenSale info', async t => {
  await createToken(...Object.values(token1));
  const readTokenResult = await readToken(token1.tokenAddress);

  readTokenResult.matchWith({
    Just: ({value}) => {
      const data = ignoreProps(['id', 'fillPositionAutomatically', 'isOpen', 'price'])(value.toJS());
      t.deepEqual(toDbTokenData(token1), data);
    }
  });
});

serial('createTokenBatch should save the tokens and return the result', async t => {
  const saveTokenResult = await createTokenBatch([token1, token2]);

  saveTokenResult.matchWith({
    Just: ({value}) => {
      const tokens = value.toJS();
      t.truthy(tokens.find(({address}) => address === token1.tokenAddress));
      t.truthy(tokens.find(({address}) => address === token2.tokenAddress));
    },
    Nothing: () => t.fail('Error saving tokens')
  });
});

serial('tokenExists should return true if the token exists', async t => {
  await createTokenBatch([token1, token2]);

  const tokenExistsResult = await tokenExists(token1.tokenAddress);

  const result = tokenExistsResult.matchWith({
    Just: maybeValueReturn(v => v),
    Nothing: () => t.fail('tokenExists returned nothing')
  });

  t.is(result, true);
});

serial('tokenExists should return Maybe.Nothing() if the token does not exists', async t => {
  await createTokenBatch([token1, token2]);

  const tokenExistsResult = await tokenExists('nonExistent');

  tokenExistsResult.matchWith({
    Just: () => t.fail(),
    Nothing: () => t.pass()
  });
});

serial('tokenExists should return Maybe.Nothing() if the token exists but is soft deleted', async t => {
  await createTokenBatch([token1, token2]);
  await removeToken(token1.tokenAddress);

  const tokenExistsResult = await tokenExists(token1.tokenAddress);

  tokenExistsResult.matchWith({
    Just: () => t.fail(),
    Nothing: () => t.pass()
  });
});

serial('loadToken should return all the tokens that are not deleted', async t => {
  await createTokenBatch([token1, token2]);

  const loadTokensResult = await loadTokens();
  loadTokensResult.matchWith({
    Just: ({value}) => {
      const {tokens} = value.toJS();
      t.truthy(tokens.find(token => token.address === token1.tokenAddress));
      t.truthy(tokens.find(token => token.address === token2.tokenAddress));
    }
  });
});

serial('loadToken should return empty array if there are no tokens to return', async t => {
  await createTokenBatch([token1, token2]);
  await removeToken(token1.tokenAddress);
  await removeToken(token2.tokenAddress);

  const result = await loadTokens();
  result.matchWith({
    Just: ({value}) => {
      t.is(value.get('tokens').size, 0);
    }
  });
});

serial('loadTokens should only return tokens on sale', async t => {
  const token1 = {
    tokenAddress: 'tokenaddress1',
    name: 'name',
    symbol: 'symbol',
    tokenInterface: 'tokenInterface',
    blockHeight: 'blockHeight',
    tclController: 'tclController',
    tclRepository: 'tclController'
  };
  const token2 = {
    tokenAddress: 'tokenaddress2',
    name: 'name',
    symbol: 'symbol',
    tokenInterface: 'tokenInterface',
    blockHeight: 'blockHeight',
    tclController: 'tclController',
    tclRepository: 'tclController'
  };

  await createTokenBatch([token1, token2]);
  await updateTokenSale(token1.tokenAddress, {price: 1, isOpen: true, fillPositionAutomatically: true});

  const loadTokensResult = await loadTokens({isOpen: true});

  loadTokensResult.matchWith({
    Just: ({value}) => {
      const {tokens} = value.toJS();

      t.is(tokens.length, 1);
      t.truthy(tokens.find(token => token.address === token1.tokenAddress));
    }
  });
});

serial('loadTokens should only return tokens with sale closed', async t => {
  const token1 = {
    tokenAddress: 'tokenaddress1',
    name: 'name',
    symbol: 'symbol',
    tokenInterface: 'tokenInterface',
    blockHeight: 'blockHeight',
    tclController: 'tclController',
    tclRepository: 'tclController'
  };
  const token2 = {
    tokenAddress: 'tokenaddress2',
    name: 'name',
    symbol: 'symbol',
    tokenInterface: 'tokenInterface',
    blockHeight: 'blockHeight',
    tclController: 'tclController',
    tclRepository: 'tclController'
  };
  const token3 = {
    tokenAddress: 'tokenaddress3',
    name: 'name',
    symbol: 'symbol',
    tokenInterface: 'tokenInterface',
    blockHeight: 'blockHeight',
    tclController: 'tclController',
    tclRepository: 'tclController'
  };

  await createTokenBatch([token1, token2, token3]);
  await updateTokenSale(token1.tokenAddress, {price: 1, isOpen: true, fillPositionAutomatically: true});
  await updateTokenSale(token3.tokenAddress, {price: 1, isOpen: false, fillPositionAutomatically: true});

  const loadTokensResult = await loadTokens({isOpen: false});

  loadTokensResult.matchWith({
    Just: ({value}) => {
      const {tokens} = value.toJS();

      t.is(tokens.length, 1);
      t.truthy(tokens.find(token => token.address === token3.tokenAddress));
    }
  });
});

serial('loadTokens should return empty array if there are no tokens on sale', async t => {
  const token1 = {
    tokenAddress: 'tokenaddress1',
    name: 'name',
    symbol: 'symbol',
    tokenInterface: 'tokenInterface',
    blockHeight: 'blockHeight',
    price: 1,
    tclController: 'tclController',
    tclRepository: 'tclController'
  };
  const token2 = {
    tokenAddress: 'tokenaddress2',
    name: 'name',
    symbol: 'symbol',
    tokenInterface: 'tokenInterface',
    blockHeight: 'blockHeight',
    price: 1,
    tclController: 'tclController',
    tclRepository: 'tclController'
  };

  await createTokenBatch([token1, token2]);

  const loadTokensResult = await loadTokens({isOpen: true});
  loadTokensResult.matchWith({
    Just: ({value}) => {
      const {tokens} = value.toJS();
      t.is(tokens.length, 0);
    }

  });
});

serial('getTokensByInterface should return the tokens for an interface', async t => {
  await createTokenBatch([token1, token2, token3]);

  await getTokensByInterface(token1.tokenInterface)
    .then(tokensResult => tokensResult.matchWith({
      Just: ({value: tokens}) => {
        t.is(tokens.size, 2);
        t.truthy(tokens.find(token => token.get('address') === token1.tokenAddress));
        t.truthy(tokens.find(token => token.get('address') === token2.tokenAddress));
      },
      Nothing: t.fail.bind(t)
    }));

  await getTokensByInterface(token3.tokenInterface)
    .then(tokensResult => tokensResult.matchWith({
      Just: ({value: tokens}) => {
        t.is(tokens.size, 1);
        t.truthy(tokens.find(token => token.get('address') === token3.tokenAddress));
      },
      Nothing: t.fail.bind(t)
    }));
});

serial('getTokensByInterface should empty array if no tokens are found for an interface', async t => {
  await createTokenBatch([token1, token2]);

  const getTokensByInterfaceResult = await getTokensByInterface('nonExistent');

  const tokens = getTokensByInterfaceResult.matchWith({
    Just: maybeValueReturn(toJS),
    Nothing: t.fail.bind(t)
  });
  t.deepEqual(tokens, []);
});

serial('createTokenTransfer should create the token transfer and return it', async t => {
  const transfer = {
    address: token1.tokenAddress,
    txHash: 'txhash1',
    logIndex: 1,
    amount: 10,
    from: TOKEN_RECIPIENT_ADDRESS,
    to: '0x456',
    timestamp: 1,
    blockNumber: 1
  };
  const expectedTransfers = [{
    size: transfer.amount,
    createdAt: transfer.timestamp,
    ...ignoreProps(['address', 'amount', 'timestamp'])(transfer)
  }];

  await createTokenBatch([token1]);
  const createTransferResult = await createTokenTransfer(transfer);

  const transfersResult = createTransferResult.matchWith({
    Just: maybeValueReturn(v => v.toJS()),
    Nothing: () => t.fail()
  });

  const filteredResult = transfersResult
    .map(ignoreProps(['id']));

  t.is(transfersResult.length, 1);
  t.deepEqual(expectedTransfers, filteredResult);
});

serial('readTokenTransfersByToken should return the transfers for a token', async t => {
  const transfers = createNTransfers(5, {to: '0x456', tokenAddress: token1.tokenAddress});

  const expectedTransfers = transfers
    .map(t => ({
      size: t.amount,
      createdAt: t.timestamp,
      tokenAddress: t.address,
      tokenSymbol: null,
      tokenName: null,
      ...ignoreProps(['address', 'amount', 'timestamp'])(t)
    }));

  await createTokenBatch([token1]);

  await from(transfers)
    .pipe(
      concatMap(async transfer => {
        await createTokenTransfer(transfer);
        await updateTokenHolderData(transfer);
      })
    ).toPromise();

  const readTokenTransfers = await readTokenTransfersByToken(token1.tokenAddress);

  const {transfers: transfersResult, count} = readTokenTransfers.matchWith({
    Just: ({value}) => value.toJS(),
    Nothing: () => t.fail()
  });

  const filteredResult = transfersResult.map(t => ignoreProps(['id'])(t));

  t.is(count, 5);
  t.is(transfersResult.length, 5);
  t.deepEqual(expectedTransfers.reverse(), filteredResult);
});

serial('readTokenBalances should return the balances for a token, in DESC order', async t => {
  const transfers1 = createNTransfers(15, {to: '0x456', tokenAddress: token1.tokenAddress});
  const totalTransferred1 = getTotalTranferred(transfers1);

  const transfers2 = createNTransfers(13, {to: '0x333', tokenAddress: token1.tokenAddress});
  const totalTransferred2 = getTotalTranferred(transfers2);

  const transfers3 = createNTransfers(12, {to: '0x123', tokenAddress: token1.tokenAddress});
  const totalTransferred3 = getTotalTranferred(transfers3);

  const expectedBalances = [{
    address: '0x456',
    balance: totalTransferred1,
    countryOfResidence: null,
    ownedBy: null
  }, {
    address: '0x333',
    balance: totalTransferred2,
    countryOfResidence: null,
    ownedBy: null
  }, {
    address: '0x123',
    balance: totalTransferred3,
    countryOfResidence: null,
    ownedBy: null
  }];

  await createTokenBatch([token1]);

  const transfers = [...transfers1, ...transfers2, ...transfers3];

  await from(transfers)
    .pipe(
      concatMap(async transfer => {
        await createTokenTransfer(transfer);
        await updateTokenHolderData(transfer);
      })
    ).toPromise();

  const tokenBalancesResult = await readTokenBalances(token1.tokenAddress);
  tokenBalancesResult.matchWith({
    Just: ({value}) => {
      const {balances, count} = value.toJS();

      t.is(count, 3);
      t.is(balances.length, 3);
      t.deepEqual(expectedBalances, balances);
    },
    Nothing: t.fail.bind(t)
  });
});

serial('readTokenBalances should return the balances for a token and the owner info (if exists)', async t => {
  const {account: accountResult} = await createExtendedUser();
  const account = accountResult.matchWith({
    Just: maybeValueReturn(v => v.toJS())
  });

  await createTokenBatch([token1]);

  const transfers = createNTransfers(15, {to: TOKEN_RECIPIENT_ADDRESS, tokenAddress: token1.tokenAddress});
  const totalTransferred = getTotalTranferred(transfers);

  const expectedOwnerObject = ignoreProps(
    ['id', 'aml', 'btcAddress', 'ethAddress', 'kyc']
  )(account);

  const expectedBalances = [{
    ownedBy: expectedOwnerObject,
    balance: totalTransferred,
    address: TOKEN_RECIPIENT_ADDRESS,
    countryOfResidence: 'GBR1'
  }];

  await from(transfers)
    .pipe(
      concatMap(async transfer => {
        await createTokenTransfer(transfer);
        await updateTokenHolderData(transfer);
      })
    ).toPromise();

  const tokenBalancesResult = await readTokenBalances(token1.tokenAddress);

  tokenBalancesResult.matchWith({
    Just: ({value}) => {
      const {balances, count} = value.toJS();

      t.is(count, 1);
      t.is(balances.length, 1);
      const expectedBalance1 = balances.find(b => b.address === TOKEN_RECIPIENT_ADDRESS);
      t.deepEqual(expectedBalances[0], expectedBalance1);

      const expectedBalance2 = balances.find(b => b.address === ZERO_ADDRESS);
      t.deepEqual(expectedBalances[1], expectedBalance2);
    },
    Nothing: t.fail.bind(t)
  });
});

serial('readTokenBalances should return default values when querying a tokens without transfers', async t => {
  const tokenBalancesResult = await readTokenBalances('unexisting token');

  tokenBalancesResult.matchWith({
    Just: ({value}) => {
      const {balances, count} = value.toJS();

      t.is(count, 0);
      t.is(balances.length, 0);
      t.deepEqual([], balances);
    },
    Nothing: t.fail.bind(t)
  });
});

serial('readHolderBalance should return the balance of a give user/token', async t => {
  await createToken(...Object.values(token1));

  const transfers = createNTransfers(15, {to: VALID_ETH_ADDRESS, tokenAddress: token1.tokenAddress});
  const totalTransferred = getTotalTranferred(transfers);

  await from(transfers)
    .pipe(
      concatMap(async transfer => {
        await createTokenTransfer(transfer);
        await updateTokenHolderData(transfer);
      })
    ).toPromise();

  const tokenBalanceResult = await readHolderBalance(token1.tokenAddress, VALID_ETH_ADDRESS);
  const balance = tokenBalanceResult.matchWith({
    Just: maybeValueReturn(v => v),
    Nothing: t.fail.bind(t)
  });

  t.is(balance, totalTransferred);
});

serial('readHolderBalance should return 0 if token or balance does not exist', async t => {
  await createToken(...Object.values(token1));

  const transfers = createNTransfers(15, {to: VALID_ETH_ADDRESS, tokenAddress: token1.tokenAddress});

  await from(transfers)
    .pipe(
      concatMap(async transfer => {
        await createTokenTransfer(transfer);
        await updateTokenHolderData(transfer);
      })
    ).toPromise();

  // if holder does not exist
  const unexistingTokenBalanceResult = await readHolderBalance(PRIMARY_TOKEN_ADDRESS, 'unexisting holder');
  const unexistingTokenBalance = unexistingTokenBalanceResult.matchWith({
    Just: maybeValueReturn(v => v),
    Nothing: t.fail.bind(t)
  });

  // if token does not exist
  const unexistingHolderBalanceResult = await readHolderBalance('unexisting token', VALID_ETH_ADDRESS);
  const unexistingHolderBalance = unexistingHolderBalanceResult.matchWith({
    Just: maybeValueReturn(v => v),
    Nothing: t.fail.bind(t)
  });

  t.is(unexistingTokenBalance, 0);
  t.is(unexistingHolderBalance, 0);
});

serial('updateTokenHolderData should store the balances correctly', async t => {
  await createToken(...Object.values(token1));

  const transferData = {
    to: VALID_ETH_ADDRESS,
    tokenAddress: token1.tokenAddress
  };

  const transfers1 = createNTransfers(135, {...transferData, salt: 1});
  const totalTransferred1 = getTotalTranferred(transfers1);

  const transfers2 = createNTransfers(125, {...transferData, salt: 2});
  const totalTransferred2 = getTotalTranferred(transfers2);

  const transfers3 = createNTransfers(115, {...transferData, salt: 2});
  const totalTransferred3 = getTotalTranferred(transfers3);

  await from(transfers1)
    .pipe(
      concatMap(async transfer => {
        await createTokenTransfer(transfer);
        await updateTokenHolderData(transfer);
      })
    ).toPromise();

  await from(transfers2)
    .pipe(
      concatMap(async transfer => {
        await createTokenTransfer(transfer);
        await updateTokenHolderData(transfer);
      })
    ).toPromise();

  await from(transfers3)
    .pipe(
      concatMap(async transfer => {
        await createTokenTransfer(transfer);
        await updateTokenHolderData(transfer);
      })
    ).toPromise();

  const totalTransferred = totalTransferred1 + totalTransferred2 + totalTransferred3;

  const tokenBalanceResult = await readHolderBalance(token1.tokenAddress, VALID_ETH_ADDRESS);
  const balance = tokenBalanceResult.matchWith({
    Just: maybeValueReturn(),
    Nothing: t.fail.bind(t)
  });

  t.is(balance, totalTransferred);
});

serial('readHoldersCountries should return an array with all the countries', async t => {
  await createToken(...Object.values(token1));

  await createExtendedUser('userId1', 'ethAddress1', 'tra1', 1, false);
  await saveKyc('userId1', 1, {countryOfResidence: 'GBR'});

  await createExtendedUser('userId2', 'ethAddress2', 'tra2', 2, false);
  await saveKyc('userId2', 2, {countryOfResidence: 'GBR'});

  await createExtendedUser('userId3', 'ethAddress3', 'tra3', 3, false);
  await saveKyc('userId3', 3, {countryOfResidence: 'GBR'});

  const transferData1 = {
    to: 'tra1',
    tokenAddress: token1.tokenAddress,
    salt: 1
  };
  const transferData2 = {
    to: 'tra2',
    tokenAddress: token1.tokenAddress,
    salt: 2
  };
  const transferData3 = {
    to: 'tra3',
    tokenAddress: token1.tokenAddress,
    salt: 3
  };

  const transfers1 = createNTransfers(135, transferData1);
  const transfers2 = createNTransfers(125, transferData2);
  const transfers3 = createNTransfers(115, transferData3);

  await from(transfers1)
    .pipe(
      concatMap(async transfer => {
        await createTokenTransfer(transfer);
        await updateTokenHolderData(transfer);
      })
    ).toPromise();

  await from(transfers2)
    .pipe(
      concatMap(async transfer => {
        await createTokenTransfer(transfer);
        await updateTokenHolderData(transfer);
      })
    ).toPromise();

  await from(transfers3)
    .pipe(
      concatMap(async transfer => {
        await createTokenTransfer(transfer);
        await updateTokenHolderData(transfer);
      })
    ).toPromise();

  const holdersCountriesResult = await readHoldersCountries(token1.tokenAddress, 0, 10);
  holdersCountriesResult.matchWith({
    Just: ({value}) => {
      const {countriesList} = value.toJS();
      const gbrCountry = countriesList.find(matchesProperty('0', 'GBR'));

      t.deepEqual(gbrCountry, ['GBR', 3]);
    },
    Nothing: t.fail.bind(t)
  });
});

serial('readHoldersCountries should return an array with all the countries filtered by token', async t => {
  await createToken(...Object.values(token1));
  await createToken(...Object.values(token2));

  await createExtendedUser('userId1', 'ethAddress1', 'tra1', 1, false);
  await saveKyc('userId1', 1, {countryOfResidence: 'GBR'});

  await createExtendedUser('userId2', 'ethAddress2', 'tra2', 2, false);
  await saveKyc('userId2', 2, {countryOfResidence: 'GBR'});

  await createExtendedUser('userId3', 'ethAddress3', 'tra3', 3, false);
  await saveKyc('userId3', 3, {countryOfResidence: 'GBR'});

  const transferData1 = {
    to: 'tra1',
    tokenAddress: token1.tokenAddress,
    salt: 1
  };
  const transferData2 = {
    to: 'tra2',
    tokenAddress: token1.tokenAddress,
    salt: 2
  };
  const transferData3 = {
    to: 'tra3',
    tokenAddress: token2.tokenAddress,
    salt: 3
  };

  const transfers1 = createNTransfers(135, transferData1);
  const transfers2 = createNTransfers(125, transferData2);
  const transfers3 = createNTransfers(115, transferData3);

  await from(transfers1)
    .pipe(
      concatMap(async transfer => {
        await createTokenTransfer(transfer);
        await updateTokenHolderData(transfer);
      })
    ).toPromise();

  await from(transfers2)
    .pipe(
      concatMap(async transfer => {
        await createTokenTransfer(transfer);
        await updateTokenHolderData(transfer);
      })
    ).toPromise();

  await from(transfers3)
    .pipe(
      concatMap(async transfer => {
        await createTokenTransfer(transfer);
        await updateTokenHolderData(transfer);
      })
    ).toPromise();

  const holdersCountriesResult = await readHoldersCountries(token1.tokenAddress, 0, 10);
  holdersCountriesResult.matchWith({
    Just: ({value}) => {
      const {countriesList} = value.toJS();
      const gbrCountry = countriesList.find(matchesProperty('0', 'GBR'));

      t.deepEqual(gbrCountry, ['GBR', 2]);
    },
    Nothing: t.fail.bind(t)
  });
});

serial('readHoldersCountries should ignore holders with 0 balance', async t => {
  await createToken(...Object.values(token1));

  await createExtendedUser('userId1', 'ethAddress1', 'tra1', 1, false);
  await saveKyc('userId1', 1, {countryOfResidence: 'GBR'});

  await createExtendedUser('userId2', 'ethAddress2', 'tra2', 2, false);
  await saveKyc('userId2', 2, {countryOfResidence: 'GBR'});

  await createExtendedUser('userId3', 'ethAddress3', 'tra3', 3, false);
  await saveKyc('userId3', 3, {countryOfResidence: 'GRC'});

  const transferData1 = {
    to: 'tra1',
    tokenAddress: token1.tokenAddress,
    salt: 1
  };
  const transferData3 = {
    to: 'tra3',
    tokenAddress: token1.tokenAddress,
    salt: 3
  };

  const transfer0Balance = {
    address: token1.tokenAddress,
    txHash: 'txhash_3_0',
    logIndex: 0,
    amount: 0,
    from: ZERO_ADDRESS,
    to: 'tra2',
    timestamp: 0,
    blockNumber: 0
  };

  const transfers1 = createNTransfers(5, transferData1);

  await from(transfers1)
    .pipe(
      concatMap(async transfer => {
        await createTokenTransfer(transfer);
        await updateTokenHolderData(transfer);
      })
    ).toPromise();

  await createTokenTransfer(transfer0Balance);
  await updateTokenHolderData(transfer0Balance);

  const transfers3 = createNTransfers(3, transferData3);

  await from(transfers3)
    .pipe(
      concatMap(async transfer => {
        await createTokenTransfer(transfer);
        await updateTokenHolderData(transfer);
      })
    ).toPromise();

  const holdersCountriesResult = await readHoldersCountries(token1.tokenAddress, 0, 10);
  holdersCountriesResult.matchWith({
    Just: ({value}) => {
      const {countriesList} = value.toJS();

      const gbrCountry = countriesList.find(matchesProperty('0', 'GBR'));
      const grcCountry = countriesList.find(matchesProperty('0', 'GRC'));

      t.deepEqual(gbrCountry, ['GBR', 1]);
      t.deepEqual(grcCountry, ['GRC', 1]);
    },
    Nothing: t.fail.bind(t)
  });
});

serial('readHoldersCountries should return an empty array if no holders exist', async t => {
  const holdersCountriesResult = await readHoldersCountries(token1.tokenAddress, 0, 10);
  const holdersCountries = holdersCountriesResult.matchWith({
    Just: ({value}) => {
      const {countriesList} = value.toJS();
      t.deepEqual(countriesList, []);
    },
    Nothing: t.fail.bind(t)
  });
});

serial('createToken should undo softDelete if the Token exists and is softDeleted', async t => {
  await createToken(...Object.values(token1));
  const readTokenResult = await readToken(token1.tokenAddress);

  readTokenResult.matchWith({
    Just: ({value}) => {
      const data = ignoreProps(['id', 'fillPositionAutomatically', 'isOpen', 'price'])(value.toJS());
      t.deepEqual(toDbTokenData(token1), data);
    }
  });

  await removeToken(token1.tokenAddress);
  const readDeletedTokenResult = await readToken(token1.tokenAddress);

  readDeletedTokenResult.matchWith({
    Just: ({value}) => {
      const {softDeleted} = value.toJS();
      t.is(softDeleted, true);
    }
  });

  await createToken(...Object.values(token1));
  const readRecoveredTokenResult = await readToken(token1.tokenAddress);

  readRecoveredTokenResult.matchWith({
    Just: ({value}) => {
      const data = ignoreProps(['id', 'fillPositionAutomatically', 'isOpen', 'price'])(value.toJS());
      t.deepEqual(toDbTokenData(token1), data);
    }
  });
});

serial('updateTokenDescription should add token description', async t => {
  await createToken(...Object.values(token1));
  await updateToken(token1.tokenAddress, {description: 'Token description'});

  const readTokenResult = await readToken(token1.tokenAddress);

  readTokenResult.matchWith({
    Just: ({value}) => {
      const {description} = ignoreProp('id')(value.toJS());
      t.is(description, 'Token description');
    }
  });
});

serial('updateTokenDescription should update the token description if description exists', async t => {
  await createToken(...Object.values(token1));
  await updateToken(token1.tokenAddress, {description: 'Token description'});

  const readTokenResult = await readToken(token1.tokenAddress);

  readTokenResult.matchWith({
    Just: ({value}) => {
      const {description} = ignoreProp('id')(value.toJS());
      t.is(description, 'Token description');
    }
  });

  await updateToken(token1.tokenAddress, {description: 'New Token description'});

  const readTokenResultAfterUpdate = await readToken(token1.tokenAddress);
  readTokenResultAfterUpdate.matchWith({
    Just: ({value}) => {
      const {description} = value.toJS();
      t.is(description, 'New Token description');
    }
  });
});

serial('addFileToToken should attach a file to token', async t => {
  await createToken(...Object.values(token1));
  await addFileToToken(token1.tokenAddress, 'fileId', 'fileName');

  const readTokenFilesResult = await readTokenFiles(token1.tokenAddress);
  const expectedResult = {
    fileId: 'fileId',
    name: 'fileName',
    softDeleted: false
  };

  readTokenFilesResult.matchWith({
    Just: ({value}) => {
      const files = (value.toJS());
      t.is(files.length, 1);
      t.deepEqual(ignoreProp('id')(files[0]), expectedResult);
    }
  });
});

serial('removeTokenFile should delete a file from token', async t => {
  await createToken(...Object.values(token1));
  await addFileToToken(token1.tokenAddress, 'fileId', 'fileName');

  const expectedResult = {
    fileId: 'fileId',
    name: 'fileName',
    softDeleted: false
  };

  const readTokenFilesResult = await readTokenFiles(token1.tokenAddress);
  readTokenFilesResult.matchWith({
    Just: ({value}) => {
      const files = (value.toJS());
      t.deepEqual(ignoreProp('id')(files[0]), expectedResult);
    }
  });

  await removeTokenFile(token1.tokenAddress, 'fileId');

  const readTokenFilesDeleteResult = await readTokenFiles(token1.tokenAddress);
  const files = readTokenFilesDeleteResult.matchWith({
    Just: maybeValueReturn(toJS),
    Nothing: t.fail.bind(t)
  });
  t.deepEqual(files, []);
});

serial('updateToken should update the token icon', async t => {
  await createToken(...Object.values(token1));
  await updateToken(token1.tokenAddress, {icon: 'iconId'});

  const readTokenResult = await readToken(token1.tokenAddress);

  readTokenResult.matchWith({
    Just: ({value}) => {
      const {icon} = ignoreProp('id')(value.toJS());
      t.is(icon, 'iconId');
    }
  });
});
