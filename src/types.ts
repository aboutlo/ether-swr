import { ConfigInterface } from 'swr'
import { Web3Provider } from '@ethersproject/providers'
import { EventType, Listener } from '@ethersproject/abstract-provider'

export type Provider = {
  getSigner: () => any
  on: (eventName: any, listener: Listener) => any
  // removeListener(eventName: any, listener: any): any
  removeAllListeners(eventName: any): any
}
export interface EthSWRConfigInterface<Data = any, Error = any>
  extends ConfigInterface<Data, Error> {
  ABIs?: Map<string, any>
  provider?: Provider
  subscribe?: any[] | any
}
