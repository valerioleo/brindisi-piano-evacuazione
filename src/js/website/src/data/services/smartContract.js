import {
  fromTokenDecimals,
  getValueByType,
  methodReturnsStruct,
  hexToUtf8
} from 'EthUtils/core/v1/utils';
import {ContractResult} from 'Common/fn/monads/ContractResult';
import {
  importDefinition,
  getContractInstance,
  callContractMethod,
  sendTransaction
} from 'EthUtils/contracts/v1/Contract';

const convertResult = (stateMutability, result, outputs) => {
  if(stateMutability === 'view') {
    if(methodReturnsStruct(outputs)) {
      return ContractResult.Call({
        result: outputs.map((o, i) => getValueByType(o.type, result[i]))
      });
    }

    return ContractResult.Call({result});
  }

  return ContractResult.Tx({result});
};

const getSmartContractMethodFactory = stateMutability => stateMutability === 'view'
  ? callContractMethod
  : sendTransaction;

export const executeSmartContractMethod = async (
  contractInterface,
  method,
  contractAddress,
  ...args
) => {
  const {abi} = await importDefinition(contractInterface);
  const {outputs, stateMutability} = abi.find(({name}) => name === method);
  const instance = getContractInstance({abi}, contractAddress);
  const executeMethod = getSmartContractMethodFactory(stateMutability);
  const result = await executeMethod(instance, method, ...args);

  return convertResult(stateMutability, result, outputs);
};

const stringifyBoolean = val => val ? 'True' : 'False';
const convertCanTransferResult = result => [stringifyBoolean(result[0]), hexToUtf8(result[2])];

export const convertSmartContractResultByMethodFactory = method => {
  switch(method) {
    case 'canTransfer':
    case 'canTransferFrom': return convertCanTransferResult;
    case 'balanceOf': return result => fromTokenDecimals(result);
    default: return result => result;
  }
};

