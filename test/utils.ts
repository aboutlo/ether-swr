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
