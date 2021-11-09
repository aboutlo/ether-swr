import { useContext, useEffect, useRef, useState } from 'react'
import useSWR, { mutate, useSWRConfig, unstable_serialize } from 'swr'
import { SWRResponse } from 'swr'
import { isAddress } from '@ethersproject/address'
import { EthSWRConfigInterface } from './types'
import EthSWRConfigContext from './eth-swr-config'
import { etherJsFetcher } from './ether-js-fetcher'
import { ABINotFound } from './Errors'
import { getContract } from './utils'
import { Contract } from '@ethersproject/contracts'
import { Provider } from '@ethersproject/providers'

export type etherKeyFuncInterface = () => ethKeyInterface | ethKeysInterface
export type ethKeyInterface = [string, any?, any?, any?, any?]
export type ethKeysInterface = any[][]

const buildContract = (target: string, config: EthSWRConfigInterface) => {
  if (!isAddress(target)) return undefined
  const abi = config.ABIs.get(target)
  if (!abi) {
    throw new ABINotFound(`Missing ABI for ${target}`)
  }
  return getContract(target, abi)
}

function useEtherSWR<Data = any, Error = any>(
  key: ethKeyInterface | ethKeysInterface | etherKeyFuncInterface
): SWRResponse<Data, Error>
function useEtherSWR<Data = any, Error = any>(
  key: ethKeyInterface | ethKeysInterface | etherKeyFuncInterface,
  config?: EthSWRConfigInterface<Data, Error>
): SWRResponse<Data, Error>
function useEtherSWR<Data = any, Error = any>(
  key: ethKeyInterface | ethKeysInterface | etherKeyFuncInterface,
  fetcher?: any, //fetcherFn<Data>,
  config?: EthSWRConfigInterface<Data, Error>
): SWRResponse<Data, Error>
function useEtherSWR<Data = any, Error = any>(
  ...args: any[]
): SWRResponse<Data, Error> {
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
    fn = config.fetcher || etherJsFetcher(config.web3Provider, config.ABIs)
  }

  // TODO LS implement a getTarget and change subscribe interface {subscribe: {name: "Transfer", target: 0x01}}
  const [target] = isMulticall
    ? [_key[0][0]] // pick the first element of the list.
    : _key

  const { cache } = useSWRConfig()
  // we need to serialize the key as string otherwise
  // a new array is created everytime the component is rendered
  // we follow SWR format
  const normalizeKey = isMulticall ? JSON.stringify(_key) : _key

  // base methods (e.g. getBalance, getBlockNumber, etc)
  useEffect(() => {
    if (!config.web3Provider || !config.subscribe || Array.isArray(target)) {
      // console.log('skip')
      return () => ({})
    }
    // console.log('effect!')
    const contract = buildContract(target, config)

    const subscribers = Array.isArray(config.subscribe)
      ? config.subscribe
      : [config.subscribe]

    const instance: Contract | Provider = contract || config.web3Provider

    subscribers.forEach(subscribe => {
      let filter
      const internalKey = unstable_serialize(normalizeKey)
      if (typeof subscribe === 'string') {
        filter = subscribe
        // TODO LS this depends on etherjs
        instance.on(filter, () => {
          // console.log('on(string):', { filter }, Array.from(cache.keys()))
          mutate(internalKey, undefined, true)
        })
      } else if (typeof subscribe === 'object' && !Array.isArray(subscribe)) {
        const { name, on } = subscribe
        filter = name
        instance.on(filter, (...args) => {
          if (on) {
            // console.log('on(object):', { filter }, Array.from(cache.keys()))
            on(cache.get(internalKey), ...args)
          } else {
            // auto refresh
            // console.log('auto(refresh):', { filter }, Array.from(cache.keys()))
            mutate(internalKey, undefined, true)
          }
        })
      }
    })

    return () => {
      subscribers.forEach(filter => {
        instance.removeAllListeners(filter)
      })
    }
  }, [unstable_serialize(normalizeKey), target])

  return useSWR(normalizeKey, fn, config)
}
const EthSWRConfig = EthSWRConfigContext.Provider
const EtherSWRConfig = EthSWRConfigContext.Provider
export { EthSWRConfig, EtherSWRConfig }

export default useEtherSWR
