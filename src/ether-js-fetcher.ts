import { Contract } from 'ethers'
import { isAddress } from '@ethersproject/address'
import { ABIError, ABINotFound } from './Errors'
// import { Web3Provider } from '@ethersproject/providers'
import { Provider } from './types'

export const etherJsFetcher = (provider: Provider, ABIs?: Map<string, any>) => (
  ...args
) => {
  const [arg1, arg2, ...params] = args
  // it's a contract
  if (isAddress(arg1)) {
    if (!ABIs) throw new ABIError(`ABI repo not found`)
    if (!ABIs.get) throw new ABIError(`ABI repo isn't a Map`)
    const address = arg1
    const method = arg2
    const abi = ABIs.get(address)
    if (!abi) throw new ABINotFound(`ABI not found for ${address}`)
    const contract = new Contract(address, abi, provider.getSigner())
    return contract[method](...params)
  }
  // it's a eth call
  const method = arg1
  return provider[method](arg2, ...params)
}

export default etherJsFetcher
