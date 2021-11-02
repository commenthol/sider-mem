/**
 * @module Client
 */

/* eslint-disable camelcase */

// @ts-check

const {
  USERNAME_DEFAULT
} = require('./constants.js')

/**
 * @typedef {import('node:net').Socket} Socket
 */

/**
 * @param {string|undefined} addr
 * @param {number|undefined} port
 * @returns {string}
 */
const toAddress = (addr = '', port) => addr + ':' + String(port).padStart(4, '0')

/**
 * @param {number} ms
 * @returns {number}
 */
const toSeconds = (ms) => Math.floor(ms / 1000)

class Client {
  /**
   * @param {Socket} socket
   */
  constructor (socket) {
    this.socket = socket
    this.start = Date.now()
    this.id = Math.floor(Math.random() * Math.pow(2, 32))
    /** @type {null|string} */
    this.name = null
    this.addr = toAddress(socket.remoteAddress, socket.remotePort)
    this.laddr = toAddress(socket.localAddress, socket.localPort)
    this.user = USERNAME_DEFAULT
    this.db = 0
    /** @private @type {{ [cursor: string]: Iterator<[any, any]> }} */
    this._cursor = {}
    this._isActive = true
    this._isAuth = false
    this._hasTransaction = false
    /** @private @type {[cmd: string, args: any[]][] } */
    this._transaction = []
    /** @private @type { any[][] } */
    this._queue = []
  }

  set isAuthenticated (flag) {
    this._isAuth = flag
  }

  /**
   * @type {boolean}
   */
  get isAuthenticated () {
    return this._isAuth
  }

  /**
   * @type {boolean}
   */
  get hasTransaction () {
    return this._hasTransaction
  }

  startTransaction () {
    this._hasTransaction = true
    this._transaction = []
  }

  /**
   * @param {string} cmd
   * @param {any[]} args
   */
  pushTransaction (cmd, args) {
    this._transaction.push([cmd, args])
  }

  endTransaction () {
    this._hasTransaction = false
    return this._transaction
  }

  // --- async handling

  /**
   * @param {number|string} cursor
   * @param {Iterator<[any, any]>} iterator
   * @param {boolean|undefined} done
   */
  setCursor (cursor, iterator, done) {
    this._cursor = {}
    if (!done) {
      this._cursor[String(cursor)] = iterator
    }
  }

  /**
   * @param {number|string} cursor
   * @returns {Iterator<[any, any]>}
   */
  getCursor (cursor) {
    return this._cursor[String(cursor)]
  }

  /**
   * @param {any[]} req
   * @returns {boolean}
   */
  queueRequest (req) {
    const doRestartProcessing = this._queue.length === 0
    this._queue.push(req)
    return doRestartProcessing
  }

  /**
   * @returns {any[]|undefined}
   */
  nextRequest () {
    return this._isActive ? this._queue.shift() : undefined
  }

  on (ev, fn) {
    this.socket.on(ev, fn)
  }

  write (data) {
    if (this.socket.destroyed) return
    this.socket.write(data)
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
