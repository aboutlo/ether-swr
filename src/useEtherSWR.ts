import { useContext, useEffect } from 'react'
import useSWR, { cache, mutate } from 'swr'
import { responseInterface } from 'swr'
import { Contract } from 'ethers'
import { isAddress } from '@ethersproject/address'
import { EthSWRConfigInterface } from './types'
import EthSWRConfigContext from './eth-swr-config'
import { ethFetcher } from './eth-fetcher'

export { cache } from 'swr'
export type ethKeyInterface = [string, any?, any?, any?, any?]

function useEtherSWR<Data = any, Error = any>(
  key: ethKeyInterface
): responseInterface<Data, Error>
function useEtherSWR<Data = any, Error = any>(
  key: ethKeyInterface,
  config?: EthSWRConfigInterface<Data, Error>
): responseInterface<Data, Error>
function useEtherSWR<Data = any, Error = any>(
  key: ethKeyInterface,
  fetcher?: any, //fetcherFn<Data>,
  config?: EthSWRConfigInterface<Data, Error>
): responseInterface<Data, Error>
function useEtherSWR<Data = any, Error = any>(
  ...args
): responseInterface<Data, Error> {
  let _key: ethKeyInterface
  let fn: any //fetcherFn<Data> | undefined
  let config: EthSWRConfigInterface<Data, Error> = { subscribe: [] }

  if (args.length >= 1) {
    _key = args[0]
  }
  if (args.length > 2) {
    fn = args[1]
    config = args[2]
  } else {
    if (typeof args[1] === 'function') {
      fn = args[1]
    } else if (typeof args[1] === 'object') {
      config = args[1]
    }
  }

  config = Object.assign({}, useContext(EthSWRConfigContext), config)

  if (fn === undefined) {
    // fn = config.fetcher(library, config.ABIs) as any
    fn = config.fetcher || ethFetcher(config.web3Provider, config.ABIs)
  }

  const [target] = _key

  // base methods (e.g. getBalance, getBlockNumber, etc)
  useEffect(() => {
    if (!config.web3Provider || !config.subscribe || isAddress(target))
      return () => ({})
    const subscribers = Array.isArray(config.subscribe)
      ? config.subscribe
      : [config.subscribe]
    subscribers.forEach(filter => {
      config.web3Provider.on(filter, () => mutate(_key, undefined, true))
    })

    return () => {
      subscribers.forEach(filter => {
        config.web3Provider.removeAllListeners(filter)
      })
    }
  }, [/*config.web3Provider, config.subscribe,*/ _key])

  // contract filter (e.g. balanceOf, approve, etc)
  useEffect(() => {
    if (!config.web3Provider || !config.subscribe || !isAddress(target)) {
      return () => ({})
    }

    const abi = config.ABIs.get(target)
    console.log('useEffect configure', _key)
    if (!abi) {
      throw new Error(`Missing ABI for ${target}`)
    }
    const contract = new Contract(target, abi, config.web3Provider.getSigner())

    const subscribers = Array.isArray(config.subscribe)
      ? config.subscribe
      : [config.subscribe]

    subscribers.forEach(subscribe => {
      let filter
      if (typeof subscribe === 'string') {
        filter = contract.filters[subscribe]()
        contract.on(filter, value => {
          // auto refresh
          mutate(_key, undefined, true)
        })
      } else if (typeof subscribe === 'object' && !Array.isArray(subscribe)) {
        const { name, topics, on } = subscribe
        filter = contract.filters[name](...topics)
        contract.on(filter, (...args) => {
          if (on) {
            on(cache.get(_key), ...args)
          } else {
            // auto refresh
            mutate(_key, undefined, true)
          }
        })
      }
    })

    return () => {
      subscribers.forEach(filter => {
        // FIXME the filter need to be unwrap to find the listner as for above
        contract.removeAllListeners(filter)
      })
    }
    // }, [config.web3Provider.network.chainId, config.subscribe, _key.join('|')])
    // FIXME revalidate if network change
  }, [_key.join('|')])
  return useSWR(_key, fn, config)
}
const EthSWRConfig = EthSWRConfigContext.Provider
export { EthSWRConfig }

export default useEtherSWR
