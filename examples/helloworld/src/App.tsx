import React from 'react'
import { Web3ReactProvider, useWeb3React } from '@web3-react/core'
import { Web3Provider } from '@ethersproject/providers'
import { InjectedConnector } from '@web3-react/injected-connector'
import { BigNumber } from 'ethers'
import { formatEther, formatUnits } from '@ethersproject/units'
import useEthSWR, { EthSWRConfig } from 'ether-swr'
import ERC20ABI from './ERC20.abi.json'

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
    }
    /*{
      address: '0xF9bA5210F91D0474bd1e1DcDAeC4C58E359AaD85',
      symbol: 'MKR',
      name: 'Maker',
      decimals: 18
    }*/
  ]
}

export const ABIs = (chainId: number) => {
  const matrix = TOKENS_BY_NETWORK[chainId]
  return Object.entries(
    matrix.reduce((memo, item) => {
      return { ...memo, [item.address]: ERC20ABI }
    }, {})
  )
}

export const shorter = (str: string | null | undefined) =>
  str && str.length > 8 ? str.slice(0, 6) + '...' + str.slice(-4) : str

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
  const { account } = useWeb3React<Web3Provider>()
  const { data: balance } = useEthSWR(['getBalance', account, 'latest'])

  if (!balance) {
    return <div>...</div>
  }
  return <div>{parseFloat(formatEther(balance)).toPrecision(4)} Ξ</div>
}

export const TokenBalance = ({
  symbol,
  address,
  decimals
}: {
  symbol: string
  address: string
  decimals: number
}) => {
  const { account } = useWeb3React<Web3Provider>()

  const { data: balance } = useEthSWR([address, 'balanceOf', account])

  console.log(`render: ${symbol}`)

  if (!balance) {
    return <div>...</div>
  }

  return (
    <div>
      {parseFloat(formatUnits(balance, decimals)).toPrecision(4)} {symbol}
    </div>
  )
}

export const TokenList = ({ chainId }: { chainId: number }) => {
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
        <span role="img" aria-label="active">
          ✅{' '}
        </span>
      ) : (
        <button type="button" onClick={onClick}>
          Connect
        </button>
      )}
      {active && chainId && (
        <EthSWRConfig
          value={{ web3Provider: library, ABIs: new Map(ABIs(chainId)) }}
        >
          <EthBalance />
          <TokenList chainId={chainId} />
        </EthSWRConfig>
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

export default App
