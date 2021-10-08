import React from 'react'
import { Web3ReactProvider, useWeb3React } from '@web3-react/core'
import {
  ExternalProvider,
  JsonRpcFetchFunc,
  Web3Provider
} from '@ethersproject/providers'
import { InjectedConnector } from '@web3-react/injected-connector'
import { BigNumber } from 'ethers'
import { Zero } from '@ethersproject/constants'
import { formatEther, formatUnits } from '@ethersproject/units'
import useEtherSWR, { EtherSWRConfig, useBalanceOf } from 'ether-swr'
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
    },
    {
      address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18
    },
    {
      address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      name: 'USD Coin',
      symbol: 'USDC',
      decimals: 6
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

function getLibrary(
  provider: ExternalProvider | JsonRpcFetchFunc
): Web3Provider {
  const library = new Web3Provider(provider)
  library.pollingInterval = 12000
  return library
}

export const EthBalance = () => {
  const { account } = useWeb3React<Web3Provider>()
  const { data: balance, mutate } = useEtherSWR(
    ['getBalance', account, 'latest'],
    {
      subscribe: [
        {
          name: 'block',
          on: (event: any) => {
            console.log('block', { event })
            // on every block we check if Ether balance has changed by re-fetching
            mutate(undefined, true)
          }
        }
      ]
    }
  )

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

  const { data: balance, mutate } = useEtherSWR(
    [address, 'balanceOf', account],
    {
      subscribe: [
        // A filter from anyone to me
        {
          name: 'Transfer',
          topics: [null, account],
          on: (
            state: BigNumber,
            fromAddress: string,
            toAddress: string,
            amount: BigNumber,
            event: any
          ) => {
            console.log('receive', { event })
            const update = state.add(amount)
            mutate(update, false) // optimistic update skip re-fetch
          }
        },
        // A filter from me to anyone
        {
          name: 'Transfer',
          topics: [account, null],
          on: (
            state: BigNumber,
            fromAddress: string,
            toAddress: string,
            amount: BigNumber,
            event: any
          ) => {
            console.log('send', { event })
            const update = state.sub(amount)
            mutate(update, false) // optimistic update skip re-fetch
          }
        }
      ]
    }
  )

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
  const { account } = useWeb3React<Web3Provider>()
  const tokens = TOKENS_BY_NETWORK[chainId]

  // Multiple calls example
  const { data: balances } = useBalanceOf<BigNumber[]>(
    tokens.map(t => t.address),
    account!
  )
  return (
    <>
      {balances &&
        TOKENS_BY_NETWORK[chainId]
          .filter((t, index) => balances[index].gt(Zero))
          .map(token => <TokenBalance key={token.address} {...token} />)}
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
        <EtherSWRConfig
          value={{
            web3Provider: library,
            ABIs: new Map(ABIs(chainId)),
            refreshInterval: 30000
          }}
        >
          <EthBalance />
          <TokenList chainId={chainId} />
        </EtherSWRConfig>
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
