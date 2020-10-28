import { cleanup, render, waitFor, act } from '@testing-library/react'
import useEthSWR, { EthSWRConfig, ethFetcher, cache } from '../src/'
import ERC20ABI from './ERC20.abi.json'

import * as React from 'react'
import useSWR from 'swr'
import { useWeb3React } from '@web3-react/core'
import { Contract } from '@ethersproject/contracts'

import EventEmitterMock from './utils'

jest.mock('../src/eth-fetcher')
jest.mock('@web3-react/core')
jest.mock('@ethersproject/contracts')

const mockedEthFetcher = ethFetcher as jest.Mock
const mockeduseWeb3React = useWeb3React as jest.Mock
const mockedContract = (Contract as unknown) as jest.Mock

describe('EtherSWRConfig', () => {
  afterEach(() => {
    cache.clear()
    // new EventEmitterMock().removeAllListeners()
  })

  it('configures the default fetcher', async () => {
    const initialData = 10
    const contractAddr = '0x6126A4C0Eb7822C12Bea32327f1706F035b414bf'
    const contractInstance = new EventEmitterMock()
    const account = '0x001'
    const amount = 50
    const callback = jest.fn()

    // Look convolute bu keep in mind the fetcher is a curled function
    mockedEthFetcher.mockImplementation(
      jest.fn(() =>
        jest
          .fn()
          .mockReturnValueOnce(initialData)
          .mockReturnValueOnce(initialData + 10)
      )
    )

    mockeduseWeb3React.mockReturnValue({
      active: true,
      library: new EventEmitterMock(),
      account
    })

    mockedContract.mockImplementation(() => contractInstance)

    function Container() {
      const { library, active } = useWeb3React()
      return (
        <EthSWRConfig
          value={{
            dedupingInterval: 0,
            ABIs: new Map(Object.entries({ [contractAddr]: ERC20ABI })),
            web3Provider: library
          }}
        >
          <Page />
        </EthSWRConfig>
      )
    }

    function Page() {
      const { account } = useWeb3React()
      const { data, mutate } = useEthSWR([contractAddr, 'balanceOf', account], {
        // A filter from anyone to me
        subscribe: [
          {
            name: 'Transfer',
            topics: [null, account],
            on: callback.mockImplementation(
              // currentData, all the props from the event
              (data, fromAddress, toAddress, amount, event) => {
                const update = data + amount
                mutate(update, false) // optimistic update skip re-fetch
              }
            )
          }
        ]
      })
      return <div>Balance, {data}</div>
    }

    const { container } = render(<Container />)

    await waitFor(() =>
      expect(container.firstChild.textContent).toEqual(
        `Balance, ${initialData}`
      )
    )

    const contract = mockedContract()
    act(() => {
      contract.emit('Transfer', null, account, amount, {})
      contract.emit('Transfer', null, account, amount, {})
    })

    await waitFor(() =>
      expect(container.firstChild.textContent).toEqual(
        `Balance, ${initialData + amount * 2}`
      )
    )
  })
})
