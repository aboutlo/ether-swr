# Ether-SWR

A wrapper to use [SWR](https://swr.vercel.app/) with Ethereum

[![view on npm](https://img.shields.io/npm/v/ether-swr.svg)](https://www.npmjs.org/package/ether-swr)
[![](https://github.com/aboutlo/ether-swr/workflows/ci/badge.svg)](https://github.com/aboutlo/ether-swr/actions?query=workflow%3Aci)

## Declarative fetch

### Interact with basic method

```typescript
const { data: balance } = useEthSWR(['getBalance', 'latest'])
```

You can use all the methods provided by a Web3Provider from [Ether.js]()

### Interact with a smart contract

```typescript
const { data: balance } = useEthSWR([
  '0x6b175474e89094c44da98b954eedeac495271d0f',
  'balanceOf',
  'latest'
])
```

You can use all the methods provided by a contract as long as you have provided the ABI associated to the smart contract

## Getting Started

You can use `EthSWRConfig` to have a global fetcher capable of retrieving basic Ethereum information (e.g. block, getBalance)
or directly interact with a smart contract

```js
import React from 'react'
import { Web3ReactProvider, useWeb3React } from '@web3-react/core'
import { Web3Provider } from '@ethersproject/providers'
import { InjectedConnector } from '@web3-react/injected-connector'
import { BigNumber } from 'ethers'
import { formatEther, formatUnits } from '@ethersproject/units'
import useEthSWR, { EthSWRConfig } from 'ether-swr'
import ERC20ABI from './ERC20.abi.json'

const ABIs = [
  ['0x6b175474e89094c44da98b954eedeac495271d0f', ERC20ABI]
]

const EthBalance = () => {
  const { account } = useWeb3React<Web3Provider>()
  const { data: balance } = useEthSWR(['getBalance', account, 'latest'])

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

  const { data: balance } = useEthSWR([address, 'balanceOf', account])

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
          value={{ web3Provider: library, ABIs: new Map(ABIs) }}
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

A minimal example is available[here](./examples)

## Related projects

- [SWR](https://swr.now.sh)
- [Ether.js)](https://github.com/ethers-io/ethers.js)
- [web3-react](https://github.com/NoahZinsmeister/web3-react)
- [Ethereum JSON-RPC Spec](https://github.com/ethereum/wiki/wiki/JSON-RPC)

## Licence

Licensed under [MIT](./LICENSE).
