const Joi = require('@hapi/joi');
const {isValidAddress} = require('../../../../eth-utils/data/v1/address');

const validateEthAddress = (address, {message}) => {
  if(!isValidAddress(address)) return message(`${address} is not a valid Ethereum address`);

  return address;
};

const validateCreateClaimsRegistry = claimsRegistryObject => {
  const schema = Joi.object({
    address: Joi
      .string()
      .required()
      .custom(validateEthAddress)
  });

  Joi.assert(claimsRegistryObject, schema, 'Claim Registry Object invalid.');

  return claimsRegistryObject;
};

const validateCreateClaim = claimObject => {
  const schema = Joi.object({
    key: Joi
      .string()
      .required(),
    value: Joi
      .string()
      .required(),
    accountId: Joi
      .string()
      .required()
  }).unknown(true);

  Joi.assert(claimObject, schema, 'Claim Object invalid.');

  return claimObject;
};

const validateReadClaims = claimObject => {
  const schema = Joi.object({
    key: Joi.string(),
    value: Joi.string(),
    accountId: Joi.string(),
    holderAddress: Joi.string()
      .custom(validateEthAddress)
  });

  Joi.assert(claimObject, schema, 'Claim Object filter invalid.');

  return claimObject;
};

const validateCreateRegistryAccount = registryAccountObject => {
  const schema = Joi.object({
    accountId: Joi
      .string()
      .required(),
    holderAddress: Joi.string()
      .required()
      .custom(validateEthAddress)
  });

  Joi.assert(registryAccountObject, schema, 'ClaimsRegistry Account Object filter invalid.');

  return registryAccountObject;
};

module.exports = {
  validateCreateClaimsRegistry,
  validateCreateClaim,
  validateReadClaims,
  validateCreateRegistryAccount
};
