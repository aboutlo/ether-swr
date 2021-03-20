import { useContext, useEffect } from 'react'
import useSWR, { cache, mutate } from 'swr'
import { responseInterface } from 'swr'
import { isAddress } from '@ethersproject/address'
import { EthSWRConfigInterface } from './types'
import EthSWRConfigContext from './eth-swr-config'
import { etherJsFetcher } from './ether-js-fetcher'
import { ABINotFound } from './Errors'
import { getContract, contracts } from './utils'

export { cache } from 'swr'
export type etherKeyFuncInterface = () => ethKeyInterface | ethKeysInterface
export type ethKeyInterface = [string, any?, any?, any?, any?]
export type ethKeysInterface = string[][]

function useEtherSWR<Data = any, Error = any>(
  key: ethKeyInterface | ethKeysInterface | etherKeyFuncInterface
): responseInterface<Data, Error>
function useEtherSWR<Data = any, Error = any>(
  key: ethKeyInterface | ethKeysInterface | etherKeyFuncInterface,
  config?: EthSWRConfigInterface<Data, Error>
): responseInterface<Data, Error>
function useEtherSWR<Data = any, Error = any>(
  key: ethKeyInterface | ethKeysInterface | etherKeyFuncInterface,
  fetcher?: any, //fetcherFn<Data>,
  config?: EthSWRConfigInterface<Data, Error>
): responseInterface<Data, Error>
function useEtherSWR<Data = any, Error = any>(
  ...args
): responseInterface<Data, Error> {
  let _key: ethKeyInterface
  let fn: any //fetcherFn<Data> | undefined
  let config: EthSWRConfigInterface<Data, Error> = { subscribe: [] }
  let isMulticall = false
  if (args.length >= 1) {
    _key = args[0]
    isMulticall = Array.isArray(_key[0])
  }
  if (args.length > 2) {
    fn = args[1]
    //FIXME we lost default value subscriber = []
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
    fn = config.fetcher || etherJsFetcher(config.provider, config.ABIs)
  }

  // TODO LS implement a getTarget and change subscribe interface {subscribe: {name: "Transfer", target: 0x01}}
  const [target] = isMulticall
    ? [_key[0][0]] // pick the first element of the list.
    : _key
  // we need to serialize the key as string otherwise
  // a new array is created everytime the component is rendered
  // we follow SWR format

  const serializedKey = isMulticall
    ? JSON.stringify(_key)
    : cache.serializeKey(_key)[0]
  // const joinKey = `arg@"${_key.join('"@"')}"`
  // const joinKey = `arg@"${JSON.stringify(_key)}"`

  // base methods (e.g. getBalance, getBlockNumber, etc)
  // FIXME merge in only one useEffect
  useEffect(() => {
    if (
      !config.provider ||
      !config.subscribe ||
      isAddress(target) ||
      Array.isArray(target)
    ) {
      return () => ({})
    }

    const subscribers = Array.isArray(config.subscribe)
      ? config.subscribe
      : [config.subscribe]

    subscribers.forEach(subscribe => {
      let filter
      // const joinKey = isMulticall ? serializedKey : cache.serializeKey(_key)[0]
      const joinKey = serializedKey
      if (typeof subscribe === 'string') {
        filter = subscribe
        // TODO LS this depends on etherjs
        config.provider.on(filter, () => {
          // console.log('on:', { filter }, cache.keys())
          mutate(joinKey, undefined, true)
        })
      } else if (typeof subscribe === 'object' && !Array.isArray(subscribe)) {
        const { name, on } = subscribe
        filter = name
        config.provider.on(filter, (...args) => {
          if (on) {
            on(cache.get(joinKey), ...args)
          } else {
            // auto refresh
            mutate(joinKey, undefined, true)
          }
        })
      }
    })

    return () => {
      subscribers.forEach(filter => {
        config.provider.removeAllListeners(filter)
      })
    }
  }, [serializedKey, target])

  // contract filter (e.g. balanceOf, approve, etc)
  // FIXME merge in only one useEffect
  useEffect(() => {
    if (!config.provider || !config.subscribe || !isAddress(target)) {
      return () => ({})
    }

    const abi = config.ABIs.get(target)
    // console.log('useEffect configure', _key)
    if (!abi) {
      throw new ABINotFound(`Missing ABI for ${target}`)
    }
    // const contract = new Contract(target, abi, config.provider.getSigner())
    const contract = getContract(target, abi, config.provider.getSigner())

    const subscribers = Array.isArray(config.subscribe)
      ? config.subscribe
      : [config.subscribe]

    subscribers.forEach(subscribe => {
      let filter
      // const joinKey = isMulticall ? cache.serializeKey(serializedKey)[0] : _key
      if (typeof subscribe === 'string') {
        filter = contract.filters[subscribe]()
        // console.log('set:', { filter }, cache.keys())
        contract.on(filter, value => {
          // auto refresh
          // console.log('on:', { filter }, cache.keys())
          mutate(serializedKey, undefined, true)
        })
      } else if (typeof subscribe === 'object' && !Array.isArray(subscribe)) {
        const { name, topics, on } = subscribe
        const args = topics || []
        filter = contract.filters[name](...args)
        // console.log('subscribe:', filter)
        contract.on(filter, (...args) => {
          // console.log(`on_${name}:`, args)
          if (on) {
            on(cache.get(serializedKey), ...args)
          } else {
            // auto refresh
            mutate(_key, undefined, true)
          }
        })
      }
    })

    return () => {
      // console.log('== unmount  ==', target)
      // console.log('size', contracts.size)
      subscribers.forEach(filter => {
        // FIXME the filter need to be unwrap to find the listener as for above
        contract.removeAllListeners(filter)
      })
      contracts.delete(target)
    }
    // FIXME revalidate if network change
  }, [serializedKey, target])
  // FIXME serialize as string if the key is an array aka multicall

  return useSWR(isMulticall ? serializedKey : _key, fn, config)
}
const EthSWRConfig = EthSWRConfigContext.Provider
const EtherSWRConfig = EthSWRConfigContext.Provider
export { EthSWRConfig, EtherSWRConfig }

export default useEtherSWR
