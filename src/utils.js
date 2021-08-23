const process = require('process')
const crypto = require('crypto')
const picomatch = require('picomatch')
const log = require('debug-level').log

const isNil = v => v === null || v === undefined

const isString = v => typeof v === 'string'

const isNumber = v => typeof v === 'number'

const isInteger = v => isNumber(v) ? v === Math.floor(v) : false

const isArray = v => Array.isArray(v)

const isObject = v => !isNil(v) && typeof v === 'object'

const isFunction = v => typeof v === 'function'

const toNumber = v => isNaN(v) ? undefined : Number(v)

const capitalize = ([first, ...rest], lowerRest = false) =>
  first.toUpperCase() +
  (lowerRest ? rest.join('').toLowerCase() : rest.join(''))

function timingSafeEqual (a, b) {
  const key = crypto.randomBytes(32)
  const toHmac = (str) => crypto.createHmac('sha1', key).update(str).digest()
  return crypto.timingSafeEqual(toHmac(a), toHmac(b))
}

// const uuid4 = () =>
//   ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
//     (c ^ (crypto.randomBytes(1)[0] & (15 >> (c / 4)))).toString(16)
//   )

const sleep = (ms) => new Promise(resolve => setTimeout(() => resolve(), ms))

const createPromise = () => {
  const p = {}
  p.promise = new Promise((resolve, reject) => {
    p.resolve = resolve
    p.reject = reject
  })
  return p
}

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

const escapeRegExp = string => string
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
const isMatch = (pattern) => {
  const escapedPattern = escapeRegExp(pattern)
  // console.log(picomatch.parse(escapedPattern, MATCH_OPTS))
  return picomatch(escapedPattern, MATCH_OPTS)
}

const logger = (namespace) => log('sider-mem-cache' + (namespace ? ':' + namespace : ''))

const nextTick = () => new Promise(resolve => process.nextTick(resolve))

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
  sleep,
  timingSafeEqual,
  toHumanMemSize,
  toNumber,
  isMatch,
  logger,
  nextTick
  // uuid4
}
