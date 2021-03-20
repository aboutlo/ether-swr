import { cleanup, render, waitFor, act } from '@testing-library/react'
import useEtherSWR, { EtherSWRConfig, etherJsFetcher, cache } from '../src/'
import ERC20ABI from './ERC20.abi.json'
import { sleep } from './utils'

import * as React from 'react'
import { useWeb3React } from '@web3-react/core'
import { Contract } from '@ethersproject/contracts'

import EventEmitterMock from './utils'
import { ABINotFound } from '../src/Errors'
import { BigNumber } from 'ethers'

jest.mock('../src/ether-js-fetcher')
jest.mock('@web3-react/core')
jest.mock('@ethersproject/contracts')

const mockedEthFetcher = etherJsFetcher as jest.Mock
const mockeduseWeb3React = useWeb3React as jest.Mock
const mockedContract = (Contract as unknown) as jest.Mock

const fetcherMock = mockData => () =>
  new Promise(res =>
    setTimeout(() => {
      res([mockData])
    }, 100)
  )

describe('useEtherSWR', () => {
  describe('key', () => {
    describe('base', () => {
      beforeEach(() => {
        cache.clear()
        mockedEthFetcher.mockReset()
      })
      afterEach(cleanup)
      it('resolves using the fetcher passed', async () => {
        const mockData = 10
        const mockFetcher = jest.fn().mockReturnValue(mockData)
        mockedEthFetcher.mockImplementation(jest.fn(() => mockFetcher))

        const key: [string] = ['getBalance']
        function Page() {
          const { data } = useEtherSWR(key, mockedEthFetcher(), {
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

      it('uses a function to generate the key and resolves using the fetcher passed', async () => {
        const mockData = 10

        function Page() {
          const { data, isValidating } = useEtherSWR(
            () => ['0x111', 'balanceOf', '0x01'],
            fetcherMock(mockData),
            {
              dedupingInterval: 0
            }
          )
          if (isValidating) return <div>Loading</div>
          return <div>Balance, {data}</div>
        }

        const { container } = render(<Page />)
        expect(container.textContent).toMatchInlineSnapshot(`"Loading"`)

        await act(() => sleep(110))

        expect(container.textContent).toMatchInlineSnapshot(
          `"Balance, ${mockData}"`
        )
      })

      it('resolves using an existing key', async () => {
        const mockData = 10
        const mockFetcher = jest.fn().mockReturnValue(mockData)
        mockedEthFetcher.mockImplementation(jest.fn(() => mockFetcher))

        function Page() {
          const { data } = useEtherSWR(['getBalance'], mockedEthFetcher(), {
            dedupingInterval: 0
          })
          return <div>Balance, {data}</div>
        }

        const { container } = render(<Page />)

        await waitFor(() => {
          expect(container.firstChild.textContent).toEqual(
            `Balance, ${mockData}`
          )
          // expect(mockFetcher).toBeCalledWith('getBalance')
        })
      })

      it('resolves using the config', async () => {
        const mockData = 51
        const mockFetcher = jest.fn().mockReturnValue(mockData)
        mockedEthFetcher.mockImplementation(jest.fn(() => mockFetcher))

        function Page() {
          const { data } = useEtherSWR(['getBlockByNumber', 'latest'], {
            fetcher: mockedEthFetcher(),
            dedupingInterval: 0
          })
          return <div>Block Number, {data}</div>
        }

        const { container } = render(<Page />)

        await waitFor(() => {
          expect(container.firstChild.textContent).toEqual(
            `Block Number, ${mockData}`
          )
        })
      })

      it('resolves multiple keys using the config', async () => {
        const mockData = 51
        const mockFetcher = jest.fn().mockReturnValue(mockData)
        mockedEthFetcher.mockImplementation(jest.fn(() => mockFetcher))

        function Page() {
          const { data } = useEtherSWR([['getBlockByNumber', 'latest']], {
            fetcher: mockedEthFetcher(),
            dedupingInterval: 0
          })
          return <div>Block Number, {data}</div>
        }

        const { container } = render(<Page />)

        await waitFor(() => {
          expect(container.firstChild.textContent).toEqual(
            `Block Number, ${mockData}`
          )
        })
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
            <EtherSWRConfig
              value={{
                dedupingInterval: 0,
                // ABIs: new Map(),  // FIXME is it better?
                provider: library, // FIXME is it better?
                fetcher: mockedEthFetcher(library, new Map())
              }}
            >
              <Page />
            </EtherSWRConfig>
          )
        }

        function Page() {
          // FIXME if this key isn't unique some randome failure due to SWR
          const { data } = useEtherSWR(['getBalance', 'pending'])
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
      beforeEach(() => {
        cache.clear()
        mockedEthFetcher.mockReset()
      })
      afterEach(cleanup)
      it('throws ABI Missing', async () => {
        const mockData = 10
        const mockFetcher = jest.fn().mockReturnValue(mockData)
        mockedEthFetcher.mockImplementation(jest.fn(() => mockFetcher))

        const mockedLibrary = new EventEmitterMock()

        mockeduseWeb3React.mockReturnValue({
          active: true,
          library: mockedLibrary
        })

        function Page() {
          const { library } = useWeb3React()
          const { data } = useEtherSWR(
            ['0x6b175474e89094c44da98b954eedeac495271d0f', 'balanceOf', '0x01'],
            mockedEthFetcher(),
            {
              ABIs: new Map(),
              provider: library,
              subscribe: []
            }
          )
          return <div>Balance, {data}</div>
        }

        expect(() => {
          render(<Page />)
        }).toThrowError(
          new ABINotFound(
            'Missing ABI for 0x6b175474e89094c44da98b954eedeac495271d0f'
          )
        )
      })

      it('resolves using the fetcher passed', async () => {
        const mockData = 10
        const loadData = keys =>
          new Promise(res =>
            setTimeout(() => {
              // console.log({ keys })
              res([mockData])
            }, 100)
          )

        function Page() {
          const { data, isValidating } = useEtherSWR(
            ['0x111', 'balanceOf', '0x01'],
            loadData,
            {
              dedupingInterval: 0
            }
          )
          if (isValidating) return <div>Loading</div>
          return <div>Balance, {data}</div>
        }

        const { container } = render(<Page />)
        expect(container.textContent).toMatchInlineSnapshot(`"Loading"`)

        await act(() => sleep(110))

        expect(container.textContent).toMatchInlineSnapshot(
          `"Balance, ${mockData}"`
        )
      })

      it('resolves multiple results', async () => {
        const mockData = 'data'
        const loadData = keys =>
          new Promise(res =>
            setTimeout(() => {
              res([mockData])
            }, 100)
          )

        const multiKeys = [
          ['0x111', 'balanceOf', '0x01'],
          ['0x111', 'balanceOf', '0x02']
        ]

        function Page() {
          const { data: balances, error, isValidating } = useEtherSWR<
            BigNumber[]
          >(multiKeys, loadData)

          if (error) {
            return <div>{error.message}</div>
          }
          if (isValidating) {
            return <div>Loading</div>
          }
          return (
            <div>
              {balances &&
                balances.map((balance, index) => {
                  return <p key={index}>Balance, {balance}</p>
                })}
            </div>
          )
        }

        const { container } = render(<Page />)
        expect(container.textContent).toMatchInlineSnapshot(`"Loading"`)

        await act(() => sleep(110))

        expect(container.textContent).toMatchInlineSnapshot(`"Balance, data"`)
      })
    })
  })

  describe('subscribe', () => {
    describe('base', () => {
      afterEach(() => {
        cache.clear()
        // new EventEmitterMock().removeAllListeners()
      })
      it('listens an event and update data', async () => {
        const initialData = 10
        const finalData = initialData + 10
        const method = 'getBalance'
        const keyResolver = jest
          .fn()
          .mockReturnValueOnce(initialData)
          .mockReturnValue(finalData)

        // Looks convoluted but the fetcher is a curled function
        mockedEthFetcher.mockImplementation(
          jest.fn(args => {
            // console.log('fetcher', {args})
            return keyResolver
          })
        )

        const mockedLibrary = new EventEmitterMock()

        mockeduseWeb3React.mockReturnValue({
          active: true,
          library: mockedLibrary
        })

        function Container() {
          const { library } = useWeb3React()
          return (
            <EtherSWRConfig
              value={{
                refreshInterval: 0,
                dedupingInterval: 0,
                ABIs: new Map(),
                provider: library, // FIXME is it better?
                fetcher: mockedEthFetcher(library, new Map())
              }}
            >
              <Page />
            </EtherSWRConfig>
          )
        }

        function Page() {
          const { data, isValidating } = useEtherSWR([method], {
            subscribe: 'block'
          })
          if (isValidating) {
            return <div>Loading</div>
          }
          return <div>Balance, {data}</div>
        }

        const { container } = render(<Container />)
        expect(container.textContent).toMatchInlineSnapshot(`"Loading"`)
        mockedLibrary.emit('block', 1000)

        await act(() => sleep(110))

        await waitFor(() => {
          expect(container.firstChild.textContent).toEqual(
            `Balance, ${finalData}`
          )
          expect(keyResolver).toHaveBeenNthCalledWith(1, method)
          expect(keyResolver).toHaveBeenNthCalledWith(2, method)
          expect(mockedLibrary.listenerCount('block')).toEqual(1)
        })
      })
      it('listens a list of events an update data', async () => {
        const initialData = 10
        const finalData = initialData + 10
        const method = 'getBalance'

        const keyResolver = jest
          .fn()
          .mockReturnValueOnce(initialData)
          .mockReturnValue(finalData)

        // Looks convoluted but the fetcher is a curled function
        mockedEthFetcher.mockImplementation(jest.fn(() => keyResolver))

        const mockedLibrary = new EventEmitterMock()

        mockeduseWeb3React.mockReturnValue({
          active: true,
          library: mockedLibrary
        })

        function Container() {
          const { library } = useWeb3React()
          return (
            <EtherSWRConfig
              value={{
                dedupingInterval: 0,
                ABIs: new Map(),
                provider: library, // FIXME is it better?
                fetcher: mockedEthFetcher(library, new Map())
              }}
            >
              <Page />
            </EtherSWRConfig>
          )
        }

        function Page() {
          const { data } = useEtherSWR(['getBalance'], {
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
          expect(keyResolver).toHaveBeenNthCalledWith(1, method)
          expect(keyResolver).toHaveBeenNthCalledWith(2, method)
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
            <EtherSWRConfig
              value={{
                dedupingInterval: 0,
                ABIs: new Map(),
                provider: library, // FIXME is it better?
                fetcher: mockedEthFetcher(library, new Map())
              }}
            >
              <Page />
            </EtherSWRConfig>
          )
        }

        function Page() {
          const { data, mutate } = useEtherSWR(['getBalance'], {
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
            <EtherSWRConfig
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
            </EtherSWRConfig>
          )
        }

        function Page() {
          const { account } = useWeb3React()
          const { data } = useEtherSWR([contractAddr, 'balanceOf', account], {
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
      it('listens an event and refresh multiple data', async () => {
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
            <EtherSWRConfig
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
            </EtherSWRConfig>
          )
        }

        function Page() {
          const { account } = useWeb3React()
          const { data } = useEtherSWR([[contractAddr, 'balanceOf', account]], {
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
          expect(contract.listenerCount('Transfer')).toEqual(1)
          expect(container.firstChild.textContent).toEqual(
            `Balance, ${initialData + 10}`
          )
        })
      })
      it('listens an event with empty topics and refresh data', async () => {
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
            <EtherSWRConfig
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
            </EtherSWRConfig>
          )
        }

        function Page() {
          const { account } = useWeb3React()
          const { data } = useEtherSWR(
            [
              '0x6126A4C0Eb7822C12Bea32327f1706F035b414bf',
              'balanceOf',
              account
            ],
            {
              // A filter from anyone to me
              subscribe: { name: 'Transfer' }
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
            <EtherSWRConfig
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
            </EtherSWRConfig>
          )
        }

        function Page() {
          const { account } = useWeb3React()
          const { data } = useEtherSWR(
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
            <EtherSWRConfig
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
            </EtherSWRConfig>
          )
        }

        function Page() {
          const { account } = useWeb3React()
          const { data, mutate } = useEtherSWR(
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
            <EtherSWRConfig
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
            </EtherSWRConfig>
          )
        }

        function Page() {
          const { account } = useWeb3React()
          const { data, mutate } = useEtherSWR(
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
