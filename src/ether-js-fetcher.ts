import { Contract, Wallet } from 'ethers'
import { isAddress } from '@ethersproject/address'
import { ABIError, ABINotFound } from './Errors'
import { JsonRpcSigner, Provider, Web3Provider } from '@ethersproject/providers'

export const etherJsFetcher = (
  provider: Provider | Web3Provider,
  // Wallet from EtherJS
  // JsonRpcSigner from useWeb3React
  signer: Wallet | JsonRpcSigner,
  ABIs?: Map<string, any>
) => (...args) => {
  let parsed
  try {
    parsed = JSON.parse(args[0])
  } catch (e) {
    // fallback silently
  }
  const [arg1] = parsed || args

  const execute = (parameters: string[]): Promise<any> => {
    const [param1, param2, ...otherParams] = parameters
    // it's a contract
    if (isAddress(param1)) {
      if (!ABIs) throw new ABIError(`ABI repo not found`)
      if (!ABIs.get) throw new ABIError(`ABI repo isn't a Map`)
      const address = param1
      const method = param2
      const abi = ABIs.get(address)
      if (!abi) throw new ABINotFound(`ABI not found for ${address}`)
      const contract = new Contract(address, abi, signer)
      return contract[method](...otherParams)
    }
    // it's a eth call
    const method = param1

    // fallback to signer methods using the signer address
    if (
      ['getBalance', 'getTransactionCount'].includes(method) &&
      !isAddress(param2)
    ) {
      const address =
        signer instanceof Wallet ? signer.address : signer._address
      // FIXME address could be null if an index has been passed
      return provider[method](address, param2, ...otherParams)
    }

    return provider[method](param2, ...otherParams)
  }

  // it's a batch call
  if (Array.isArray(arg1)) {
    const calls: string[][] = parsed
    // TODO LS faster execution using one multicall. Perhaps using https://github.com/Destiner/ethcall
    return Promise.all(
      calls.map(call => {
        // TODO LS save the key in the cache
        return execute(call)
      })
    )
  }
  return execute(args)
}

export default etherJsFetcher
