import { Contract, ContractInterface } from 'ethers'
import { Provider, Web3Provider } from '@ethersproject/providers'
import { isAddress } from '@ethersproject/address'
import { ABIError, ABINotFound } from './Errors'
import {
  Call,
  Contract as EthCallContract,
  Provider as EthCallProvider
} from 'ethcall'

export const contracts = new Map<string, Contract>()
export function getContract(
  address: string,
  abi: ContractInterface,
  signer: any
): Contract {
  let contract = contracts.get(address)
  if (contract) {
    return contract
  }
  contract = new Contract(address, abi, signer)
  contracts.set(address, contract)
  return contract
}

export const call = (
  parameters: string[],
  provider: Provider | Web3Provider,
  ABIs
): Promise<any> => {
  const [address, method, ...otherParams] = parameters
  // it's a contract
  if (isAddress(address)) {
    if (!ABIs) throw new ABIError(`ABI repo not found`)
    if (!ABIs.get) throw new ABIError(`ABI repo isn't a Map`)
    const abi = ABIs.get(address)
    if (!abi) throw new ABINotFound(`ABI not found for ${address}`)
    const contract = new Contract(address, abi, provider)
    return contract[method](...otherParams)
  }
  const param2 = method
  const baseMethod = address // getBalance, getTransactionCount, etc
  return provider[baseMethod](param2, ...otherParams)
}
export const multiCall = (
  parameters: string[],
  provider: EthCallProvider,
  ABIs
): Call => {
  const [address, method, ...otherParams] = parameters
  // it's a contract
  if (isAddress(address)) {
    if (!ABIs) throw new ABIError(`ABI repo not found`)
    if (!ABIs.get) throw new ABIError(`ABI repo isn't a Map`)
    const abi = ABIs.get(address)
    if (!abi) throw new ABINotFound(`ABI not found for ${address}`)
    const contract = new EthCallContract(address, abi)
    return contract[method](...otherParams)
  }
  const param2 = method
  const baseMethod = address === 'getBalance' ? 'getEthBalance' : address // getBalance, getTransactionCount, etc
  return provider[baseMethod](param2, ...otherParams)
}
