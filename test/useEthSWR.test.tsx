import { cleanup, render, waitFor } from '@testing-library/react'
import useEthSWR, { EthSWRConfig, ethFetcher } from '../src/'
import * as React from 'react'
import { useWeb3React } from '@web3-react/core'

jest.mock('../src/eth-fetcher')

describe('useEthSWR', () => {
  describe('key', () => {
    afterEach(cleanup)
    /*it('should allow functions as key and reuse the cache', async () => {
      function Page() {
        const { data, revalidate, isValidating, mutate, error } = useEthSWR(
          ['getBalance'],
          () => 'SWR'
        )
        console.log({ data, revalidate, isValidating, mutate, error })
        return <div>hello, {data}</div>
      }

      act(() => {
        const { container } = render(<Page />)
        expect(container.firstChild.textContent).toMatchInlineSnapshot(
          `"hello, SWR"`
        )
      })



    })*/
    it('resolve', async () => {
      const mockData = 10
      const fetcher = jest.fn(() => mockData)

      function Page() {
        const { data } = useEthSWR(['getBalance'], fetcher)
        return <div>Balance, {data}</div>
      }

      const { container } = render(<Page />)

      await waitFor(() =>
        expect(container.firstChild.textContent).toEqual(`Balance, ${mockData}`)
      )
    })

    it('resolve using the config', async () => {
      const mockData = 10
      const fetcher = jest.fn(() => mockData)

      function Page() {
        const { data } = useEthSWR(['getBalance'], { fetcher })
        return <div>Balance, {data}</div>
      }

      const { container } = render(<Page />)

      await waitFor(() =>
        expect(container.firstChild.textContent).toEqual(`Balance, ${mockData}`)
      )
    })

    it('resolve using the context', async () => {
      const mockData = 10
      const mockedEthFetcher = ethFetcher as jest.Mock<typeof ethFetcher>
      mockedEthFetcher.mockImplementation(() => () => () => mockData)

      function Container() {
        const { library } = useWeb3React()
        return (
          <EthSWRConfig
            value={{
              // ABIs: new Map(),  // FIXME is it better?
              // provider: library, // FIXME is it better?
              fetcher: mockedEthFetcher()
            }}
          >
            <Page />
          </EthSWRConfig>
        )
      }

      function Page() {
        const { data } = useEthSWR(['getBalance'])
        return <div>Balance, {data}</div>
      }

      const { container } = render(<Container />)
      expect(mockedEthFetcher).toHaveBeenCalled()

      await waitFor(() =>
        expect(container.firstChild.textContent).toEqual(`Balance, ${mockData}`)
      )
    })
  })

  /*  it('should listen simple', () => {
    const {
      result: { current }
    } = renderHook(() => {
      return useEthSWR(['getBalance', { on: 'block' }])
    })
    expect(current.data).toEqual(undefined)
    expect(current.error).toEqual(undefined)
    expect(current.isValidating).toBeDefined()
    expect(current.revalidate).toBeDefined()
  })

  it('should listen filter', () => {
    const {
      result: { current }
    } = renderHook(() => {
      type Filter = [string, any?, any?, any?]
      const filter1: Filter = ['Transfer', '0x01', null]
      const filter2: Filter = ['Transfer', null, '0x01']
      return useEthSWR(['getBalance', { on: [filter1, filter2] }])
    })
    expect(current.data).toEqual(undefined)
    expect(current.error).toEqual(undefined)
    expect(current.isValidating).toBeDefined()
    expect(current.revalidate).toBeDefined()
  })

  it('should listen filter', () => {
    const {
      result: { current }
    } = renderHook(() => {
      type Filter = [string, any?, any?, any?]
      const filter1: Filter = ['Transfer', '0x01', null]
      const filter2: Filter = ['Transfer', null, '0x01']
      const daiContract = '0x1111'
      const account = '0x00001'
      return useEthSWR([daiContract, 'balanceOf', account], {
        subscribe: [filter1, filter2]
      })
    })
    expect(current.data).toEqual(undefined)
    expect(current.error).toEqual(undefined)
    expect(current.isValidating).toBeDefined()
    expect(current.revalidate).toBeDefined()
  })

  it('should listen filter', () => {
    const {
      result: { current }
    } = renderHook(() => {
      return useEthSWR(['0x1111', 'balanceOf', '0x001'])
    })
    current.subscribe('Transfer', '0x01', null, (state, data, event) => {
      console.log('onTransfer', state, data, event)
    })
    expect(current.data).toEqual(undefined)
    expect(current.error).toEqual(undefined)
    expect(current.isValidating).toBeDefined()
    expect(current.revalidate).toBeDefined()
  })*/
})
