import { useContext, useEffect, useMemo } from 'react'
import useSWR, { trigger } from 'swr'
import { responseInterface } from 'swr'
import { Contract } from '@ethersproject/contracts'
import { isAddress } from '@ethersproject/address'
import { EthSWRConfigInterface } from './types'
import EthSWRConfigContext from './eth-swr-config'
import { useWeb3React } from '@web3-react/core'

export declare type fetcherFn<Data> = (...args: any) => Data | Promise<Data>

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

export function useEthSWR<Data = any, Error = any>(
  key: ethKeyInterface,
  fetcher?: fetcherFn<any>,
  config?: EthSWRConfigInterface
): responseInterface<Data, Error> {
  const [arg1, arg2, ...params] = key

  const { library } = useWeb3React()
  console.log('useEthSWR:', arg1, arg2, ...params, { fetcher, config })

  config = Object.assign({}, useContext(EthSWRConfigContext), config)

  if (fetcher === undefined) {
    fetcher = config.fetcher(library, config.ABIs)
  }

  let contract = useMemo(() => {
    if (!isAddress(arg1)) return null
    const abi = config.ABIs.get(arg1)
    new Contract(arg1, abi)
  }, [arg1])

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
  }, [contract])

  // spread operator will crate a new instance on every render
  // const { data, error, mutate, isValidating, revalidate } = useSWR(
  //   key,
  //   fetcher,
  //   config
  // )
  return useSWR(key, fetcher, config)

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

export default useEthSWR
