# Ether-SWR

<div align="center">
  <img src="logo.png" width="450" height="auto"/>
</div>

Ether-SWR is a React hook that fetches Ethereum data, streamlines the chores to keep the internal state of Decentralized App (DApp) and optimize the RPC calls to an Ethereum node.
It does so with a declarative approach via an opinionated wrapper of [SWR](https://swr.vercel.app/).

Ether-SWR follows the `stale-while-revalidate` (HTTP RFC 5861) concept: first it returns the data from cache (stale), then send the fetch request on chain, and finally come with the up-to-date data.

In case the same request is defined multiple times on the same rendered component tree only one request is made because SWR deduping process.

[![view on npm](https://img.shields.io/npm/v/ether-swr.svg)](https://www.npmjs.org/package/ether-swr)
[![](https://github.com/aboutlo/ether-swr/workflows/ci/badge.svg)](https://github.com/aboutlo/ether-swr/actions?query=workflow%3Aci)

## Installation

    yarn add ether-swr

or

    npm install --save ether-swr

## API

### Interact with Ethereum methods (e.g. getBalance, blockNumber)

```typescript
const { data: balance } = useEtherSWR(['getBalance', 'latest'])
```

You can use all the methods provided by a Web3Provider from [Ether.js]()

### Interact with a smart contract (e.g ERC20 )

```typescript
const { data: balance } = useEtherSWR([
  '0x6b175474e89094c44da98b954eedeac495271d0f', // DAI contract
  'balanceOf', // Method
  '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643' // holder
])
```

### Make multiple requests at once with a smart contract (e.g ERC20 )

```typescript
const { data: balances } = useEtherSWR([
  [
    '0x6b175474e89094c44da98b954eedeac495271d0f', // DAI contract
    'balanceOf', // Method
    '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643' // holder 1
  ],
  [
    '0x6b175474e89094c44da98b954eedeac495271d0f', // DAI contract
    'balanceOf', // Method
    '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643' // holder 2
  ]
])
```

You can use all the methods provided by a contract as long as you have provided the ABI associated to the smart contract

### Subscribe to a topic

Subscribe to a topic refresh automatically the underline data once it's dispatched

```typescript
const { data: balance, mutate } = useEtherSWR([address, 'balanceOf', account], {
  subscribe: [
    // A filter from anyone to me
    {
      name: 'Transfer',
      topics: [null, account]
    },
    // A filter from me to anyone
    {
      name: 'Transfer',
      topics: [account, null]
    }
  ]
})

return (
  <div>
    {parseFloat(formatUnits(balance, decimals)).toPrecision(4)} {symbol}
  </div>
)
```

Subscribe to a topic providing a callback allows to use an optimistic update

```typescript
const { data: balance, mutate } = useEtherSWR([address, 'balanceOf', account], {
  subscribe: [
    // A filter from anyone to me
    {
      name: 'Transfer',
      topics: [null, account],
      on: (
        data: BigNumber,
        fromAddress: string,
        toAddress: string,
        amount: BigNumber,
        event: any
      ) => {
        console.log('receive', { event })
        const update = data.add(amount)
        mutate(update, false) // optimistic update skip re-fetch
      }
    },
    // A filter from me to anyone
    {
      name: 'Transfer',
      topics: [account, null],
      on: (
        data: BigNumber,
        fromAddress: string,
        toAddress: string,
        amount: BigNumber,
        event: any
      ) => {
        console.log('send', { event })
        const update = data.sub(amount)
        mutate(update, false) // optimistic update skip re-fetch
      }
    }
  ]
})

return (
  <div>
    {parseFloat(formatUnits(balance, decimals)).toPrecision(4)} {symbol}
  </div>
)
```

## Getting Started

You can use `EthSWRConfig` to have a global fetcher capable of retrieving basic Ethereum information (e.g. block, getBalance)
or directly interact with a smart contract mapped to its ABI.
To keep the state fresh you can pass `refreshInterval: 30000` to the `value` object so that behind the scene Ether-SWR will refresh every 30 seconds the data of all the keys mounted in the tree components.

```js
import React from 'react'
import { Web3ReactProvider, useWeb3React } from '@web3-react/core'
import { Web3Provider } from '@ethersproject/providers'
import { InjectedConnector } from '@web3-react/injected-connector'
import { BigNumber } from 'ethers'
import { formatEther, formatUnits } from '@ethersproject/units'
import useEtherSWR, { EthSWRConfig } from 'ether-swr'
import ERC20ABI from './ERC20.abi.json'

const ABIs = [
  ['0x6b175474e89094c44da98b954eedeac495271d0f', ERC20ABI]
]

const EthBalance = () => {
  const { account } = useWeb3React<Web3Provider>()
  const { data: balance } = useEtherSWR(['getBalance', account, 'latest'])

  if (!balance) {
    return <div>...</div>
  }
  return <div>{parseFloat(formatEther(balance)).toPrecision(4)} Ξ</div>
}

const TokenBalance = ({ symbol, address, decimals }: {
  symbol: string
  address: string
  decimals: number
}) => {
  const { account } = useWeb3React<Web3Provider>()

  const { data: balance } = useEtherSWR([address, 'balanceOf', account])

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
      {['0x6b175474e89094c44da98b954eedeac495271d0f'].map(token => (
        <TokenBalance key={token.address} {...token} />
      ))}
    </>
  )
}

export const Wallet = () => {
  const { chainId, account, library, activate, active } = useWeb3React<Web3Provider>()

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
          value={{ web3Provider: library, ABIs: new Map(ABIs), refreshInterval: 30000 }}
        >
          <EthBalance />
          <TokenList chainId={chainId} />
        </EthSWRConfig>
      )}
    </div>
  )
}
```

## Example

A minimal example with an event is available [here](./examples)

## Utilities

### useBalanceOf

It retrieves balances for an ERC20 token.
You can either pass one or multiple contracts and one or multiple owners

```typescript
import { useBalanceOf } from 'ether-swr'

const { account } = useWeb3React<Web3Provider>()
const { data: balances } = useBalanceOf<BigNumber[]>(
  [
    '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    '0x6B175474E89094C44Da98b954EedeAC495271d0F'
  ],
  account
)
```

### useBalance

It retrieves Ether balance.
You can either pass one or multiple owners

```typescript
import { useBalance } from 'ether-swr'

const { account } = useWeb3React<Web3Provider>()
const { data: balances } = useBalance<BigNumber>(
  [
    '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    '0x6B175474E89094C44Da98b954EedeAC495271d0F'
  ],
  account
)
```

## Related projects

- [SWR](https://swr.now.sh)
- [Ether.js](https://github.com/ethers-io/ethers.js)
- [web3-react](https://github.com/NoahZinsmeister/web3-react)
- [Ethereum JSON-RPC Spec](https://eth.wiki/json-rpc/API)

## Licence

Licensed under [MIT](./LICENSE).
