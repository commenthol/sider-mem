/**
 * ES6 Map compatible Wrapper for hamt
 */

// @ts-check

// @ts-ignore
const hamt = require('hamt')

class Map {
  constructor () {
    this.h = hamt.empty
  }

  get size () {
    return hamt.count(this.h)
  }

  /**
   * @param {any} key
   * @param {any} value
   */
  set (key, value) {
    this.h = this.h.set(key, value)
  }

  /**
   * @param {any} key
   */
  get (key) {
    return this.h.get(key)
  }

  /**
   * @param {any} key
   */
  has (key) {
    return this.h.has(key)
  }

  /**
   * @param {any} key
   */
  delete (key) {
    if (!this.h.has(key)) return false
    this.h = this.h.delete(key)
    return true
  }

  clear () {
    this.h = hamt.empty
  }

  keys () {
    return hamt.keys(this.h)
  }

  values () {
    return hamt.values(this.h)
  }

  entries () {
    return hamt.entries(this.h)
  }

  [Symbol.iterator] () {
    return hamt.entries(this.h)
  }
}

module.exports = Map
