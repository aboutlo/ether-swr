import { cleanup, render, waitFor, act } from '@testing-library/react'
import useEthSWR, { EthSWRConfig, ethFetcher, cache } from '../src/'

import * as React from 'react'
import useSWR from 'swr'
import { useWeb3React } from '@web3-react/core'
import { Web3Provider } from '@ethersproject/providers'
import LibraryMock from './utils'

jest.mock('../src/eth-fetcher')
jest.mock('@web3-react/core')

const mockedEthFetcher = ethFetcher as jest.Mock
const mockeduseWeb3React = useWeb3React as jest.Mock

afterEach(() => {
  cleanup()
  act(() => cache.clear(false))
})

describe('useEthSWR', () => {
  describe('key', () => {
    beforeEach(() => {
      // console.log('cache', cache.keys())
      // // act(() => )
      // // act(() => cache.delete('getBalance', false))
      //
      // jest.resetAllMocks()
      // // console.log('cache', cache.keys())
    })

    it('resolves using the fetcher passed', async () => {
      const mockData = 10
      mockedEthFetcher.mockImplementation(
        (library: Web3Provider, ABIs: any) => {
          return (...args) => {
            return mockData
          }
        }
      )

      function Page() {
        const { data } = useEthSWR(['getBalance'], mockedEthFetcher())
        return <div>Balance, {data}</div>
      }

      const { container } = render(<Page />)

      await waitFor(() =>
        expect(container.firstChild.textContent).toEqual(`Balance, ${mockData}`)
      )
    })

    it('resolves using the config', async () => {
      const mockData = 50
      // const fetcher = jest.fn(() => mockData)
      mockedEthFetcher.mockImplementation(
        (library: Web3Provider, ABIs: any) => {
          return (...args) => {
            return mockData
          }
        }
      )

      function Page() {
        // const { data } = useEthSWR(['getBalance'], {
        //   fetcher: mockedEthFetcher()
        // })
        const { data } = useSWR(['getBalance', 'pending'], {
          fetcher: mockedEthFetcher()
        })
        return <div>Balance, {data}</div>
      }

      const { container } = render(<Page />)

      await waitFor(() =>
        expect(container.firstChild.textContent).toEqual(`Balance, ${mockData}`)
      )
    })

    it('resolvess using the context', async () => {
      const mockData = 11111
      const fetcher = jest.fn(() => mockData)
      const curledFetcher = jest.fn(() => fetcher)

      mockedEthFetcher.mockImplementation(curledFetcher)

      function Container() {
        const { library } = useWeb3React()
        return (
          <EthSWRConfig
            value={{
              // dedupingInterval: 0,
              // ABIs: new Map(),  // FIXME is it better?
              provider: library, // FIXME is it better?
              fetcher: mockedEthFetcher(library, new Map())
            }}
          >
            <Page />
          </EthSWRConfig>
        )
      }

      function Page() {
        const { data } = useEthSWR(['getBalance', 'latest'])
        return <div>Balance, {data}</div>
      }

      const { container } = render(<Container />)
      expect(mockedEthFetcher).toHaveBeenCalled()
      expect(fetcher).toHaveBeenCalled()

      await waitFor(() =>
        expect(container.firstChild.textContent).toEqual(`Balance, ${mockData}`)
      )
    })
  })

  describe('listening', () => {
    describe('base', () => {
      it.only('listens an event', async () => {
        const mockData = 10
        const fetcher = jest
          .fn()
          .mockReturnValueOnce(mockData)
          .mockReturnValueOnce(mockData + 10)

        const curledFetcher = jest.fn(() => fetcher)
        const mockedLibrary = new LibraryMock()

        mockedEthFetcher.mockImplementation(curledFetcher)
        mockeduseWeb3React.mockReturnValue({
          active: true,
          library: mockedLibrary
        })

        function Container() {
          const { library, active } = useWeb3React()
          console.log({ active })
          return (
            <EthSWRConfig
              value={{
                // dedupingInterval: 0,
                // ABIs: new Map(),  // FIXME is it better?
                provider: library, // FIXME is it better?
                // it could be because the fetcher can receive all the params at once
                //
                fetcher: mockedEthFetcher(library, new Map())
              }}
            >
              <Page />
            </EthSWRConfig>
          )
        }

        function Page() {
          const { data } = useEthSWR(['getBalance', 'earliest'], {
            subscribe: 'block'
          })
          return <div>Balance, {data}</div>
        }

        const { container } = render(<Container />)
        expect(mockedEthFetcher).toHaveBeenCalled()
        expect(fetcher).toHaveBeenCalled()

        await waitFor(() =>
          expect(container.firstChild.textContent).toEqual(
            `Balance, ${mockData}`
          )
        )

        mockedLibrary.publish('block', 1000)

        await waitFor(() =>
          expect(container.firstChild.textContent).toEqual(
            `Balance, ${mockData + 10}`
          )
        )
      })
    })

    describe('contract', () => {
      it.skip('listens an event', async () => {
        const mockData = 10
        const fetcher = jest
          .fn()
          .mockReturnValueOnce(mockData)
          .mockReturnValueOnce(mockData + 10)

        const curledFetcher = jest.fn(() => fetcher)
        const mockedLibrary = new LibraryMock()

        mockedEthFetcher.mockImplementation(curledFetcher)
        mockeduseWeb3React.mockReturnValue({
          active: true,
          library: mockedLibrary
        })

        function Container() {
          const { library, active } = useWeb3React()
          console.log({ active })
          return (
            <EthSWRConfig
              value={{
                dedupingInterval: 0,
                // ABIs: new Map(),  // FIXME is it better?
                provider: library, // FIXME is it better?
                // it could be because the fetcher can receive all the params at once
                //
                fetcher: mockedEthFetcher(library, new Map())
              }}
            >
              <Page />
            </EthSWRConfig>
          )
        }

        function Page() {
          const { account } = useWeb3React()
          const { data } = useEthSWR(
            [
              '0xDea8D8A8255Fd005Dcd29569e6ade8DE21705fEd',
              'balanceOf',
              account
            ],
            {
              subscribe: 'Transfer'
            }
          )
          return <div>Balance, {data}</div>
        }

        const { container } = render(<Container />)
        expect(mockedEthFetcher).toHaveBeenCalled()
        expect(fetcher).toHaveBeenCalled()

        await waitFor(() =>
          expect(container.firstChild.textContent).toEqual(
            `Balance, ${mockData}`
          )
        )

        mockedLibrary.publish('block', 1000)

        await waitFor(() =>
          expect(container.firstChild.textContent).toEqual(
            `Balance, ${mockData + 10}`
          )
        )
      })
    })

    /*

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
})
