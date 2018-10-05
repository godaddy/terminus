const expect = require('chai').expect

const { Terminus, HealthCheckError } = require('./')

describe('Terminus API', () => {
  it('exposes HealthCheckError', () => {
    expect(HealthCheckError).to.be.a('function')
  })

  it('exposes Terminus class', () => {
    expect(Terminus).to.be.a('function')
  })
})
