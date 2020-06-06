export class LibraryMock {
  private listeners

  constructor() {
    this.listeners = []
  }

  on(name: string, callback) {
    this.listeners.push({ name, callback })
  }

  removeAllListeners(name) {
    this.listeners = this.listeners.filter(listener => listener.name === name)
  }

  publish(name: string, value) {
    this.listeners
      .filter(listener => listener.name === name)
      .forEach(({ callback }) => callback(value))
  }
}

export default LibraryMock
