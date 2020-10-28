// make it singleton for testing purpose
type Listener = { name: string; callback: (args?: any[]) => any }

let listeners: Listener[] = []

export class EventEmitterMock {
  public filters = {
    Transfer: jest.fn(() => 'Transfer'),
    block: jest.fn(() => 'block')
  }

  getSigner() {
    return jest.fn()
  }

  on(name: string, callback) {
    listeners.push({ name, callback })
  }

  once(name: string, callback) {
    const existingListeners = listeners.filter(
      listener => listener.name === name && listener.callback === callback
    )
    if (existingListeners.length === 0) {
      listeners.push({ name, callback })
    }
  }

  removeAllListeners(name = '') {
    if (!name) {
      listeners = []
    }
    listeners = listeners.filter(listener => listener.name === name)
  }

  emit(name: string, ...args) {
    listeners
      .filter(listener => listener.name === name)
      .forEach(({ callback }) => callback(...args))
  }
}

export default EventEmitterMock
