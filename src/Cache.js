/*!
 * @copyright 2021 commenthol <commenthol@gmail.com>
 * @license MIT
 */

const {
  ERR_TYPE
} = require('./constants.js')

class Cache {
  constructor (options) {
    const {
      HashMap = Map,
      nextHouseKeepingSec = 30
    } = options

    this.map = new HashMap()
    this.expires = new HashMap()
    this._nextHouseKeepingMs = nextHouseKeepingSec * 1000

    this._houseKeeping = this._houseKeeping.bind(this)
    this._loopExpired = this._loopExpired.bind(this)
    this._houseKeeping()
  }

  _houseKeeping () {
    this._expiresIterator = this.expires[Symbol.iterator]()
    this._loopExpired()
  }

  _loopExpired () {
    const { value, done } = this._expiresIterator.next()
    if (done) {
      setTimeout(() => this._houseKeeping(), this._nextHouseKeepingMs)
      return
    }
    const [key, expiresAt] = value
    if (Date.now() > expiresAt) {
      this.expires.delete(key)
      this.map.delete(key)
    }
    process.nextTick(() => this._loopExpired())
  }

  set (key, value, type) {
    this.map.set(key, { type, value })
  }

  has (key) {
    if (this.expires.has(key) && this.expires.get(key) <= Date.now()) {
      this.map.delete(key)
      this.expires.delete(key)
      return false
    }
    return this.map.has(key)
  }

  get (key, expectedType) {
    if (!this.map.has(key)) {
      return null
    }
    const { value, type } = this.map.get(key)
    if (type !== expectedType) {
      throw new TypeError(ERR_TYPE)
    }
    return value
  }

  getType (key) {
    if (!this.map.has(key)) {
      return null
    }
    const { type } = this.map.get(key)
    return type
  }

  delete (key) {
    this.expires.delete(key)
    if (this.map.has(key)) {
      this.map.delete(key)
      return true
    }
  }

  size () {
    return this.map.size
  }

  clear () {
    this.expires.clear()
    this.map.clear()
  }

  iterator () {
    return this.map[Symbol.iterator]()
  }

  hasExpiry (key) {
    return this.expires.has(key)
  }

  getExpiry (key) {
    return this.expires.get(key)
  }

  setExpiry (key, expiry) {
    if (this.map.has(key)) {
      this.expires.set(key, expiry)
    }
  }

  deleteExpiry (key) {
    return this.expires.delete(key)
  }
}

module.exports = {
  Cache
}
