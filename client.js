const Client = require('socket.io-client')
const debug = require('debug')('socketio-test:client')

const extensionMethods = {
  /**
   * Create Promise of connecting client
   */
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
  /**
   * Create Promise of disconnecting client
   */
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
  /**
   * Create Promise wrapper for event listener's response assuming acknowledge function format of (error, data) => {...}
   * @param {string} message - event name
   * @param {any[]} args - arguments to supply to event listener
   * @return {Promise} Promise wrapping result of acknowledge function
   * reject with first argument if not null
   * resolve to second argument otherwise
   */
  emitPromise (message, ...args) {
    return new Promise((resolve, reject) => {
      this.emit(message, ...args, (error, data) => (error ? reject(error) : resolve(data)))
    })
  },
  /**
   * Create Promise wrapper for event listener's response assuming acknowledge function format of (error, data) => {...}
   * Operate in opposite way to emitPromise
   * @param {string} message - event name
   * @param {any[]} args - arguments to supply to event listener
   * @return {Promise} Promise wrapping result of acknowledge function
   * resolve with first argument if not null
   * reject with second argument otherwise
   */
  errorPromise (message, ...args) {
    return new Promise((resolve, reject) => {
      this.emit(message, ...args, (error, data) => (error ? resolve(error) : reject(data)))
    })
  },
  /**
   * Create Promise wrapper with one-time listener on given event
   * @param {string} event - event name
   * @return {Promise} Promise wrapping result of listener
   * resolve to array of arguments
   */
  oncePromise (event) {
    return new Promise((resolve) => {
      this.once(event, (...args) => resolve(args))
    })
  }
}

module.exports = (uri, options = {}) => {
  const client = typeof uri === 'string' ? Client(uri, options) : uri
  return Object.assign(client, extensionMethods)
}
