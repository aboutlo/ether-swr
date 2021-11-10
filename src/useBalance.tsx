import useEtherSWR from './useEtherSWR'
import { BigNumber } from 'ethers'

type Options = {
  block: string | number
}
export function useBalance(
  address: string,
  { block }: Options = { block: 'latest' }
) {
  return useEtherSWR(['getBalance', address, block])
}

export function useBalances(
  addresses: string[],
  { block }: Options = { block: 'latest' }
) {
  const keys = addresses.map(address => ['getBalance', address, block])
  return useEtherSWR<BigNumber[]>(keys)
}
