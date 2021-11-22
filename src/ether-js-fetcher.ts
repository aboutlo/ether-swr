import ethers from 'ethers'
import { call, multiCall } from './utils'
import { providers } from '@0xsequence/multicall'

export const etherJsFetcher = (
  provider: ethers.providers.Provider,
  ABIs?: Map<string, any>
) => {
  //TODO LS what happens when the network id change?
  const multiCallProvider = new providers.MulticallProvider(provider as any)

  return async (...args: any[]) => {
    let parsed: any[]
    try {
      parsed = JSON.parse(args[0])
    } catch (e) {
      // fallback silently because wasn't a JSON object aka simple key
    }
    const [arg1] = parsed || args

    // it's a batch call
    if (Array.isArray(arg1)) {
      return Promise.all(
        parsed.map(key => multiCall(key, multiCallProvider, ABIs))
      )
    }
    return call(args, provider, ABIs)
  }
}

export default etherJsFetcher
