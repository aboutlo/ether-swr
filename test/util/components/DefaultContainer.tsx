import { useWeb3React } from '@web3-react/core'
import { EtherSWRConfig } from '../../../src'
import ERC20ABI from '../ERC20.abi.json'
import * as React from 'react'
import { useState } from 'react'

export type DefaultContainerProps = {
  contractAddr?: string
  children: any
  fetcher: any
}
export function DefaultContainer({
  contractAddr,
  children,
  fetcher
}: DefaultContainerProps) {
  const { library, active } = useWeb3React()
  const [ABIs] = useState(() =>
    contractAddr
      ? new Map(Object.entries({ [contractAddr]: ERC20ABI }))
      : new Map()
  )
  return (
    <EtherSWRConfig
      value={{
        dedupingInterval: 0,
        ABIs,
        web3Provider: library, // FIXME is it better?
        provider: () => new Map(),
        fetcher: fetcher(library, new Map())
      }}
    >
      {children}
    </EtherSWRConfig>
  )
}
