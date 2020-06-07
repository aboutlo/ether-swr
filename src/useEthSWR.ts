import { useContext, useEffect, useMemo } from 'react'
import useSWR, { trigger, cache, mutate } from 'swr'
import { responseInterface } from 'swr'
import { Contract } from '@ethersproject/contracts'
import { isAddress } from '@ethersproject/address'
import { EthSWRConfigInterface } from './types'
import EthSWRConfigContext from './eth-swr-config'
import { useWeb3React } from '@web3-react/core'
// import { fetcherFn } from 'swr/esm/types'

// export declare type fetcherFn<Data> = (...args: any) => Data | Promise<Data>
export { cache } from 'swr'
export type ethKeyInterface = [string, any?, any?, any?, any?]

/*export const subscribe = contract => (event: string, params: any[]) => {
  console.log(contract)
  console.log(event, params)
  return null
}

type ethResponseInterface<Data, Error> = { subscribe: any } & responseInterface<
  Data,
  Error
>*/
function useEthSWR<Data = any, Error = any>(
  key: ethKeyInterface
): responseInterface<Data, Error>
function useEthSWR<Data = any, Error = any>(
  key: ethKeyInterface,
  config?: EthSWRConfigInterface<Data, Error>
): responseInterface<Data, Error>
function useEthSWR<Data = any, Error = any>(
  key: ethKeyInterface,
  fetcher?: any, //fetcherFn<Data>,
  config?: EthSWRConfigInterface<Data, Error>
): responseInterface<Data, Error>
function useEthSWR<Data = any, Error = any>(
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
    fn = config.fetcher
  }

  const [target] = _key

  // base methods (e.g. getBalance, getBlockNumber, etc)
  useEffect(() => {
    if (!config.provider || !config.subscribe || isAddress(target))
      return () => ({})
    const subscribers = Array.isArray(config.subscribe)
      ? config.subscribe
      : [config.subscribe]
    subscribers.forEach(filter => {
      config.provider.on(filter, () => mutate(_key, undefined, true))
    })

    return () => {
      subscribers.forEach(filter => {
        config.provider.removeAllListeners(filter)
      })
    }
    // FIXME why if I add _key as dependency it doesn't trigger the data refresh?
  }, [config.provider, config.subscribe, target])

  // contract filter
  useEffect(() => {
    if (!config.provider || !config.subscribe || !isAddress(target))
      return () => ({})

    const abi = config.ABIs.get(target)
    const contract = new Contract(target, abi, config.provider.getSigner())

    const subscribers = Array.isArray(config.subscribe)
      ? config.subscribe
      : [config.subscribe]
    subscribers.forEach(subscribe => {
      const filter = contract.filters[subscribe](null, null)
      contract.on(filter, value => {
        mutate(_key, undefined, true)
      })
    })

    return () => {
      subscribers.forEach(filter => {
        contract.removeAllListeners(filter)
      })
    }
    // FIXME why if I add _key as dependency it doesn't trigger the data refresh?
  }, [config.provider, config.subscribe, target])

  // let contract = useMemo(() => {
  //   if (!isAddress(target)) return null
  //   const abi = config.ABIs.get(target)
  //   new Contract(target, abi)
  // }, [target])
  //
  // useEffect(() => {
  //   if (!contract) {
  //     return () => {
  //       // dosomething
  //     }
  //   }
  //
  //   // const config.provider
  //
  //   // const [paramWithFilters] = key.filter(p => p.on !== undefined)
  //   // // FIXME can be an object or an array
  //   // const filters = Array.isArray(paramWithFilters.on)
  //   //   ? paramWithFilters.on
  //   //   : [paramWithFilters.on]
  //   //
  //   // filters.forEach(p => {
  //   //   const [name, ...args] = p
  //   //   const [callback] = args.filter(arg => typeof arg === 'function')
  //   //   const filter = contract[name](args)
  //   //   contract.on(filter, (...topics) => {
  //   //     callback ? callback(topics) : trigger(key, true)
  //   //   })
  //   // })
  //
  //   return () => {
  //     filters.forEach(p => {
  //       const [name, ...args] = p
  //       const filter = contract[name](args)
  //       contract.removeAllListeners(filter)
  //     })
  //   }
  // }, [contract])

  return useSWR(_key, fn, config)
}
const EthSWRConfig = EthSWRConfigContext.Provider
export { EthSWRConfig }

export default useEthSWR
