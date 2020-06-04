import { renderHook } from '@testing-library/react-hooks'
import useEthSWR from '../src/useEthSWR'

describe('useEthSWR', () => {
  it('should use useEthSWR', () => {
    const {
      result: { current }
    } = renderHook(() => useEthSWR(['something']))
    expect(current.data).toEqual(undefined)
    expect(current.error).toEqual(undefined)
    expect(current.isValidating).toBeDefined()
    expect(current.revalidate).toBeDefined()
  })

  it('should listen simple', () => {
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
      return useEthSWR([
        '0x1111',
        'balanceOf',
        '0x001',
        { on: [filter1, filter2] }
      ])
    })
    expect(current.data).toEqual(undefined)
    expect(current.error).toEqual(undefined)
    expect(current.isValidating).toBeDefined()
    expect(current.revalidate).toBeDefined()
  })

  /*it('should listen filter', () => {
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
