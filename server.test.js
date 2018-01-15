/* eslint-env jest */
const Server = require('./server')

describe('server helper', () => {
  it('attempts to find available port and attach server on', async () => {
    const settings = { basePort: 4000, maxAttempt: 10 }
    const s1 = Server(settings)
    const s2 = Server(settings)
    const s3 = Server(settings)
    expect.assertions(6)

    try {
      await s1.start()
      await s2.start()
      await s3.start()

      expect(s1.endpoint).toBe('http://localhost:4000')
      expect(s2.endpoint).toBe('http://localhost:4001')
      expect(s3.endpoint).toBe('http://localhost:4002')

      expect(s1.httpServer.address().port).toBe(4000)
      expect(s2.httpServer.address().port).toBe(4001)
      expect(s3.httpServer.address().port).toBe(4002)
    } finally {
      await s1.stop()
      await s2.stop()
      await s3.stop()
    }
  })
  it('throws if attempt exceeds maximum value', async () => {
    const settings = { basePort: 4000, maxAttempt: 2 }
    const s1 = Server(settings)
    const s2 = Server(settings)
    const s3 = Server(settings)

    expect.assertions(1)
    try {
      await s1.start()
      await s2.start()
      await s3.start()
    } catch (error) {
      expect(error.message).toBe('max attempt reached at port 4001')
    } finally {
      await s1.stop()
      await s2.stop()
      await s3.stop()
    }
  })
})
