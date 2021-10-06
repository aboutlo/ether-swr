import Mock = jest.Mock
import { useEffect, useRef } from 'react'

type Listener = { name: string; callback: (args?: any[]) => any }

export class EventEmitterMock {
  listeners: Listener[]
  constructor() {
    this.listeners = []
  }
  public filters = {
    Transfer: jest.fn(() => 'Transfer'),
    block: jest.fn(() => 'block')
  }

  getSigner() {
    return jest.fn()
  }

  on(name: string, callback) {
    this.listeners.push({ name, callback })
  }

  once(name: string, callback) {
    const existingListeners = this.listeners.filter(
      listener => listener.name === name && listener.callback === callback
    )
    if (existingListeners.length === 0) {
      this.listeners.push({ name, callback })
    }
  }

  listenerCount(name: string): number {
    return this.listeners.filter(listener => listener.name === name).length
  }

  removeAllListeners(name = '') {
    if (!name) {
      this.listeners = []
    }
    this.listeners = this.listeners.filter(listener => listener.name === name)
  }

  emit(name: string, ...args) {
    this.listeners
      .filter(listener => listener.name === name)
      .forEach(({ callback }) => callback(...args))
  }
}

export default EventEmitterMock

export function sleep(time: number) {
  return new Promise(resolve => setTimeout(resolve, time))
}

export const fetcherMock = mockData => () =>
  new Promise(res =>
    setTimeout(() => {
      res([mockData])
    }, 100)
  )

/** because a fetcher is a curled function we mock it by creating a mock of the function that execute the fetching **/
export function mockFetcher(fetcher: Mock, data) {
  const mockFetcher = jest.fn().mockReturnValue(data)
  fetcher.mockImplementation(jest.fn(() => mockFetcher))
  return mockFetcher
}

export function mockUseWeb3React(
  mockeduseWeb3React: Mock,
  {
    active = true,
    account = '0x001'
  }: { active?: boolean; account?: string } = {}
) {
  const library = new EventEmitterMock()
  mockeduseWeb3React.mockReturnValue({
    active,
    library,
    account
  })
  return library
}

/** because a fetcher is a curled function we mock it by creating a mock of the function that execute the fetching **/
export function mockMultipleFetch(fetcher: Mock, responses: any[]) {
  const mockFetcher = jest.fn()
  for (const response of responses) {
    mockFetcher.mockReturnValueOnce(response)
  }
  // const mockFetcher = jest.fn().mockReturnValue(data)
  fetcher.mockImplementation(jest.fn(() => mockFetcher))
  return mockFetcher
}

export function mockContract(mockedContract: Mock) {
  const contractInstance = new EventEmitterMock()
  mockedContract.mockImplementation(() => contractInstance)
  return contractInstance
}

const usePrevious = (value, initialValue) => {
  const ref = useRef(initialValue)
  useEffect(() => {
    ref.current = value
  })
  return ref.current
}

const useEffectDebugger = (effectHook, dependencies, dependencyNames = []) => {
  const previousDeps = usePrevious(dependencies, [])

  const changedDeps = dependencies.reduce((accum, dependency, index) => {
    if (dependency !== previousDeps[index]) {
      const keyName = dependencyNames[index] || index
      return {
        ...accum,
        [keyName]: {
          before: previousDeps[index],
          after: dependency
        }
      }
    }

    return accum
  }, {})

  if (Object.keys(changedDeps).length) {
    console.log('[use-effect-debugger] ', changedDeps)
  }

  useEffect(effectHook, dependencies)
}
