import {
  mockContract,
  mockFetcher,
  mockMultipleFetch,
  mockUseWeb3React
} from './util/utils'
import { etherJsFetcher } from '../src'
import { render, waitFor } from '@testing-library/react'
import { DefaultContainer } from './util/components/DefaultContainer'
import * as React from 'react'
import { useWeb3React } from '@web3-react/core'
import { Contract } from '@ethersproject/contracts'
import { BigNumber } from 'ethers'
import { useBalanceOf } from '../src/useBalanceOf'
import { contracts } from '../src/utils'

jest.mock('../src/ether-js-fetcher')
jest.mock('@web3-react/core')
jest.mock('@ethersproject/contracts')

const mockedEthFetcher = etherJsFetcher as jest.Mock
const mockeduseWeb3React = useWeb3React as jest.Mock
const mockedContract = (Contract as unknown) as jest.Mock

describe('useBalanceOf', () => {
  const account = '0x001'
  const contractAddr = '0x6126A4C0Eb7822C12Bea32327f1706F035b414bf'
  let contractInstance

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseWeb3React(mockeduseWeb3React, { account })
    contractInstance = mockContract(mockedContract)
    contracts.clear()
  })

  it('returns the balanceOf from an owner', async () => {
    const mockData = BigNumber.from(10)
    const fetcher = mockFetcher(mockedEthFetcher, mockData)
    const anotherAccount = '0x003'

    function Page() {
      const { data } = useBalanceOf(contractAddr, anotherAccount)
      if (!data) {
        return <div>Loading</div>
      }
      return <div>Balance, {data.toString()}</div>
    }

    const { container } = render(
      <DefaultContainer contractAddr={contractAddr} fetcher={mockedEthFetcher}>
        <Page />
      </DefaultContainer>
    )

    await waitFor(() => {
      expect(container.firstChild.textContent).toEqual(`Balance, ${mockData}`)
      expect(fetcher).toBeCalledWith(contractAddr, 'balanceOf', anotherAccount)
    })
  })

  it('returns the balanceOf from multiple owners', async () => {
    const mockData = BigNumber.from(10)
    const fetcher = mockFetcher(mockedEthFetcher, [mockData])

    function Page() {
      const { data: balances } = useBalanceOf<BigNumber[]>(contractAddr, [
        account
      ])
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
      <DefaultContainer contractAddr={contractAddr} fetcher={mockedEthFetcher}>
        <Page />
      </DefaultContainer>
    )

    await waitFor(() => {
      expect(container.textContent).toEqual(`Balance, ${mockData}`)
      expect(fetcher).toBeCalledWith(
        JSON.stringify([[contractAddr, 'balanceOf', account]])
      )
    })
  })

  it('returns the balanceOf from multiple contract of the same owner', async () => {
    const anotherAccount = '0x003'
    const mockData = BigNumber.from(10)
    const fetcher = mockFetcher(mockedEthFetcher, [mockData])

    function Page() {
      const { data: balances } = useBalanceOf<BigNumber[]>(
        [contractAddr],
        anotherAccount
      )
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
      <DefaultContainer contractAddr={contractAddr} fetcher={mockedEthFetcher}>
        <Page />
      </DefaultContainer>
    )

    await waitFor(() => {
      expect(container.textContent).toEqual(`Balance, ${mockData}`)
      expect(fetcher).toBeCalledWith(
        JSON.stringify([[contractAddr, 'balanceOf', anotherAccount]])
      )
    })
  })
})
