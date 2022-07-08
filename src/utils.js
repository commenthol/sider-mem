/**
 * @module utils
 * @copyright 2021 commenthol <commenthol@gmail.com>
 * @license MIT
 */

// @ts-check

const process = require('process')
const crypto = require('crypto')
const { promisify } = require('util')
const picomatch = require('picomatch')
const { TYPE_STRING, TYPE_HASH, TYPE_NONE, TYPE_LIST } = require('./constants')

/**
 * @param {any} v
 * @returns {boolean}
 */
const isNil = (v) => v === null || v === undefined

/**
 * @param {any} v
 * @returns {boolean}
 */
const isString = (v) => typeof v === 'string'

/**
 * @param {any} v
 * @returns {boolean}
 */
const isNumber = (v) => typeof v === 'number'

/**
 * @param {any} v
 * @returns {boolean}
 */
const isInteger = (v) => Number.isSafeInteger(v)

/**
 * @param {any} v
 * @returns {boolean}
 */
const isArray = (v) => Array.isArray(v)

/**
 * @param {any} v
 * @returns {boolean}
 */
const isObject = (v) => !isNil(v) && typeof v === 'object'

/**
 * @param {any} v
 * @returns {boolean}
 */
const isFunction = (v) => typeof v === 'function'

/**
 * @param {any} v
 * @returns {number}
 */
const toNumber = v => isNaN(v) ? 0 : Number(v)

/** constuctor name to type map */
const typeMap = {
  Number: TYPE_STRING,
  String: TYPE_STRING,
  Object: TYPE_HASH,
  Array: TYPE_LIST
}

/**
 * @param {any} value
 * @returns {string}
 */
const getType = (value) => {
  const type = value?.constructor.name
  return typeMap[type] || TYPE_NONE
}

/**
 * @param {[string, string[]]} param0
 * @param {boolean} [lowerRest=false]
 * @returns {string}
 */
const capitalize = ([first, ...rest], lowerRest = false) =>
  first.toUpperCase() +
  (lowerRest ? rest.join('').toLowerCase() : rest.join(''))

/**
 * @param {string|undefined} a
 * @param {string|undefined} b
 * @returns {boolean}
 */
function timingSafeEqual (a, b) {
  const key = crypto.randomBytes(32)
  const toHmac = (str = '') => crypto.createHmac('sha1', key).update(str).digest()
  return crypto.timingSafeEqual(toHmac(a), toHmac(b))
}

/**
 * @typedef {object} CreatePromise
 * @property {Promise<any>} promise
 * @property {function} resolve
 * @property {function} reject
 */
/**
 * @returns {CreatePromise}
 */
const createPromise = () => {
  const p = {}
  p.promise = new Promise((resolve, reject) => {
    // @ts-ignore
    p.resolve = resolve
    // @ts-ignore
    p.reject = reject
  })
  // @ts-ignore
  return p
}

/**
 * @param {number} size
 * @returns {string}
 */
const toHumanMemSize = (size) => {
  const units = ['', 'K', 'M', 'G']
  const divider = 1024
  let tmp = size
  let cnt = 0
  while (tmp > divider) {
    cnt++
    tmp /= divider
  }
  return tmp.toFixed(3) + (units[cnt] || '')
}

const escapeRegExp = (/** @type {string} */ string) => string
  .replace(/[|\\{}()^$+.]/g, '\\$&')
  .replace(/\\(\\[*?[\]])/g, '$1') // remove double-escaping
const MATCH_OPTS = {
  dot: true,
  nobrace: false,
  // nobracket: true,
  noextglob: true,
  noglobstar: true,
  nonegate: true,
  noquantifiers: true,
  posix: false
}
/**
 * @param {string} pattern
 * @returns {function} (string) => boolean
 */
const isMatch = (pattern) => {
  const escapedPattern = escapeRegExp(pattern)
  // console.log(picomatch.parse(escapedPattern, MATCH_OPTS))
  return picomatch(escapedPattern, MATCH_OPTS)
}

/**
 * @param {number|undefined} ms
 * @returns {Promise<void>}
 */
const sleep = promisify(setTimeout)

/**
 * @returns {Promise<void>}
 */
const nextTick = promisify(process.nextTick)

/**
 * milliseconds to seconds conversions; ignores negative values
 * @param {number} ms
 * @returns {number}
 */
const msToSecs = (ms) => ms > 0 ? Math.floor(ms / 1000) : ms

module.exports = {
  capitalize,
  createPromise,
  isArray,
  isFunction,
  isInteger,
  isNil,
  isNumber,
  isObject,
  isString,
  getType,
  sleep,
  timingSafeEqual,
  toHumanMemSize,
  toNumber,
  isMatch,
  nextTick,
  msToSecs
  // uuid4
}
