import { ConfigInterface } from 'swr'
import { Web3Provider } from '@ethersproject/providers'

export interface EthSWRConfigInterface<Data = any, Error = any>
  extends ConfigInterface<Data, Error> {
  ABIs?: Map<string, any>
  provider?: Web3Provider
  subscribe?: any[] | any
}
