import {isValidAddress} from 'EthUtils/data/v1/address';
import {isValidDate} from './date';

export const isNumber = value => !isNaN(Number(value));

export const required = value => (value || typeof value === 'number' ? undefined : 'Required');

export const maxLength = max => value => value && value.length > max ? `Must be ${max} characters or less` : undefined;

export const maxLength15 = maxLength(15);

export const minLength = min => value => value && value.length < min ? `Must be ${min} characters or more` : undefined;

export const minLength2 = minLength(2);

export const number = value => isNaN(Number(value)) ? 'Must be a number' : undefined;

export const unsignedNumber = value => (isNaN(Number(value)) || Number(value) < 0) ? 'Must be a positive number' : undefined;

export const positiveNonZeroNumber = value => (isNaN(Number(value)) || Number(value) <= 0) ? 'Must be a positive and non zero number' : undefined;

export const minValue = min => value => value && value < min ? `Must be at least ${min}` : undefined;

export const minValue13 = minValue(13);

export const url = value => !/(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/
  .test(value)
  ? 'Invalid url address'
  : undefined;

export const email = value => !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(value)
  ? 'Invalid email address'
  : undefined;

export const alphaNumeric = value => value && /[^a-zA-Z0-9 ]/i.test(value)
  ? 'Only alphanumeric characters'
  : undefined;

export const phoneNumber = value => value && !/^(0|[1-9][0-9]{9})$/i.test(value)
  ? 'Invalid phone number, must be 10 digits'
  : undefined;

export const isDate = value => !isValidDate(value)
  ? 'Please provide a valid date'
  : undefined;

export const validateEthereum = address => (
  isValidAddress(address)
    ? undefined
    : 'Must be a valid Ethereum address'
);
