import { cleanup, render, waitFor, act } from '@testing-library/react'
import useEthSWR, { EthSWRConfig, ethFetcher, cache } from '../src/'
import ERC20ABI from './ERC20.abi.json'

import * as React from 'react'
import useSWR from 'swr'
import { useWeb3React } from '@web3-react/core'
import { Web3Provider } from '@ethersproject/providers'
import { Contract } from '@ethersproject/contracts'

import EventEmitterMock from './utils'
import { Listener } from '@ethersproject/abstract-provider'
import { EventFilter } from '@ethersproject/contracts/lib.esm'

jest.mock('../src/eth-fetcher')
jest.mock('@web3-react/core')
jest.mock('@ethersproject/contracts')

const mockedEthFetcher = ethFetcher as jest.Mock
const mockeduseWeb3React = useWeb3React as jest.Mock
const mockedContract = (Contract as unknown) as jest.Mock

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

    it('resolves using the context', async () => {
      const mockData = 11111
      const fetcher = jest.fn(() => mockData)
      const curledFetcher = jest.fn(() => fetcher)

      mockedEthFetcher.mockImplementation(curledFetcher)
      mockeduseWeb3React.mockReturnValue({
        active: true,
        library: new EventEmitterMock()
      })

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
      it('listens an event', async () => {
        const initialData = 10

        // Look convolute bu keep in mind the fetcher is a curled function
        mockedEthFetcher.mockImplementation(
          jest.fn(() =>
            jest
              .fn()
              .mockReturnValueOnce(initialData)
              .mockReturnValueOnce(initialData + 10)
          )
        )

        const mockedLibrary = new EventEmitterMock()

        mockeduseWeb3React.mockReturnValue({
          active: true,
          library: mockedLibrary
        })

        function Container() {
          const { library } = useWeb3React()
          return (
            <EthSWRConfig
              value={{
                dedupingInterval: 0,
                ABIs: new Map(),
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

        await waitFor(() =>
          expect(container.firstChild.textContent).toEqual(
            `Balance, ${initialData}`
          )
        )

        mockedLibrary.emit('block', 1000)

        await waitFor(() =>
          expect(container.firstChild.textContent).toEqual(
            `Balance, ${initialData + 10}`
          )
        )
      })
    })

    describe('contract', () => {
      it('listens an event and refresh data', async () => {
        const initialData = 10
        const contractAddr = '0x6126A4C0Eb7822C12Bea32327f1706F035b414bf'

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
          library: new EventEmitterMock()
        })

        mockedContract.mockImplementation(() => new EventEmitterMock())

        function Container() {
          const { library, active } = useWeb3React()
          return (
            <EthSWRConfig
              value={{
                dedupingInterval: 0,
                ABIs: new Map(Object.entries({ [contractAddr]: ERC20ABI })),
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
              '0x6126A4C0Eb7822C12Bea32327f1706F035b414bf',
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

        await waitFor(() =>
          expect(container.firstChild.textContent).toEqual(
            `Balance, ${initialData}`
          )
        )

        const contract = mockedContract()
        contract.emit('Transfer')

        await waitFor(() =>
          expect(container.firstChild.textContent).toEqual(
            `Balance, ${initialData + 10}`
          )
        )
      })
      it('listens an event with topics and refresh data', async () => {
        const initialData = 10
        const contractAddr = '0x6126A4C0Eb7822C12Bea32327f1706F035b414bf'

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
          library: new EventEmitterMock()
        })

        mockedContract.mockImplementation(() => new EventEmitterMock())

        function Container() {
          const { library, active } = useWeb3React()
          return (
            <EthSWRConfig
              value={{
                dedupingInterval: 0,
                ABIs: new Map(Object.entries({ [contractAddr]: ERC20ABI })),
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
              '0x6126A4C0Eb7822C12Bea32327f1706F035b414bf',
              'balanceOf',
              account
            ],
            {
              // A filter from anyone to me
              subscribe: { name: 'Transfer', topics: [null, account] }
            }
          )
          return <div>Balance, {data}</div>
        }

        const { container } = render(<Container />)

        await waitFor(() =>
          expect(container.firstChild.textContent).toEqual(
            `Balance, ${initialData}`
          )
        )

        const contract = mockedContract()
        contract.emit('Transfer')

        await waitFor(() =>
          expect(container.firstChild.textContent).toEqual(
            `Balance, ${initialData + 10}`
          )
        )
      })

      it('listens an event with topics and invoke a callback', async () => {
        const initialData = 10
        const contractAddr = '0x6126A4C0Eb7822C12Bea32327f1706F035b414bf'
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

        mockedContract.mockImplementation(() => new EventEmitterMock())

        function Container() {
          const { library, active } = useWeb3React()
          return (
            <EthSWRConfig
              value={{
                dedupingInterval: 0,
                ABIs: new Map(Object.entries({ [contractAddr]: ERC20ABI })),
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
          const { data, mutate } = useEthSWR(
            [
              '0x6126A4C0Eb7822C12Bea32327f1706F035b414bf',
              'balanceOf',
              account
            ],
            {
              // A filter from anyone to me
              subscribe: {
                name: 'Transfer',
                topics: [null, account],
                on: callback.mockImplementation(
                  (data, fromAddress, toAddress, amount, event) => {
                    const update = data + amount
                    mutate(update, false) // optimist update skip re-fetch
                  }
                )
              }
            }
          )
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
            `Balance, ${initialData + amount + amount}`
          )
        )
      })

      it('listens a list of events with topics and invoke all the callbacks', async () => {
        const initialData = 10
        const contractAddr = '0x6126A4C0Eb7822C12Bea32327f1706F035b414bf'
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

        mockedContract.mockImplementation(() => new EventEmitterMock())

        function Container() {
          const { library, active } = useWeb3React()
          return (
            <EthSWRConfig
              value={{
                dedupingInterval: 0,
                ABIs: new Map(Object.entries({ [contractAddr]: ERC20ABI })),
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
          const { data, mutate } = useEthSWR(
            [
              '0x6126A4C0Eb7822C12Bea32327f1706F035b414bf',
              'balanceOf',
              account
            ],
            {
              // A filter from anyone to me
              subscribe: [
                {
                  name: 'Transfer',
                  topics: [null, account],
                  on: callback.mockImplementation(
                    (data, fromAddress, toAddress, amount, event) => {
                      const update = data + amount
                      mutate(update, false) // optimist update skip re-fetch
                    }
                  )
                }
              ]
            }
          )
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
            `Balance, ${initialData + amount + amount}`
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
