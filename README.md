# SWR-eth

An util to use SWR with Ethereum

[![view on npm](https://img.shields.io/npm/v/swr-eth.svg)](https://www.npmjs.org/package/swr-eth)

```typescript
export const EthBalance = ({ symbol, address, decimals }) => {
  const { account, library } = useWeb3React<Web3Provider>()
  const { data: balance } = useSWR(['getBalance', 'latest'])

  if (!balance) {
    return <div>...</div>
  }
  return (
    <div>
      {parseFloat(formatEther(balance)).toPrecision(4)} {symbol}
    </div>
  )
}
```

## Configure in your project

You can use `SWRConfig` to have a global fetcher capable of retrieving basic Ethereum information (e.g. block, getBalance)
or directly interact with a smart contract

```js
import {ethFetcher } from "swr-eth";
import {SWRConfig} from "swr";
import ERC20ABI from "../abi/ERC20.abi.json";
import {EthBalance} from "./EthBalance";

const ABIs = [
  ['0x6b175474e89094c44da98b954eedeac495271d0f', ERC20ABI]
]

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
            <div>✅ </div>
        ) : (
            <button type="button" onClick={onClick}>
              Connect
            </button>
        )}
        {active && (
            <SWRConfig value={{ fetcher: ethFetcher(library, new Map(ABIs)) }}>
              <EthBalance />
              <TokenList chainId={chainId} />
            </SWRConfig>
        )}
      </div>
  )
}
```

## Interact with basic method

    const { data: balance } = useSWR(['getBalance', 'latest'])

You can use all the methods provided by a Web3Provider from [Ether.js]()

## Interact with a smart contract

    const { data: balance } = useSWR(['0x6b175474e89094c44da98b954eedeac495271d0f','balanceOf', 'latest'])

You can use all the methods provided by a contract as long as you have provided the ABI associated to the smat contract
address when you configured the `ethFetcher`

## Example

A minimal example is available[here](./examples)

## Related projects

- [SWR](https://swr.now.sh)
- [Ether.js v5 (Beta)](https://github.com/ethers-io/ethers.js/tree/ethers-v5-beta)
- [web3-react](https://github.com/NoahZinsmeister/web3-react)
- [Ethereum JSON-RPC Spec](https://github.com/ethereum/wiki/wiki/JSON-RPC)

## Licence

Licensed under [MIT](./LICENSE).
