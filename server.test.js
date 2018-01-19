/* eslint-env jest */
const Server = require('./server')
const { Server: httpServer } = require('http')

describe('server helper', () => {
  it('accepts custom constructor function', () => {
    const CustomServer = function CustomServer (server) {
      if (!(this instanceof CustomServer)) {
        return new CustomServer(server)
      }

      this.name = 'custom'
      this.server = server
    }
    const server = Server({ serverConstructor: CustomServer })
    expect(server instanceof CustomServer).toBe(true)
    expect(server.server instanceof httpServer).toBe(true)
    expect(server.name).toBe('custom')
    expect(server.endpoint).toBeNull()
  })
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
  describe('createClient', () => {
    it('creates new client which will connect to the server', async () => {
      const io = Server()
      const event = 'echo'
      io.on('connection', (socket) => {
        socket.on(event, (input, ack) => {
          ack(null, input)
        })
      })
      let client
      expect.assertions(1)
      try {
        await io.start()
        client = io.createClient()
        await client.start()
        const result = await client.emitPromise(event, 42)
        expect(result).toBe(42)
      } finally {
        await io.stop()
        if (client && client.stop) {
          await client.stop()
        }
      }
    })
    it('accepts namespace option', async () => {
      const io = Server()
      const event = 'an_event'
      io.on('connection', (socket) => {
        socket.on(event, (ack) => {
          ack(null, 'default_namespace')
        })
      })
      io.of('/n1').on('connection', (socket) => {
        socket.on(event, (ack) => {
          ack(null, 'n1_namespace')
        })
      })
      let c1
      let c2
      expect.assertions()
      try {
        await io.start()
        c1 = io.createClient()
        await c1.start()
        const result1 = await c1.emitPromise(event)
        expect(result1).toBe('default_namespace')
        c2 = io.createClient({namespace: '/n1'})
        await c2.start()
        const result2 = await c2.emitPromise(event)
        expect(result2).toBe('n1_namespace')
      } finally {
        await Promise.all([
          io.stop(),
          (c1 && c1.stop && c1.stop()) || Promise.resolve(),
          (c2 && c2.stop && c2.stop()) || Promise.resolve()
        ])
      }
    })
    it('returns undefined if server is not currently listening thus has no endpoint property', () => {
      const io = Server()
      const client = io.createClient()
      expect(client).toBeUndefined()
    })
  })
})
