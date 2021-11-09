import { Wallet } from 'ethers'
import { Provider as EthCallProvider } from 'ethcall'
import { JsonRpcSigner, Provider, Web3Provider } from '@ethersproject/providers'
import { call, multiCall } from './utils'

export const etherJsFetcher = (
  provider: Provider | Web3Provider,
  // Wallet from EtherJS
  // JsonRpcSigner from useWeb3React
  signer: Wallet | JsonRpcSigner, // FIXME drop it signer can use outside to
  ABIs?: Map<string, any>
) => {
  //TODO LS what happens when the network id change?
  const ethCallProvider = new EthCallProvider()

  return async (...args: any[]) => {
    let parsed
    try {
      parsed = JSON.parse(args[0])
    } catch (e) {
      // fallback silently
    }
    const [arg1] = parsed || args

    if (Array.isArray(arg1)) {
      // it's a batch call
      // can we skip this for every call?
      await ethCallProvider.init(provider as any)
      const calls: string[][] = parsed
      return ethCallProvider.all(
        calls.map(call => multiCall(call, ethCallProvider, ABIs))
      )
    }
    return call(args, provider, ABIs)
  }
}

export default etherJsFetcher
