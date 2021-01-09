import { createContext } from 'react'
import { EthSWRConfigInterface } from './types'

const EthSWRConfigContext = createContext<EthSWRConfigInterface>({})
EthSWRConfigContext.displayName = 'EthSWRConfigContext'

export default EthSWRConfigContext
