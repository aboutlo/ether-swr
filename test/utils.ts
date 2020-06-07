// make it singleton for testing purpose
let listeners = []

export class EventEmitterMock {
  public filters = {
    Transfer: jest.fn(() => 'Transfer')
  }

  getSigner() {
    return jest.fn()
  }

  on(name: string, callback) {
    listeners.push({ name, callback })
  }

  removeAllListeners(name) {
    listeners = listeners.filter(listener => listener.name === name)
  }

  emit(name: string, ...args) {
    listeners
      .filter(listener => listener.name === name)
      .forEach(({ callback }) => callback(...args))
  }
}

export default EventEmitterMock
