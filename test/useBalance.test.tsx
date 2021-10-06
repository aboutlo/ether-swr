import { mockFetcher, mockMultipleFetch, mockUseWeb3React } from './util/utils'
import useEtherSWR, { etherJsFetcher } from '../src'
import { render, waitFor } from '@testing-library/react'
import { DefaultContainer } from './util/components/DefaultContainer'
import * as React from 'react'
import { useWeb3React } from '@web3-react/core'
import { Contract } from '@ethersproject/contracts'
import { useBalance, useBalances } from '../src/useBalance'
import { BigNumber } from 'ethers'

jest.mock('../src/ether-js-fetcher')
jest.mock('@web3-react/core')
jest.mock('@ethersproject/contracts')

const mockedEthFetcher = etherJsFetcher as jest.Mock
const mockeduseWeb3React = useWeb3React as jest.Mock

describe('useBalance', () => {
  const account = '0x001'

  beforeEach(() => {
    mockedEthFetcher.mockReset()
    mockUseWeb3React(mockeduseWeb3React, { account })
  })

  it('returns the ether balance of an account', async () => {
    const account = '0x002'
    const mockData = 10
    const fetcher = mockFetcher(mockedEthFetcher, mockData)

    function Page() {
      const { data } = useBalance(account)
      return <div>Balance, {data}</div>
    }

    const { container } = render(
      <DefaultContainer fetcher={mockedEthFetcher}>
        <Page />
      </DefaultContainer>
    )

    await waitFor(() => {
      expect(container.firstChild.textContent).toEqual(`Balance, ${mockData}`)
      expect(fetcher).toBeCalledWith('getBalance', account, 'latest')
    })
  })

  it('returns the ether balances of a list of account', async () => {
    const account = '0x002'
    const mockData = BigNumber.from(10)
    const fetcher = mockFetcher(mockedEthFetcher, [mockData])

    function Page() {
      const { data: balances } = useBalances([account])
      if (!balances) {
        return <div>Loading</div>
      }
      return (
        <>
          {balances.map((balance, index) => {
            return <div key={index}>Balance, {balance.toString()}</div>
          })}
        </>
      )
    }

    const { container } = render(
      <DefaultContainer fetcher={mockedEthFetcher}>
        <Page />
      </DefaultContainer>
    )

    await waitFor(() => {
      expect(container.textContent).toEqual(`Balance, ${mockData}`)
      expect(fetcher).toBeCalledWith(
        JSON.stringify([['getBalance', account, 'latest']])
      )
    })
  })
})
