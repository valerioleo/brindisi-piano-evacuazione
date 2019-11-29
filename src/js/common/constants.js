const CMC_BITCOIN_TICKER = 1;
const CMC_ETHEREUM_TICKER = 1027;

const MANUAL_CONTRIBUTION_TYPE = 'm';
const ORGANIC_CONTRIBUTION_TYPE = 'a';

const MANUAL_USER_TYPE = 'm';
const ORGANIC_USER_TYPE = 'a';

const Roles = {
  SUPER_ADMIN: {
    name: 'super_admin',
    level: 3
  },
  ADMIN: {
    name: 'admin',
    level: 2
  },
  USER: {
    name: 'user',
    level: 1
  }
};

const AUDIT_TYPES = {
  NEW_USER: 'NEW_USER',
  NEW_TOKEN: 'NEW_TOKEN',
  NEW_CHECKPOINT: 'NEW_CHECKPOINT',
  NEW_DEPOSIT: 'NEW_DEPOSIT'
};

const TRANSACTION_STATES = {
  WAITING_FOR_TX_HASH: 0,
  PENDING: 1,
  CONFIRMED: 2,
  REVERTED: 3
};

const TRANSACTION_KEYS = {
  DEPLOY_CNG1400: 'TokenFactory-deployCNG1400',
  DEPLOY_ERC20: 'TokenFactory-deployERC20',
  CLAIMS_REGISTRY_DEPLOYMENT: 'ClaimRegistry-constructor',
  SET_CLAIM: 'ClaimRegistry-setClaim',
  REGISTER_CLAIMS_REGISTRY_ACCOUNT: 'ClaimRegistry-registerAccount',
  DEPLOY_CHECKPOINT: 'TclRepository-deployCheckpoint',
  FILL_POSITION: 'CNG1400-issue'
};

const ACCESS_TOKEN_REQUIRED = ['TokenFactory-deployCNG1400', 'TokenFactory-deployERC20'];

module.exports = {
  CMC_BITCOIN_TICKER,
  CMC_ETHEREUM_TICKER,
  MANUAL_CONTRIBUTION_TYPE,
  ORGANIC_CONTRIBUTION_TYPE,
  MANUAL_USER_TYPE,
  ORGANIC_USER_TYPE,
  Roles,
  AUDIT_TYPES,
  TRANSACTION_STATES,
  TRANSACTION_KEYS,
  ACCESS_TOKEN_REQUIRED
};
