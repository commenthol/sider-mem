const assert = require('assert')
const { promisify } = require('util')
const redis = require('redis')

const createClient = options => {
  const client = redis.createClient(options)

  // promisify client methods
  const proxy = new Proxy(client, {
    get: (obj, prop) => {
      if (prop === 'cb') {
        return client
      } else if (typeof obj[prop] === 'function') {
        return promisify(client[prop].bind(client))
      }
      return obj[prop]
    }
  })

  return proxy
}

const assertError = async (fn, message) => {
  try {
    await fn()
    throw new Error('nanana')
  } catch (err) {
    if (message instanceof RegExp) {
      assert.ok(message.test(err.message))
    } else {
      assert.strictEqual(err.message, message)
    }
  }
}

const assertRange = (result, [max, min]) => {
  assert.ok(result >= min, `${result} <= ${min}`)
  assert.ok(result <= max, `${result} >= ${max}`)
}

const stringToObject = (str, sep = /\r\n/, kvSep = /:/) =>
  String(str).trim().split(sep)
    .map(l => l.split(kvSep))
    .reduce((o, [k, v]) => { o[k] = v; return o }, {})

const arrayToObject = (arr) => {
  const o = {}
  for (let i = 0; i < arr.length; i += 2) {
    const k = arr[i]
    const v = arr[i + 1]
    o[k] = v
  }
  return o
}

const timer = () => {
  const start = Date.now()
  return () => {
    const now = Date.now()
    // eslint-disable-next-line no-console
    console.log(now - start, now)
  }
}

module.exports = {
  createClient,
  assertError,
  assertRange,
  stringToObject,
  arrayToObject,
  timer
}
