/* eslint-env jest */
const Client = require('./client')
const Server = require('./server')

const io = Server()
const message = 'message'
io.on('connection', (socket) => {
  socket.on(message, (input, callback) => {
    if (typeof input !== 'number') {
      const err = { message: 'not a number' }
      return callback(err)
    }
    return callback(null, input * 2)
  })
})

beforeAll(async () => {
  await io.start()
})
afterAll(async () => {
  await io.stop()
})

describe('client helper', () => {
  describe('start', () => {
    it('connect the client', async () => {
      const client = Client(io.endpoint, { autoConnect: false })
      expect(client.connected).toBe(false)
      await client.start()
      expect(client.connected).toBe(true)
      await client.stop()
    })
  })
  describe('emitPromise', () => {
    it('resolves if receive second arguement in acknowledgement function', async () => {
      const client = Client(io.endpoint, { autoConnect: false })
      await client.start()
      const result = await client.emitPromise(message, 4)
      expect(result).toBe(8)
      await client.stop()
    })
    it('rejects if receive non-null first argument in acknowledgement function', async () => {
      const client = Client(io.endpoint, { autoConnect: false })
      await client.start()
      expect.assertions(1)
      try {
        await client.emitPromise(message, 'x')
      } catch (error) {
        expect(error.message).toBe('not a number')
      } finally {
        await client.stop()
      }
    })
  })
  describe('errorPromise', () => {
    it('resolves if receive non-null first argument in acknowledgement function', async () => {
      const client = Client(io.endpoint, { autoConnect: false })
      await client.start()
      const error = await client.errorPromise(message, 'x')
      expect(error.message).toBe('not a number')
      await client.stop()
    })
    it('rejects to second argument if receive null first argument in acknowledgement function', async () => {
      const client = Client(io.endpoint, { autoConnect: false })
      expect.assertions(1)
      try {
        await client.start()
        await client.errorPromise(message, 4)
      } catch (error) {
        expect(error).toBe(8)
      } finally {
        client.stop()
      }
    })
  })
  describe('oncePromise', () => {
    it('resolves if received falsy first argument in listener', async () => {
      const client = Client(io.endpoint, { autoConnect: false })
      await client.start()
      expect.assertions(1)
      const event = 'server_event'
      try {
        io.emit(event, 42, 23)
        const result = await client.oncePromise(event)
        expect(result).toEqual([42, 23])
      } catch (error) {
        throw error
      } finally {
        await client.stop()
      }
    })
  })
  describe('stop', () => {
    it('disconnects the client', async () => {
      const client = Client(io.endpoint, { autoConnect: false })
      await client.start()
      expect(client.connected).toBe(true)
      await client.stop()
      expect(client.connected).toBe(false)
    })
  })
})
