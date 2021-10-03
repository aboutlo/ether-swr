import { SWRConfig } from 'swr'
import * as React from 'react'

export function ResetCacheProvider({ children }) {
  return (
    <SWRConfig value={{ dedupingInterval: 0, provider: () => new Map() }}>
      {children}
    </SWRConfig>
  )
}
