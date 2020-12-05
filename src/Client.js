/* eslint-disable camelcase */
const {
  USERNAME_DEFAULT
} = require('./constants.js')

const toAddress = (addr, port) => addr + ':' + String(port).padStart(4, '0')

const toSeconds = (ms) => Math.floor(ms / 1000)

class Client {
  constructor (socket) {
    this.socket = socket
    this.start = Date.now()
    this.id = Math.floor(Math.random() * Math.pow(2, 32))
    this.name = null
    this.addr = toAddress(socket.remoteAddress, socket.remotePort)
    this.laddr = toAddress(socket.localAddress, socket.localPort)
    this.user = USERNAME_DEFAULT
    this.db = 0
    this._cursor = {}
    this._queue = []
    this._isActive = true
  }

  set isAuthenticated (flag) {
    this._isAuth = flag
  }

  get isAuthenticated () {
    return this._isAuth
  }

  // --- async handling

  setCursor (cursor, iterator, done) {
    this._cursor = {}
    if (!done) {
      this._cursor[cursor] = iterator
    }
  }

  getCursor (cursor) {
    return this._cursor[cursor]
  }

  queueRequest (req) {
    const doRestartProcessing = this._queue.length === 0
    this._queue.push(req)
    return doRestartProcessing
  }

  nextRequest () {
    return this._isActive ? this._queue.shift() : undefined
  }

  end () {
    this._isActive = false
    setImmediate(() => {
      this.socket.end()
    })
  }

  // --- methods for sub commands ---

  list () {
    const { id, addr, laddr, name, db, user, start } = this
    return {
      id,
      addr,
      laddr,
      name,
      db,
      user,
      age: toSeconds(Date.now() - start)
    }
  }
}

module.exports = { Client }
