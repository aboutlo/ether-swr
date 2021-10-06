import useEtherSWR from './useEtherSWR'
import { useWeb3React } from '@web3-react/core'
import { Web3Provider } from './types'
import { BigNumber } from 'ethers'
import { useMemo, useState } from 'react'

export function useBalanceOf<T = BigNumber>(
  contractOrContracts: string | string[],
  ownerOrOwners: string | string[]
) {
  if (Array.isArray(ownerOrOwners) && Array.isArray(contractOrContracts)) {
    throw new Error('Either you pass multiple contracts or multiple owners')
  }
  const key = useMemo(() => {
    const owners =
      Array.isArray(ownerOrOwners) && typeof contractOrContracts === 'string'
        ? ownerOrOwners.map(own => [contractOrContracts, 'balanceOf', own])
        : undefined

    const contracts =
      Array.isArray(contractOrContracts) && typeof ownerOrOwners === 'string'
        ? contractOrContracts.map(cntr => [cntr, 'balanceOf', ownerOrOwners])
        : undefined

    const keys = owners || contracts || []

    const singleKey: [string, any, any] =
      ownerOrOwners &&
      typeof ownerOrOwners === 'string' &&
      typeof contractOrContracts === 'string'
        ? [contractOrContracts as string, 'balanceOf', ownerOrOwners]
        : undefined

    return keys.length > 0 ? keys : singleKey
  }, [contractOrContracts, ownerOrOwners])
  return useEtherSWR<T>(key)
}
