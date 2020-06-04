import { ConfigInterface } from 'swr'
import { Web3Provider } from '@ethersproject/providers'

export interface EthSWRConfigInterface extends ConfigInterface {
  ABIs?: Map<string, any>
  provider?: Web3Provider
}
