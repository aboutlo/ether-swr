/*import {
  act,
  cleanup,
  fireEvent,
  render,
  waitForDomChange
} from '@testing-library/react'*/

import ethFetcher from '../src'
import { Web3Provider } from '@ethersproject/providers'
import { Contract } from '@ethersproject/contracts'
import TestABI from './test.abi.json'

jest.mock('@ethersproject/providers')
jest.mock('@ethersproject/contracts')

const Web3ProviderMock = Web3Provider as jest.Mocked<typeof Web3Provider>
const ContractMock = Contract as jest.Mocked<any>

describe('ethFetcher', () => {
  it('is defined', () => {
    expect(ethFetcher).toBeDefined()
  })

  it('return a fetcher', () => {
    const jsonRpcFetchFunc = jest.fn()
    const library = new Web3ProviderMock(jsonRpcFetchFunc)
    expect(ethFetcher(library)).toBeDefined()
  })

  describe('eth', () => {
    it('return the value', async () => {
      const jsonRpcFetchFunc = jest.fn()
      const library = new Web3ProviderMock(jsonRpcFetchFunc)
      const balance = 1
      library.getBalance = jest
        .fn()
        .mockImplementation(() => Promise.resolve(balance))
      const fetcher = ethFetcher(library)
      await expect(fetcher(['getBalance'])).resolves.toEqual(balance)
    })
  })

  describe('contract', () => {
    afterEach(() => {
      delete ContractMock.prototype.balanceOf
    })
    it('return the value', async () => {
      const jsonRpcFetchFunc = jest.fn()
      const library = new Web3ProviderMock(jsonRpcFetchFunc)
      const balance = 1
      // workaround create a dynamic method
      ContractMock.prototype.balanceOf = jest
        .fn()
        .mockImplementation(() => Promise.resolve(balance))
      const contract = '0x4592706f9e4E4292464967d16aa31c3d4a81a5A1'
      const account = '0x4592706f9e4E4292464967d16aa31c3d4a81a5A1'
      const ABIs = new Map([[contract, TestABI]])
      const fetcher = ethFetcher(library, ABIs)
      await expect(fetcher([contract, 'balanceOf', account])).resolves.toEqual(
        balance
      )
    })
  })
})
