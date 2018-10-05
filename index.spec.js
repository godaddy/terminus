const expect = require('chai').expect

const { Terminus, HealthCheckError, HealthCheckNotFoundError, TerminusError } = require('./')

describe('Terminus API', () => {
  it('exposes HealthCheckError', () => {
    expect(HealthCheckError).to.be.a('function')
  })

  it('exposes HealthCheckNotFoundError', () => {
    expect(HealthCheckNotFoundError).to.be.a('function')
  })

  it('exposes TerminusError', () => {
    expect(TerminusError).to.be.a('function')
  })

  it('exposes Terminus class', () => {
    expect(Terminus).to.be.a('function')
  })
})
