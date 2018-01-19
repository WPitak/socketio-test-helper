const http = require('http')
const SocketIO = require('socket.io')
const Client = require('./client')
const debug = require('debug')('socketio-test:server')

/**
 * Promise of result from server attempting to listen to a port
 * @param {http.Server} server
 * @param {int} port - port to listen to
 * @return {Promise} resolve to port number if available, reject with error otherwise
 */
const listenPromise = (server, port) =>
  new Promise((resolve, reject) => {
    server
      .once('error', reject)
      .once('listening', () => resolve(port))
      .listen(port)
  })

/**
 * Attempt to make given server listen to a port in given range
 * @param {http.Server} server
 * @param {int} maxPort - largest port number to attempt listening to
 * @param {int} basePort - port number to start attempting
 * @return {int} port number that the server successfully listen to
 * @throws {Error} attempt exceed max port
 */
const tryPort = async (server, maxPort, basePort) => {
  let currentPort = basePort
  while (currentPort <= maxPort) {
    debug(`attempt to occupy port ${currentPort}`)
    try {
      const port = await listenPromise(server, currentPort)
      return port
    } catch (error) {
      if (error.code === 'EADDRINUSE') {
        debug(`port ${currentPort} is in-use, trying next port`)
        currentPort += 1
      } else {
        debug(`error listening to port ${currentPort}: ${error.message}`)
        throw error
      }
    }
  }
  debug(`max attempt reached at port ${maxPort}`)
  throw new Error(`max attempt reached at port ${maxPort}`)
}

const extensionMethods = {
  /**
   * Find available port in range and start server, result is assigned to 'endpoint' property
   */
  async start () {
    const port = await tryPort(this.httpServer, this.maxPort, this.basePort)
    this.endpoint = `http://localhost:${port}`
    debug(`server is listening on port ${port}`)
  },
  /**
   * Create Promise of closing server
   * @return {Promise}
   */
  stop () {
    return new Promise((resolve, reject) => {
      const address = this.httpServer.address()
      if (address) {
        this.close(() => {
          this.endpoint = null
          debug(`server stopped listening on port ${address.port}`)
          return resolve()
        })
      } else {
        debug(`server is already closed`)
        this.endpoint = null
        return resolve()
      }
    })
  },
  /**
   * Create new client with server's current endpoint as uri
   * Newly created client will not automatically attempt to connect by default
   * @param {object} options - options to be passed to client constructor
   * @return {object}
   */
  createClient (options = {}) {
    if (!this.endpoint) {
      return undefined
    }
    const defaults = {
      namespace: '/'
    }
    const clientConstructorDefault = this.clientConstructor ? { clientConstructor: this.clientConstructor } : {}
    const settings = Object.assign({}, defaults, clientConstructorDefault, options)
    return Client(`${this.endpoint}${settings.namespace}`, settings)
  }
}

/**
 * Create Socket.io server for testing
 * @param {object} options
 * @param {int} options.basePort - base port to start attempting to listen, default to 3000
 * @param {int} options.maxAttempt - number of port number increment attempt, default to 1000
 * @param {function} options.serverConstructor - Socket.io Server constructor to use instead of built-in one
 * @return {IO.Server}
 */
module.exports = (options = {}) => {
  // Settings
  const defaults = {
    basePort: 3000,
    maxAttempt: 1000,
    serverConstructor: SocketIO
  }
  const { basePort, maxAttempt, serverConstructor, clientConstructor } = Object.assign({}, defaults, options)
  const maxPort = basePort + maxAttempt - 1

  // Create HTTP and IO server
  const server = http.createServer()
  const io = serverConstructor(server)

  // Initialize custom properties
  const members = {
    endpoint: null,
    basePort,
    maxPort,
    clientConstructor
  }

  return Object.assign(io, members, extensionMethods)
}
