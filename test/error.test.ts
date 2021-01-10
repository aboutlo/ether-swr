import { ABIError, ABINotFound } from '../src/Errors'

describe('errors', () => {
  it('has a ABIError', () => {
    const msg = 'boom'
    const error = new ABIError(msg)
    expect(error).toBeInstanceOf(ABIError)
    expect(error.message).toEqual(msg)
  })

  it('has a ABIError', () => {
    const msg = 'boom'
    const error = new ABINotFound(msg)
    expect(error).toBeInstanceOf(ABINotFound)
    expect(error.message).toEqual(msg)
  })
})
