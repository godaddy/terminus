const expect = require('chai').expect

const { HealthCheckError } = require('./terminus-error')

describe('Terminus error', () => {
  it('saves the cause', () => {
    const causes = [
      new Error('some error'),
      new Error('some other error')
    ]
    const error = new HealthCheckError('error', causes)

    expect(error.causes).to.eql(causes)
  })
})
