const Client = require('socket.io-client')
const debug = require('debug')('socketio-test:client')

const extensionMethods = {
  start () {
    debug(`attempt to connect to ${this.io.uri}`)
    return new Promise((resolve, reject) => {
      if (this.connected) {
        debug('client already connected')
        return resolve()
      }
      this.once('connect', () => {
        debug('client connected')
        return resolve()
      })
      this.once('connect_error', (error) => {
        debug('error connecting client')
        return reject(error)
      })
      this.once('connect_timeout', (timeout) => {
        debug('connection timeout')
        return reject(timeout)
      })
      debug('call connect()')
      this.connect()
    })
  },
  stop () {
    return new Promise((resolve, reject) => {
      if (this.disconnected) {
        debug('client already disconnected')
        return resolve()
      }
      this.on('disconnect', () => {
        debug('client disconnected')
        return resolve()
      })
      this.disconnect()
    })
  },
  emitPromise (message, ...args) {
    return new Promise((resolve, reject) => {
      this.emit(message, ...args, (error, data) => {
        if (error) {
          return reject(error)
        }
        return resolve(data)
      })
    })
  }
}

module.exports = (uri, options = {}) => {
  const client = Client(uri, options)
  return Object.assign(client, extensionMethods)
}
