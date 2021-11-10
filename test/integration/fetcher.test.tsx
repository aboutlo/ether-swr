import { etherJsFetcher } from '../../src'
import { BigNumber, getDefaultProvider, Wallet } from 'ethers'
import { Provider } from '@ethersproject/providers'
import ERC20ABI from '../util/ERC20.abi.json'

describe('ethFetcher', () => {
  let signer: Wallet
  let provider: Provider
  beforeEach(() => {
    provider = getDefaultProvider()
    signer = new Wallet(
      'd5dccc2af4ba994df9e79a7522051f3121150ca9c08a27d2aa17dad59c761747',
      provider
    )
    expect(signer.address).toEqual('0xbb4C771e8d880b05321ad3936597DF484b2d1b5d')
  })
  it('is defined', () => {
    expect(etherJsFetcher).toBeDefined()
  })

  it('return a fetcher', () => {
    expect(etherJsFetcher(provider)).toBeDefined()
  })

  describe('eth', () => {
    it('return the balance ', async () => {
      const balance = BigNumber.from(0)
      const fetcher = etherJsFetcher(provider)
      // SWR spreads txhe array when it invoke the fetcher
      await expect(fetcher(...['getBalance', signer.address])).resolves.toEqual(
        balance
      )
    })
    it('returns multiple balances of the signer', async () => {
      const balance = BigNumber.from(0)
      const fetcher = etherJsFetcher(provider)
      // SWR spreads the array when it invoke the fetcher
      await expect(
        fetcher(JSON.stringify([['getBalance', signer.address]]))
      ).resolves.toEqual([balance])
    })
  })

  describe('contract', () => {
    it('return the value', async () => {
      const balance = BigNumber.from(0)

      const contract = '0x6b175474e89094c44da98b954eedeac495271d0f'
      // const account = '0x4592706f9e4E4292464967d16aa31c3d4a81a5A1'
      const ABIs = new Map([[contract, ERC20ABI]])
      const fetcher = etherJsFetcher(provider, ABIs)
      // SWR spreads the array when it invoke the fetcher
      await expect(
        fetcher(...[contract, 'balanceOf', signer.address])
      ).resolves.toEqual(balance)
    })

    it('return the value from a specific block', async () => {
      const balance = BigNumber.from(0)

      const contract = '0x6b175474e89094c44da98b954eedeac495271d0f'
      // const account = '0x4592706f9e4E4292464967d16aa31c3d4a81a5A1'
      const ABIs = new Map([[contract, ERC20ABI]])
      const fetcher = etherJsFetcher(provider, ABIs)
      // SWR spreads the array when it invoke the fetcher
      await expect(
        fetcher(
          ...[contract, 'balanceOf', signer.address, { blockTag: 13589470 }]
        )
      ).resolves.toEqual(balance)
    })

    it('return multiple values', async () => {
      const balance = BigNumber.from(0)
      const contract = '0x6b175474e89094c44da98b954eedeac495271d0f'
      const ABIs = new Map([[contract, ERC20ABI]])
      const fetcher = etherJsFetcher(provider, ABIs)
      // SWR spreads the array when it invoke the fetcher
      await expect(
        fetcher(JSON.stringify([[contract, 'balanceOf', signer.address]]))
      ).resolves.toEqual([balance])
    })

    it('return multiple values from a specific block', async () => {
      const balance = BigNumber.from(0)
      const contract = '0x6b175474e89094c44da98b954eedeac495271d0f'
      const ABIs = new Map([[contract, ERC20ABI]])
      const fetcher = etherJsFetcher(provider, ABIs)
      // SWR spreads the array when it invoke the fetcher
      await expect(
        fetcher(
          JSON.stringify([
            [contract, 'balanceOf', signer.address, { blockTag: 13589470 }]
          ])
        )
      ).resolves.toEqual([balance])
    })
  })
})
