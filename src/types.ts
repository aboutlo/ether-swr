import { Cache, SWRConfiguration } from 'swr'
import { Wallet } from 'ethers'
import { Listener, Provider } from '@ethersproject/abstract-provider'
import { Signer } from '@ethersproject/abstract-signer'
import { JsonRpcSigner } from '@ethersproject/providers'
import {} from 'swr/dist/types'
// import { Web3Provider } from '@ethersproject/providers'

// simplified version of Web3Provider from '@ethersproject/providers'
export type Web3Provider = {
  getSigner: () => Signer
  on: (eventName: any, listener: Listener) => any
  // removeListener(eventName: any, listener: any): any
  removeAllListeners(eventName: any): any
}

export interface EthSWRConfigInterface<Data = any, Error = any>
  extends SWRConfiguration<Data, Error> {
  provider?: () => Cache
  ABIs?: Map<string, any>
  signer?: Wallet | JsonRpcSigner // e.g. EtherJs wallet
  web3Provider?: Provider | Web3Provider | any // pass only this e.g (useWeb3React) which has a provider with signer. FallbackProvider or Alchemy or Infura etc don't have the getSigner
  subscribe?: any[] | any
}
