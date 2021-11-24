import { ContractInterface, providers as ethersProviders } from 'ethers'
import { Contract } from '@ethersproject/contracts'
import { isAddress } from '@ethersproject/address'
import { ABIError, ABINotFound } from './Errors'
import { providers } from '@0xsequence/multicall'
import { Provider } from '@ethersproject/abstract-provider'
import { Web3Provider } from './types'

const isObject = obj => {
  return typeof obj === 'object' && !Array.isArray(obj) && obj !== null
}

const parseExtended = (params: any[]) => {
  const extended: { blockTag?: number } = isObject(params[params.length - 1])
    ? params[params.length - 1]
    : { blockTag: undefined }
  return extended
}

const parseParams = params => {
  const [address, method, ...otherParams] = params
  const extended = parseExtended(otherParams)
  if (Object.values(extended).filter(Boolean).length > 0) {
    // discard the last item because it was an extend object
    otherParams.pop()
  }
  return { params: [address, method, otherParams], extended }
}
export const contracts = new Map<string, Contract>()
export function getContract(
  address: string,
  abi: ContractInterface,
  provider: Provider | Web3Provider
): Contract {
  let contract = contracts.get(address)
  if (contract) {
    return contract
  }
  contract = new Contract(address, abi, provider as Provider)
  contracts.set(address, contract)
  return contract
}

export const call = (
  parameters: string[],
  provider: ethersProviders.Provider,
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
  parameters: string | any[],
  provider: providers.MulticallProvider,
  ABIs
) => {
  const {
    params: [address, method, otherParams],
    extended
  } = parseParams(parameters)

  // it's a contract
  if (isAddress(address)) {
    if (!ABIs) throw new ABIError(`ABI repo not found`)
    if (!ABIs.get) throw new ABIError(`ABI repo isn't a Map`)
    const abi = ABIs.get(address)
    if (!abi) throw new ABINotFound(`ABI not found for ${address}`)
    const contract = new Contract(address, abi, provider)
    return contract[method](...otherParams, extended)
  }
  const param2 = method
  const baseMethod = address
  return provider[baseMethod](param2, ...otherParams, extended.blockTag)
}
