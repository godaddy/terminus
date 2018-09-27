const expect = require('chai').expect

const { createTerminus, HealthCheckError } = require('./')

describe('Terminus API', () => {
  it('exposes HealthCheckError', () => {
    expect(HealthCheckError).to.be.a('function')
  })

  it('exposes createTerminus', () => {
    expect(createTerminus).to.be.a('function')
  })
})
