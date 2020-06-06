import { useContext, useEffect, useMemo } from 'react'
import useSWR, { trigger } from 'swr'
import { responseInterface } from 'swr'
import { Contract } from '@ethersproject/contracts'
import { isAddress } from '@ethersproject/address'
import { EthSWRConfigInterface } from './types'
import EthSWRConfigContext from './eth-swr-config'
import { useWeb3React } from '@web3-react/core'
// import { fetcherFn } from 'swr/esm/types'

// export declare type fetcherFn<Data> = (...args: any) => Data | Promise<Data>

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
  let config: EthSWRConfigInterface<Data, Error> = {}

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

  const [target, method, ...params] = _key

  const { library } = useWeb3React()
  // console.log('useEthSWR:', { _key, target, method, params, fn, config })

  config = Object.assign({}, useContext(EthSWRConfigContext), config)

  if (fn === undefined) {
    // fn = config.fetcher(library, config.ABIs) as any
    fn = config.fetcher
  }

  return useSWR(_key, fn, config)

  // const { data, error, revalidate, isValidating, mutate } = useSWR(
  //   _key,
  //   fn,
  //   config
  // )

  // const [arg1, arg2, arg3] = args
  // console.log('args:', arg1, arg2, arg3)
  // const { data, error, revalidate, isValidating, mutate } = useSWR(
  //   arg1,
  //   arg2,
  //   arg3
  // )
  // console.log('useSWRL', { data, error })
  // return { data, error, revalidate, isValidating, mutate }

  /*
  let contract = useMemo(() => {
    if (!isAddress(target)) return null
    const abi = config.ABIs.get(target)
    new Contract(target, abi)
  }, [target])

  useEffect(() => {
    if (!contract) {
      return () => {
        // dosomething
      }
    }

    const [paramWithFilters] = key.filter(p => p.on !== undefined)
    // FIXME can be an object or an array
    const filters = Array.isArray(paramWithFilters.on)
      ? paramWithFilters.on
      : [paramWithFilters.on]

    filters.forEach(p => {
      const [name, ...args] = p
      const [callback] = args.filter(arg => typeof arg === 'function')
      const filter = contract[name](args)
      contract.on(filter, (...topics) => {
        callback ? callback(topics) : trigger(key, true)
      })
    })

    return () => {
      filters.forEach(p => {
        const [name, ...args] = p
        const filter = contract[name](args)
        contract.removeAllListeners(filter)
      })
    }
  }, [contract])*/

  // spread operator will crate a new instance on every render
  // const { data, error, mutate, isValidating, revalidate } = useSWR(
  //   key,
  //   fetcher,
  //   config
  // )
  // return { data, error, isValidating, revalidate, mutate }

  // return useMemo(() => {
  //   const response: ethResponseInterface<Data, Error> = {
  //     revalidate,
  //     data,
  //     error,
  //     mutate,
  //     isValidating,
  //     subscribe
  //   }
  //   return response
  // }, [data, error, mutate, isValidating, revalidate])
}
const EthSWRConfig = EthSWRConfigContext.Provider
export { EthSWRConfig }
export default useEthSWR
