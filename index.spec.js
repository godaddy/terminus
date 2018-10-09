const expect = require('chai').expect

const { getStatus, createTerminus, HealthCheckError } = require('./')

describe('Terminus API', () => {
  it('exposes HealthCheckError', () => {
    expect(HealthCheckError).to.be.a('function')
  })

  it('exposes createTerminus', () => {
    expect(createTerminus).to.be.a('function')
  })

  it('exposes getStatus', () => {
    expect(getStatus).to.be.a('function')
  })
})
