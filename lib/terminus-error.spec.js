const expect = require('chai').expect

const { TerminusError } = require('./terminus-error')

describe('Terminus error', () => {
  it('saves the cause', () => {
    const causes = [
      new Error('some error'),
      new Error('some other error')
    ]
    const error = new TerminusError('error', causes)

    expect(error.causes).to.eql(causes)
  })
})
