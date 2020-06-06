import { ConfigInterface } from 'swr'
import { Web3Provider } from '@ethersproject/providers'
import { fetcherFn } from 'swr/dist/types'

export interface EthSWRConfigInterface<Data = any, Error = any>
  extends ConfigInterface<Data, Error> {
  ABIs?: Map<string, any>
  provider?: Web3Provider
}
