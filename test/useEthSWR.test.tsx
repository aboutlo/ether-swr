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

describe('useEthSWR', () => {
  describe('key', () => {
    afterEach(() => {
      cache.clear()
      // new EventEmitterMock().removeAllListeners()
      // mockedEthFetcher.mockReset()
    })

    describe('base', () => {
      it('resolves using the fetcher passed', async () => {
        const mockData = 10
        const mockFetcher = jest.fn().mockReturnValue(mockData)
        mockedEthFetcher.mockImplementation(jest.fn(() => mockFetcher))

        function Page() {
          const { data } = useEthSWR(['getBalance'], mockedEthFetcher(), {
            dedupingInterval: 0
          })
          return <div>Balance, {data}</div>
        }

        const { container } = render(<Page />)

        await waitFor(() => {
          expect(container.firstChild.textContent).toEqual(
            `Balance, ${mockData}`
          )
          expect(mockFetcher).toBeCalledWith('getBalance')
        })
      })

      it('resolves using the config', async () => {
        const mockData = 51
        mockedEthFetcher.mockImplementation(
          jest.fn(() => jest.fn().mockReturnValue(mockData))
        )

        function Page() {
          const { data } = useSWR(['getBalance'], {
            fetcher: mockedEthFetcher(),
            dedupingInterval: 0
          })
          return <div>Balance, {data}</div>
        }

        const { container } = render(<Page />)

        await waitFor(() =>
          expect(container.firstChild.textContent).toEqual(
            `Balance, ${mockData}`
          )
        )
      })

      it('resolves using the context', async () => {
        const mockData = 11111
        // Look convolute bu keep in mind the fetcher is a curled function
        mockedEthFetcher.mockImplementation(
          jest.fn(() => jest.fn().mockReturnValue(mockData))
        )
        mockeduseWeb3React.mockReturnValue({
          active: true,
          library: new EventEmitterMock()
        })

        function Container() {
          const { library } = useWeb3React()
          return (
            <EthSWRConfig
              value={{
                dedupingInterval: 0,
                // ABIs: new Map(),  // FIXME is it better?
                web3Provider: library, // FIXME is it better?
                fetcher: mockedEthFetcher(library, new Map())
              }}
            >
              <Page />
            </EthSWRConfig>
          )
        }

        function Page() {
          // FIXME if this key isn't unique some randome failure due to SWR
          const { data } = useEthSWR(['getBalance', 'pending'])
          return <div>Balance, {data}</div>
        }

        const { container } = render(<Container />)
        expect(mockedEthFetcher).toHaveBeenCalled()

        await waitFor(() =>
          expect(container.firstChild.textContent).toEqual(
            `Balance, ${mockData}`
          )
        )
      })
    })

    describe('contract', () => {
      it('resolves using the fetcher passed', async () => {
        const mockData = 10
        const mockFetcher = jest.fn().mockReturnValue(mockData)
        mockedEthFetcher.mockImplementation(jest.fn(() => mockFetcher))

        function Page() {
          const { data } = useEthSWR(
            ['0x111', 'balanceOf', '0x01'],
            mockedEthFetcher(),
            {
              dedupingInterval: 0
            }
          )
          return <div>Balance, {data}</div>
        }

        const { container } = render(<Page />)

        await waitFor(() => {
          expect(container.firstChild.textContent).toEqual(
            `Balance, ${mockData}`
          )
          expect(mockFetcher).toBeCalledWith('0x111', 'balanceOf', '0x01')
        })
      })
    })
  })

  describe('listening', () => {
    describe('base', () => {
      afterEach(() => {
        cache.clear()
        // new EventEmitterMock().removeAllListeners()
      })
      it('listens an event', async () => {
        const initialData = 10

        // Look convolute bu keep in mind the fetcher is a curled function
        mockedEthFetcher.mockImplementation(
          jest.fn(() =>
            jest
              .fn()
              .mockReturnValueOnce(initialData)
              .mockReturnValue(initialData + 10)
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
                web3Provider: library, // FIXME is it better?
                fetcher: mockedEthFetcher(library, new Map())
              }}
            >
              <Page />
            </EthSWRConfig>
          )
        }

        function Page() {
          const { data } = useEthSWR(['getBalance'], {
            subscribe: 'block'
          })
          return <div>Balance, {data}</div>
        }

        const { container } = render(<Container />)

        // await waitFor(() =>
        //   expect(container.firstChild.textContent).toEqual(
        //     `Balance, ${initialData}`
        //   )
        // )

        mockedLibrary.emit('block', 1000)

        await waitFor(() => {
          expect(container.firstChild.textContent).toEqual(
            `Balance, ${initialData + 10}`
          )
          expect(mockedLibrary.listenerCount('block')).toEqual(1)
        })
      })
      it('listens a list of events', async () => {
        const initialData = 10

        // Look convolute bu keep in mind the fetcher is a curled function
        mockedEthFetcher.mockImplementation(
          jest.fn(() =>
            jest
              .fn()
              .mockReturnValueOnce(initialData)
              .mockReturnValue(initialData + 10)
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
                web3Provider: library, // FIXME is it better?
                fetcher: mockedEthFetcher(library, new Map())
              }}
            >
              <Page />
            </EthSWRConfig>
          )
        }

        function Page() {
          const { data } = useEthSWR(['getBalance'], {
            subscribe: [
              {
                name: 'block'
              }
            ]
          })
          return <div>Balance, {data}</div>
        }

        const { container } = render(<Container />)

        mockedLibrary.emit('block', 1000)

        await waitFor(() => {
          expect(container.firstChild.textContent).toEqual(
            `Balance, ${initialData + 10}`
          )
          expect(mockedLibrary.listenerCount('block')).toEqual(1)
        })
      })
      it('listens a list of events and invoke the callback', async () => {
        const initialData = 10
        const callback = jest.fn()

        // Look convolute bu keep in mind the fetcher is a curled function
        mockedEthFetcher.mockImplementation(
          jest.fn(() =>
            jest
              .fn()
              .mockReturnValueOnce(initialData)
              .mockReturnValue(initialData + 10)
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
                web3Provider: library, // FIXME is it better?
                fetcher: mockedEthFetcher(library, new Map())
              }}
            >
              <Page />
            </EthSWRConfig>
          )
        }

        function Page() {
          const { data, mutate } = useEthSWR(['getBalance'], {
            subscribe: [
              {
                name: 'block',
                on: callback.mockImplementation(
                  // force a refresh of getBalance
                  () => {
                    mutate(undefined, true)
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

        mockedLibrary.emit('block', 1000)

        await waitFor(() => {
          expect(container.firstChild.textContent).toEqual(
            `Balance, ${initialData + 10}`
          )
          expect(callback).toHaveBeenCalled()
          expect(mockedLibrary.listenerCount('block')).toEqual(1)
        })
      })
    })

    describe('contract', () => {
      afterEach(() => {
        cache.clear()
        // new EventEmitterMock().removeAllListeners()
      })
      it('listens an event and refresh data', async () => {
        const initialData = 10
        const contractAddr = '0x6126A4C0Eb7822C12Bea32327f1706F035b414bf'
        const contractInstance = new EventEmitterMock()

        // Look convolute bu keep in mind the fetcher is a curled function
        mockedEthFetcher.mockImplementation(
          jest.fn(() =>
            jest
              .fn()
              .mockReturnValueOnce(initialData)
              .mockReturnValue(initialData + 10)
          )
        )

        mockeduseWeb3React.mockReturnValue({
          active: true,
          library: new EventEmitterMock()
        })

        mockedContract.mockImplementation(() => contractInstance)

        function Container() {
          const { library } = useWeb3React()
          return (
            <EthSWRConfig
              value={{
                dedupingInterval: 0,
                ABIs: new Map(Object.entries({ [contractAddr]: ERC20ABI })),
                web3Provider: library, // FIXME is it better?
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
          const { data } = useEthSWR([contractAddr, 'balanceOf', account], {
            subscribe: 'Transfer'
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
        contract.emit('Transfer')

        await waitFor(() => {
          expect(container.firstChild.textContent).toEqual(
            `Balance, ${initialData + 10}`
          )
          expect(contract.listenerCount('Transfer')).toEqual(1)
        })
      })

      it('listens an event with topics and refresh data', async () => {
        const initialData = 10
        const contractAddr = '0x6126A4C0Eb7822C12Bea32327f1706F035b414bf'
        const account = '0x11'
        const contractInstance = new EventEmitterMock()

        // Look convolute bu keep in mind the fetcher is a curled function
        mockedEthFetcher.mockImplementation(
          jest.fn(() =>
            jest
              .fn()
              .mockReturnValueOnce(initialData)
              .mockReturnValue(initialData + 10)
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
                web3Provider: library, // FIXME is it better?
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
        act(() => contract.emit('Transfer'))

        await waitFor(() => {
          expect(container.firstChild.textContent).toEqual(
            `Balance, ${initialData + 10}`
          )
          expect(contract.listenerCount('Transfer')).toEqual(1)
        })
      })

      it('listens an event with topics and invoke a callback', async () => {
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
                web3Provider: library, // FIXME is it better?
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

        await waitFor(() => {
          expect(container.firstChild.textContent).toEqual(
            `Balance, ${initialData + amount + amount}`
          )
          expect(contract.listenerCount('Transfer')).toEqual(1)
        })
      })

      it('listens a list of events with topics and invoke all the callbacks', async () => {
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
                web3Provider: library, // FIXME is it better?
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

        await waitFor(() => {
          expect(container.firstChild.textContent).toEqual(
            `Balance, ${initialData + amount + amount}`
          )
          expect(contract.listenerCount('Transfer')).toEqual(1)
        })
      })
    })
  })
})
