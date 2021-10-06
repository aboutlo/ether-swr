import useEtherSWR from './useEtherSWR'
import { useWeb3React } from '@web3-react/core'
import { Web3Provider } from './types'
import { BigNumber } from 'ethers'

function sayName({
  first,
  last = 'Smith'
}: {
  first: string
  last?: string
}): void {
  const name = first + ' ' + last
  console.log(name)
}

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
