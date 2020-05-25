import React, { useEffect } from 'react'
import { Web3ReactProvider, useWeb3React } from '@web3-react/core'
import { Web3Provider } from '@ethersproject/providers'
import { InjectedConnector } from '@web3-react/injected-connector'
import useSWR, { SWRConfig } from 'swr'
import { formatEther, formatUnits } from '@ethersproject/units'
import { Contract } from '@ethersproject/contracts'
import ERC20ABI from './ERC20.abi.json'
import ethFetcher from '../src'

export const Networks = {
  MainNet: 1,
  Ropsten: 3,
  Rinkeby: 4,
  Goerli: 5,
  Kovan: 42
}

export interface IERC20 {
  symbol: string
  address: string
  decimals: number
  name: string
}

export const TOKENS_BY_NETWORK: {
  [key: number]: IERC20[]
} = {
  [Networks.MainNet]: [
    {
      address: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2',
      name: 'Maker',
      symbol: 'MKR',
      decimals: 18
    },
    {
      address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      name: 'Dai Stablecoin',
      symbol: 'DAI',
      decimals: 18
    }
  ],
  [Networks.Rinkeby]: [
    {
      address: '0x5592EC0cfb4dbc12D3aB100b257153436a1f0FEa',
      symbol: 'DAI',
      name: 'Dai',
      decimals: 18
    },
    {
      address: '0xF9bA5210F91D0474bd1e1DcDAeC4C58E359AaD85',
      symbol: 'MKR',
      name: 'Maker',
      decimals: 18
    }
  ]
}

export const ABIs = (chainId): [string, any][] =>
  TOKENS_BY_NETWORK[chainId].map(({ address }) => [address, ERC20ABI])

export const shorter = (str = '') =>
  str.length > 8 ? str.slice(0, 6) + '...' + str.slice(-4) : str

export const injectedConnector = new InjectedConnector({
  supportedChainIds: [
    Networks.MainNet, // Mainet
    Networks.Ropsten, // Ropsten
    Networks.Rinkeby, // Rinkeby
    Networks.Goerli, // Goerli
    Networks.Kovan // Kovan
  ]
})

function getLibrary(provider: any): Web3Provider {
  const library = new Web3Provider(provider)
  library.pollingInterval = 12000
  return library
}

export const EthBalance = () => {
  const { account, library } = useWeb3React<Web3Provider>()
  const { data: balance, mutate } = useSWR(['getBalance', account, 'latest'])

  useEffect(() => {
    // listen for changes on an Ethereum address
    console.log(`listening for blocks...`)
    library.on('block', () => {
      console.log('update balance...')
      mutate(undefined, true)
    })
    // remove listener when the component is unmounted
    return () => {
      library.removeAllListeners('block')
    }
    // trigger the effect only on component mount
  }, [])

  if (!balance) {
    return <div>...</div>
  }
  return <div>{parseFloat(formatEther(balance)).toPrecision(4)} Ξ</div>
}

export const TokenBalance = ({ symbol, address, decimals }) => {
  const { account, library } = useWeb3React<Web3Provider>()
  const { data: balance, mutate } = useSWR([address, 'balanceOf', account])

  useEffect(() => {
    // listen for changes on an Ethereum address
    console.log(`listening for Transfer...`)
    const contract = new Contract(address, ERC20ABI, library.getSigner())
    const fromMe = contract.filters.Transfer(account, null)
    library.on(fromMe, (from, to, amount, event) => {
      console.log('Transfer|sent', { from, to, amount, event })
      mutate(undefined, true)
    })
    const toMe = contract.filters.Transfer(null, account)
    library.on(toMe, (from, to, amount, event) => {
      console.log('Transfer|received', { from, to, amount, event })
      mutate(undefined, true)
    })
    // remove listener when the component is unmounted
    return () => {
      library.removeAllListeners(toMe)
      library.removeAllListeners(fromMe)
    }
    // trigger the effect only on component mount
  }, [])

  if (!balance) {
    return <div>...</div>
  }
  return (
    <div>
      {parseFloat(formatUnits(balance, decimals)).toPrecision(4)} {symbol}
    </div>
  )
}

export const TokenList = ({ chainId }) => {
  return (
    <>
      {TOKENS_BY_NETWORK[chainId].map(token => (
        <TokenBalance key={token.address} {...token} />
      ))}
    </>
  )
}

export const Wallet = () => {
  const { chainId, account, library, activate, active } = useWeb3React<
    Web3Provider
  >()

  const onClick = () => {
    activate(injectedConnector)
  }

  return (
    <div>
      <div>ChainId: {chainId}</div>
      <div>Account: {shorter(account)}</div>
      {active ? (
        <div>✅ </div>
      ) : (
        <button type="button" onClick={onClick}>
          Connect
        </button>
      )}
      {active && (
        <SWRConfig
          value={{ fetcher: ethFetcher(library, new Map(ABIs(chainId))) }}
        >
          <EthBalance />
          <TokenList chainId={chainId} />
        </SWRConfig>
      )}
    </div>
  )
}

export const App = () => {
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <Wallet />
    </Web3ReactProvider>
  )
}
