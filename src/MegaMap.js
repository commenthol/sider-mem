/**
 * ES6 Map compatible Wrapper for megahash
 * @module MegaMap
 * @copyright 2021 commenthol <commenthol@gmail.com>
 * @license MIT
 */

// @ts-nocheck
const os = require('os')

let MegaHash
if (os.platform() !== 'darwin') {
  MegaHash = require('megahash')
} else {
  class Map {
    constructor () {
      throw new Error('platform not supported')
    }
  }
  MegaHash = Map
}

class Map extends MegaHash {
  get size () {
    return this.length()
  }

  * keys () {
    let key
    while (1) {
      key = this.nextKey(key)
      if (key === undefined) break
      yield key
    }
    return key
  }

  * values () {
    let key
    let value
    while (1) {
      key = this.nextKey(key)
      if (key === undefined) break
      value = this.get(key)
      yield value
    }
    return value
  }

  * entries () {
    let key
    let value
    while (1) {
      key = this.nextKey(key)
      if (key === undefined) break
      value = this.get(key)
      yield [key, value]
    }
    return [key, value]
  }

  [Symbol.iterator] () {
    return this.entries()
  }
}

module.exports = Map
