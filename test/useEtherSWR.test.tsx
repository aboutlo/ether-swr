import { act, cleanup, render, waitFor } from '@testing-library/react'
import useEtherSWR, { etherJsFetcher, EtherSWRConfig } from '../src/'
import ERC20ABI from './util/ERC20.abi.json'
import {
  EventEmitterMock,
  fetcherMock,
  sleep,
  mockFetcher,
  mockMultipleFetch,
  mockUseWeb3React,
  mockContract
} from './util/utils'

import * as React from 'react'
import { useWeb3React } from '@web3-react/core'
import { Contract } from '@ethersproject/contracts'
import { ABINotFound } from '../src/Errors'
import { contracts } from '../src/Utils'
import { BigNumber } from 'ethers'
import { Web3Provider } from '@ethersproject/providers'
import { DefaultContainer } from './util/components/DefaultContainer'

jest.mock('../src/ether-js-fetcher')
jest.mock('@web3-react/core')
jest.mock('@ethersproject/contracts')

const mockedEthFetcher = etherJsFetcher as jest.Mock
const mockeduseWeb3React = useWeb3React as jest.Mock
const mockedContract = (Contract as unknown) as jest.Mock

describe('useEtherSWR', () => {
  describe('key', () => {
    describe('web3Provider', () => {
      beforeEach(() => {
        mockedEthFetcher.mockReset()
        mockUseWeb3React(mockeduseWeb3React)
      })
      afterEach(cleanup)
      it('resolves using the fetcher passed', async () => {
        const mockData = 10
        const fetcher = mockFetcher(mockedEthFetcher, mockData)

        const key: [string] = ['getBalance']
        function Page() {
          const { data } = useEtherSWR(key)
          return <div>Balance, {data}</div>
        }

        const { container } = render(
          <DefaultContainer fetcher={mockedEthFetcher}>
            <Page />
          </DefaultContainer>
        )

        await waitFor(() => {
          expect(container.firstChild.textContent).toEqual(
            `Balance, ${mockData}`
          )
          expect(fetcher).toBeCalledWith('getBalance')
        })
      })

      it('uses a function to generate the key and resolves using the fetcher passed', async () => {
        const mockData = 10
        const fetcher = mockFetcher(mockedEthFetcher, mockData)

        function Page() {
          const { data, isValidating } = useEtherSWR(
            () => ['0x111', 'balanceOf', '0x01'],
            mockedEthFetcher()
          )
          if (isValidating) return <div>Loading</div>
          return <div>Balance, {data}</div>
        }

        const { container } = render(
          <DefaultContainer fetcher={mockedEthFetcher}>
            <Page />
          </DefaultContainer>
        )
        expect(container.textContent).toMatchInlineSnapshot(`"Loading"`)

        // let's useEffect resolve
        await act(() => sleep(110))

        await waitFor(() => {
          expect(container.textContent).toMatchInlineSnapshot(
            `"Balance, ${mockData}"`
          )
          expect(fetcher).toBeCalledWith('0x111', 'balanceOf', '0x01')
        })
      })

      it('resolves using an existing key', async () => {
        const mockData = 10
        const fetcher = mockFetcher(mockedEthFetcher, mockData)

        function Page() {
          const { data } = useEtherSWR(['getBalance'], mockedEthFetcher())
          return <div>Balance, {data}</div>
        }

        const { container } = render(
          <DefaultContainer fetcher={mockedEthFetcher}>
            <Page />
          </DefaultContainer>
        )

        await waitFor(() => {
          expect(container.firstChild.textContent).toEqual(
            `Balance, ${mockData}`
          )
          expect(fetcher).toBeCalledWith('getBalance')
        })
      })

      it('resolves using the config', async () => {
        const mockData = 51
        const fetcher = mockFetcher(mockedEthFetcher, mockData)

        function Page() {
          const { data } = useEtherSWR(['getBlockByNumber', 'latest'], {
            fetcher: mockedEthFetcher()
          })
          return <div>Block Number, {data}</div>
        }

        const { container } = render(
          <DefaultContainer fetcher={mockedEthFetcher}>
            <Page />
          </DefaultContainer>
        )

        await waitFor(() => {
          expect(container.firstChild.textContent).toEqual(
            `Block Number, ${mockData}`
          )
          expect(fetcher).toBeCalledWith('getBlockByNumber', 'latest')
        })
      })

      it('resolves multiple keys using the config', async () => {
        const mockData = 51
        const fetcher = mockFetcher(mockedEthFetcher, mockData)

        function Page() {
          const { data } = useEtherSWR([['getBlockByNumber', 'latest']], {
            fetcher: mockedEthFetcher()
          })
          return <div>Block Number, {data}</div>
        }

        const { container } = render(
          <DefaultContainer fetcher={mockedEthFetcher}>
            <Page />
          </DefaultContainer>
        )

        await waitFor(() => {
          expect(container.firstChild.textContent).toEqual(
            `Block Number, ${mockData}`
          )
          expect(fetcher).toBeCalledWith(
            JSON.stringify([['getBlockByNumber', 'latest']])
          )
        })
      })

      it('resolves using the context with library', async () => {
        const mockData = 11111
        const fetcher = mockFetcher(mockedEthFetcher, mockData)

        function Page() {
          const { data } = useEtherSWR(['getBalance', 'pending'])
          return <div>Balance, {data}</div>
        }

        const { container } = render(
          <DefaultContainer fetcher={mockedEthFetcher}>
            <Page />
          </DefaultContainer>
        )

        await waitFor(() => {
          expect(container.firstChild.textContent).toEqual(
            `Balance, ${mockData}`
          )
          expect(fetcher).toBeCalledWith('getBalance', 'pending')
        })
      })
    })

    describe('contract', () => {
      beforeEach(() => {
        mockedEthFetcher.mockReset()
        mockUseWeb3React(mockeduseWeb3React)
      })
      afterEach(cleanup)
      it('throws ABI Missing', async () => {
        jest.spyOn(console, 'error').mockImplementation()

        function Page() {
          const { library } = useWeb3React()
          const { data } = useEtherSWR(
            ['0x6b175474e89094c44da98b954eedeac495271d0f', 'balanceOf', '0x01'],
            {
              ABIs: new Map(),
              web3Provider: library,
              subscribe: []
            }
          )
          return <div>Balance, {data}</div>
        }

        expect(() => {
          render(
            <DefaultContainer fetcher={mockedEthFetcher}>
              <Page />
            </DefaultContainer>
          )
        }).toThrowError(
          new ABINotFound(
            'Missing ABI for 0x6b175474e89094c44da98b954eedeac495271d0f'
          )
        )
      })

      it('resolves using the fetcher passed', async () => {
        const mockData = 10
        const fetcher = mockFetcher(mockedEthFetcher, mockData)
        function Page() {
          const { data, isValidating } = useEtherSWR(
            ['0x111', 'balanceOf', '0x01'],
            mockedEthFetcher()
          )
          if (isValidating) return <div>Loading</div>
          return <div>Balance, {data}</div>
        }

        const { container } = render(
          <DefaultContainer fetcher={mockedEthFetcher}>
            <Page />
          </DefaultContainer>
        )
        expect(container.textContent).toMatchInlineSnapshot(`"Loading"`)

        await act(() => sleep(110))

        await waitFor(() => {
          expect(container.textContent).toMatchInlineSnapshot(
            `"Balance, ${mockData}"`
          )
          expect(fetcher).toBeCalledWith('0x111', 'balanceOf', '0x01')
        })
      })

      it('resolves multiple results', async () => {
        const mockData = ['data']
        const fetcher = mockFetcher(mockedEthFetcher, mockData)

        const multiKeys = [
          ['0x111', 'balanceOf', '0x01'],
          ['0x111', 'balanceOf', '0x02']
        ]

        function Page() {
          const { data: balances, error, isValidating } = useEtherSWR<
            BigNumber[]
          >(multiKeys, mockedEthFetcher())

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

        const { container } = render(
          <DefaultContainer fetcher={mockedEthFetcher}>
            <Page />
          </DefaultContainer>
        )
        expect(container.textContent).toMatchInlineSnapshot(`"Loading"`)

        await act(() => sleep(110))

        await waitFor(() => {
          expect(container.textContent).toMatchInlineSnapshot(`"Balance, data"`)
          expect(fetcher).toBeCalledWith(JSON.stringify(multiKeys))
        })
      })
    })
  })

  describe('subscribe', () => {
    describe('base', () => {
      let mockedLibrary: EventEmitterMock
      beforeEach(() => {
        mockedEthFetcher.mockReset()
        mockedLibrary = mockUseWeb3React(mockeduseWeb3React)
      })
      afterEach(cleanup)
      it('listens an event and update data', async () => {
        const initialData = 10
        const finalData = initialData + 10
        const method = 'getBalance'
        const fetcher = mockMultipleFetch(mockedEthFetcher, [
          initialData,
          finalData
        ])

        function Page() {
          const { data, isValidating } = useEtherSWR([method], {
            subscribe: 'block'
          })
          if (isValidating) {
            return <div>Loading</div>
          }
          return <div>Balance, {data}</div>
        }

        const { container } = render(
          <DefaultContainer fetcher={mockedEthFetcher}>
            <Page />
          </DefaultContainer>
        )
        expect(container.textContent).toMatchInlineSnapshot(`"Loading"`)

        act(() => {
          mockedLibrary.emit('block', 1000)
        })

        await waitFor(() => {
          expect(container.firstChild.textContent).toEqual(
            `Balance, ${finalData}`
          )
          expect(fetcher).toHaveBeenNthCalledWith(1, method)
          expect(fetcher).toHaveBeenNthCalledWith(2, method)
          expect(mockedLibrary.listenerCount('block')).toEqual(1)
        })
      })
      it('listens a list of events an update data', async () => {
        const initialData = 10
        const finalData = initialData + 10
        const method = 'getBalance'

        const fetcher = mockMultipleFetch(mockedEthFetcher, [
          initialData,
          finalData
        ])

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

        const { container } = render(
          <DefaultContainer fetcher={mockedEthFetcher}>
            <Page />
          </DefaultContainer>
        )
        act(() => {
          mockedLibrary.emit('block', 1000)
        })

        await waitFor(() => {
          expect(container.firstChild.textContent).toEqual(
            `Balance, ${finalData}`
          )
          expect(fetcher).toHaveBeenNthCalledWith(1, method)
          expect(fetcher).toHaveBeenNthCalledWith(2, method)
          expect(mockedLibrary.listenerCount('block')).toEqual(1)
        })
      })
      it('listens a list of events and invoke the callback', async () => {
        const initialData = 10
        const finalData = initialData + 10
        const callback = jest.fn()

        const fetcher = mockMultipleFetch(mockedEthFetcher, [
          initialData,
          finalData
        ])

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

        const { container } = render(
          <DefaultContainer fetcher={mockedEthFetcher}>
            <Page />
          </DefaultContainer>
        )

        await waitFor(() =>
          expect(container.firstChild.textContent).toEqual(
            `Balance, ${initialData}`
          )
        )

        act(() => {
          mockedLibrary.emit('block', 1000)
        })

        await waitFor(() => {
          expect(container.firstChild.textContent).toEqual(
            `Balance, ${finalData}`
          )
          expect(callback).toHaveBeenCalled()
          expect(fetcher).toHaveBeenNthCalledWith(1, 'getBalance')
          expect(fetcher).toHaveBeenNthCalledWith(2, 'getBalance')
          expect(mockedLibrary.listenerCount('block')).toEqual(1)
        })
      })
    })

    describe('contract', () => {
      let contractInstance
      beforeEach(() => {
        jest.clearAllMocks()
        contractInstance = mockContract(mockedContract)
        contracts.clear()
      })
      afterEach(() => {
        // new EventEmitterMock().removeAllListeners()
      })
      it('listens an event and refresh data', async () => {
        const initialData = 10
        const finalData = initialData + 10
        const contractAddr = '0x6126A4C0Eb7822C12Bea32327f1706F035b414bf'

        const fetcher = mockMultipleFetch(mockedEthFetcher, [
          initialData,
          finalData
        ])

        function Page() {
          const { account } = useWeb3React()
          const { data } = useEtherSWR([contractAddr, 'balanceOf', account], {
            subscribe: 'Transfer'
          })
          return <div>Balance, {data}</div>
        }

        const { container } = render(
          <DefaultContainer
            contractAddr={contractAddr}
            fetcher={mockedEthFetcher}
          >
            <Page />
          </DefaultContainer>
        )

        await waitFor(() =>
          expect(container.firstChild.textContent).toEqual(
            `Balance, ${initialData}`
          )
        )

        act(() => {
          contractInstance.emit('Transfer')
        })

        await waitFor(() => {
          expect(contractInstance.listenerCount('Transfer')).toEqual(1)

          expect(container.firstChild.textContent).toEqual(
            `Balance, ${finalData}`
          )
          expect(fetcher).toHaveBeenNthCalledWith(
            1,
            contractAddr,
            'balanceOf',
            '0x001'
          )
          expect(fetcher).toHaveBeenNthCalledWith(
            2,
            contractAddr,
            'balanceOf',
            '0x001'
          )
        })
      })
      it('listens an event and refresh multiple data', async () => {
        const contractInstance = new EventEmitterMock()
        const initialData = 10
        const finalData = initialData + 10
        const contractAddr = '0x6126A4C0Eb7822C12Bea32327f1706F035b414bf'

        const fetcher = mockMultipleFetch(mockedEthFetcher, [
          initialData,
          finalData
        ])

        function Page() {
          const { account } = useWeb3React()
          const { data } = useEtherSWR([[contractAddr, 'balanceOf', account]], {
            subscribe: 'Transfer'
          })
          return <div>Balance, {data}</div>
        }

        const { container } = render(
          <DefaultContainer
            contractAddr={contractAddr}
            fetcher={mockedEthFetcher}
          >
            <Page />
          </DefaultContainer>
        )

        await waitFor(() =>
          expect(container.firstChild.textContent).toEqual(
            `Balance, ${initialData}`
          )
        )

        const contract = mockedContract()
        act(() => {
          contract.emit('Transfer')
        })

        await waitFor(() => {
          expect(contract.listenerCount('Transfer')).toEqual(1)
          expect(container.firstChild.textContent).toEqual(
            `Balance, ${initialData + 10}`
          )
          const key = JSON.stringify([[contractAddr, 'balanceOf', '0x001']])
          expect(fetcher).toHaveBeenNthCalledWith(1, key)
          expect(fetcher).toHaveBeenNthCalledWith(2, key)
        })
      })
      it('listens an event with empty topics and refresh data', async () => {
        const account = '0x001'
        const initialData = 10
        const finalData = initialData + 10
        const contractAddr = '0x6126A4C0Eb7822C12Bea32327f1706F035b414bf'

        const fetcher = mockMultipleFetch(mockedEthFetcher, [
          initialData,
          finalData
        ])

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

        const { container } = render(
          <DefaultContainer
            contractAddr={contractAddr}
            fetcher={mockedEthFetcher}
          >
            <Page />
          </DefaultContainer>
        )

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
          expect(fetcher).toHaveBeenNthCalledWith(
            1,
            contractAddr,
            'balanceOf',
            account
          )
          expect(fetcher).toHaveBeenNthCalledWith(
            2,
            contractAddr,
            'balanceOf',
            account
          )
        })
      })
      it('listens an event with topics and refresh data', async () => {
        const account = '0x001'
        const initialData = 10
        const finalData = initialData + 10
        const contractAddr = '0x6126A4C0Eb7822C12Bea32327f1706F035b414bf'

        const fetcher = mockMultipleFetch(mockedEthFetcher, [
          initialData,
          finalData
        ])

        function Page() {
          const { account } = useWeb3React()
          const { data } = useEtherSWR([contractAddr, 'balanceOf', account], {
            // A filter from anyone to me
            subscribe: { name: 'Transfer', topics: [null, account] }
          })
          return <div>Balance, {data}</div>
        }

        const { container } = render(
          <DefaultContainer
            contractAddr={contractAddr}
            fetcher={mockedEthFetcher}
          >
            <Page />
          </DefaultContainer>
        )

        await waitFor(() =>
          expect(container.firstChild.textContent).toEqual(
            `Balance, ${initialData}`
          )
        )

        const contract = mockedContract()
        act(() => contract.emit('Transfer'))

        await waitFor(() => {
          expect(container.firstChild.textContent).toEqual(
            `Balance, ${finalData}`
          )
          expect(contract.listenerCount('Transfer')).toEqual(1)
          expect(fetcher).toHaveBeenNthCalledWith(
            1,
            contractAddr,
            'balanceOf',
            account
          )
          expect(fetcher).toHaveBeenNthCalledWith(
            2,
            contractAddr,
            'balanceOf',
            account
          )
        })
      })
      it('listens an event with topics and invoke a callback', async () => {
        const account = '0x001'
        const initialData = 10
        const finalData = initialData + 10
        const contractAddr = '0x6126A4C0Eb7822C12Bea32327f1706F035b414bf'
        const amount = 50
        const callback = jest.fn()

        const fetcher = mockMultipleFetch(mockedEthFetcher, [
          initialData,
          finalData
        ])

        function Page() {
          const { account } = useWeb3React()
          const { data, mutate } = useEtherSWR(
            [contractAddr, 'balanceOf', account],
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

        const { container } = render(
          <DefaultContainer
            contractAddr={contractAddr}
            fetcher={mockedEthFetcher}
          >
            <Page />
          </DefaultContainer>
        )

        await waitFor(() =>
          expect(container.firstChild.textContent).toEqual(
            `Balance, ${initialData}`
          )
        )

        const contract = mockedContract()
        act(() => {
          contract.emit('Transfer', null, account, amount, {})
          // FIXME split in two act to receive two calls to the fetcher
          contract.emit('Transfer', null, account, amount, {})
        })

        await waitFor(() => {
          expect(container.firstChild.textContent).toEqual(
            `Balance, ${initialData + amount + amount}`
          )
          expect(contract.listenerCount('Transfer')).toEqual(1)
          expect(fetcher).toHaveBeenNthCalledWith(
            1,
            contractAddr,
            'balanceOf',
            account
          )
          //FIXME we should receive two calls
          // expect(fetcher).toHaveBeenNthCalledWith(2, contractAddr, 'balanceOf', account)
        })
      })
      it('listens a list of events with topics and invoke all the callbacks', async () => {
        const account = '0x001'
        const initialData = 10
        const finalData = initialData + 10
        const contractAddr = '0x6126A4C0Eb7822C12Bea32327f1706F035b414bf'
        const amount = 50
        const callback = jest.fn()

        const fetcher = mockMultipleFetch(mockedEthFetcher, [
          initialData,
          finalData
        ])

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

        const { container } = render(
          <DefaultContainer
            contractAddr={contractAddr}
            fetcher={mockedEthFetcher}
          >
            <Page />
          </DefaultContainer>
        )

        await waitFor(() =>
          expect(container.firstChild.textContent).toEqual(
            `Balance, ${initialData}`
          )
        )

        act(() => {
          contractInstance.emit('Transfer', null, account, amount, {})
          contractInstance.emit('Transfer', null, account, amount, {})
        })

        await waitFor(() => {
          expect(container.firstChild.textContent).toEqual(
            `Balance, ${initialData + amount + amount}`
          )
          expect(contractInstance.listenerCount('Transfer')).toEqual(1)
          expect(fetcher).toHaveBeenNthCalledWith(
            1,
            contractAddr,
            'balanceOf',
            account
          )
        })
      })
    })
  })
})
