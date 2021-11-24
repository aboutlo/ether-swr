import { cleanup, render, waitFor, act } from '@testing-library/react'
import useEtherSWR, { EthSWRConfig, etherJsFetcher } from '../src/'
import ERC20ABI from './util/ERC20.abi.json'

import * as React from 'react'
import { useWeb3React } from '@web3-react/core'
import { Contract } from '@ethersproject/contracts'

import EventEmitterMock, { mockFetcher, mockUseWeb3React } from './util/utils'

jest.mock('../src/ether-js-fetcher')
jest.mock('@web3-react/core')
jest.mock('@ethersproject/contracts')

const mockedEthFetcher = etherJsFetcher as jest.Mock
const mockeduseWeb3React = useWeb3React as jest.Mock
const mockedContract = (Contract as unknown) as jest.Mock

describe('EtherSWRConfig', () => {
  beforeEach(() => {
    mockUseWeb3React(mockeduseWeb3React)
  })

  it('configures the defaults with subscribe', async () => {
    const initialData = 10
    const contractAddr = '0x6126A4C0Eb7822C12Bea32327f1706F035b414bf'
    const contractInstance = new EventEmitterMock()
    const account = '0x001'
    const amount = 50
    const callback = jest.fn()

    const fetcher = mockFetcher(mockedEthFetcher, initialData)

    mockedContract.mockImplementation(() => contractInstance)

    function Container() {
      const { library, active } = useWeb3React()
      return (
        <EthSWRConfig
          value={{
            dedupingInterval: 0,
            ABIs: new Map(Object.entries({ [contractAddr]: ERC20ABI })),
            web3Provider: library,
            provider: () => new Map()
          }}
        >
          <Page />
        </EthSWRConfig>
      )
    }

    function Page() {
      const { account } = useWeb3React()
      const { data, mutate } = useEtherSWR(
        [contractAddr, 'balanceOf', account],
        {
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
        }
      )
      return <div>Balance, {data}</div>
    }

    const { container } = render(<Container />)

    await waitFor(() => {
      expect(container.firstChild.textContent).toEqual(
        `Balance, ${initialData}`
      )
      expect(fetcher).toBeCalledWith(contractAddr, 'balanceOf', account)
    })

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
