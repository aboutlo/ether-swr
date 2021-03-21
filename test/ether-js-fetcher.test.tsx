import { etherJsFetcher } from '../src'
import { Wallet } from 'ethers'
import { BaseProvider, JsonRpcSigner } from '@ethersproject/providers'
import { Contract } from '@ethersproject/contracts'
import TestABI from './test.abi.json'

jest.mock('@ethersproject/providers')
jest.mock('@ethersproject/contracts')
// jest.mock('ethers')

const ProviderMock = BaseProvider as jest.Mocked<typeof BaseProvider>
const ContractMock = Contract as jest.Mocked<any>
const SignerMock = JsonRpcSigner as jest.Mocked<typeof JsonRpcSigner>
// const WalletMock = Wallet as jest.Mocked<typeof Wallet>

const buildProviderMock = (balance = 1, transactionCount = 1) => {
  // const jsonRpcFetchFunc = jest.fn()
  const getBalanceMock = jest
    .fn()
    .mockImplementation(() => Promise.resolve(balance))
  const getTransactionCountMock = jest
    .fn()
    .mockImplementation(() => Promise.resolve(transactionCount))

  const provider = new ProviderMock('Network')
  provider.getTransactionCount = getTransactionCountMock
  provider.getBalance = getBalanceMock

  return provider
}
const buildSignerMock = (balance = 1, transactionCount = 1) => {
  const getBalanceMock = jest
    .fn()
    .mockImplementation(() => Promise.resolve(balance))

  const getTransactionCountMock = jest
    .fn()
    .mockImplementation(() => Promise.resolve(transactionCount))

  const signer = new SignerMock('0x00', 'provider' as any) as any
  // signer.provider
  signer.address
  signer.getBalance = getBalanceMock
  signer.getTransactionCount = getTransactionCountMock
  return signer
}

describe('ethFetcher', () => {
  let signer: Wallet
  beforeEach(() => {
    signer = buildSignerMock()
  })
  it('is defined', () => {
    expect(etherJsFetcher).toBeDefined()
  })

  it('return a fetcher', () => {
    const provider = buildProviderMock()
    expect(etherJsFetcher(provider, signer)).toBeDefined()
  })

  describe('eth', () => {
    it('return the balance of the signer', async () => {
      const balance = 1
      const provider = buildProviderMock(balance)
      const fetcher = etherJsFetcher(provider, signer)
      // SWR spreads the array when it invoke the fetcher
      await expect(fetcher(...['getBalance'])).resolves.toEqual(balance)
    })
    it('returns the balances of the signer', async () => {
      const balance = 1
      const provider = buildProviderMock(balance)
      const fetcher = etherJsFetcher(provider, signer)
      // SWR spreads the array when it invoke the fetcher
      await expect(fetcher(JSON.stringify([['getBalance']]))).resolves.toEqual([
        balance
      ])
    })
    it('return the getTransactionCount', async () => {
      const transactionCount = 3
      const provider = buildProviderMock(undefined, transactionCount)
      const fetcher = etherJsFetcher(provider, signer)
      const key = ['getTransactionCount']
      // SWR spreads the array when it invoke the fetcher
      await expect(fetcher(...key)).resolves.toEqual(transactionCount)
    })
  })

  describe('contract', () => {
    let provider: BaseProvider
    let signer: Wallet
    beforeEach(() => {
      provider = buildProviderMock()
      signer = buildSignerMock()
    })
    afterEach(() => {
      delete ContractMock.prototype.balanceOf
    })
    it('return the value', async () => {
      const balance = 10
      // workaround create a dynamic method
      ContractMock.prototype.balanceOf = jest
        .fn()
        .mockImplementation(() => Promise.resolve(balance))

      const contract = '0x4592706f9e4E4292464967d16aa31c3d4a81a5A1'
      const account = '0x4592706f9e4E4292464967d16aa31c3d4a81a5A1'
      const ABIs = new Map([[contract, TestABI]])
      const fetcher = etherJsFetcher(provider, signer, ABIs)
      // SWR spreads the array when it invoke the fetcher
      await expect(
        fetcher(...[contract, 'balanceOf', account])
      ).resolves.toEqual(balance)
    })
    it('return multiple values', async () => {
      const balance = 10
      // workaround create a dynamic method
      ContractMock.prototype.balanceOf = jest
        .fn()
        .mockImplementation(() => Promise.resolve(balance))
      const contract = '0x4592706f9e4E4292464967d16aa31c3d4a81a5A1'
      const account = '0x4592706f9e4E4292464967d16aa31c3d4a81a5A1'
      const ABIs = new Map([[contract, TestABI]])
      const fetcher = etherJsFetcher(provider, signer, ABIs)
      // SWR spreads the array when it invoke the fetcher
      await expect(
        fetcher(JSON.stringify([[contract, 'balanceOf', account]]))
      ).resolves.toEqual([balance])
    })
  })
})
