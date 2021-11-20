// @ts-nocheck

const assert = require('assert')
const sinon = require('sinon')
const { Cache } = require('../src/Cache.js')
const { TYPE_STRING, TYPE_HASH } = require('../src/constants.js')
const { sleep } = require('../src/utils.js')
const { strictEqual, deepStrictEqual } = assert

describe('Cache', function () {
  /**
   * @type {Cache}
   */
  let cache
  before(function () {
    cache = new Cache({})
  })
  describe('persist', function () {
    it('set', function () {
      cache.set('one', '1', TYPE_STRING)
      cache.set('two', '2', TYPE_STRING)
    })
    it('get', function () {
      strictEqual(
        cache.get('one', TYPE_STRING),
        '1'
      )
    })
    it('get throws with no type', function () {
      assert.throws(() => {
        cache.get('two')
      }, /WRONGTYPE Operation against a key holding the wrong kind of value/)
    })
    it('get not existing key', function () {
      strictEqual(
        cache.get('notthere', TYPE_STRING),
        null
      )
    })
    it('getType', function () {
      strictEqual(
        cache.getType('two'),
        TYPE_STRING
      )
    })
    it('getType not existing key', function () {
      strictEqual(
        cache.getType('notthere'),
        null
      )
    })
    it('has', function () {
      strictEqual(
        cache.has('one'),
        true
      )
      strictEqual(
        cache.has('notthere'),
        false
      )
    })
    it('delete', function () {
      cache.delete('two')
      strictEqual(
        cache.get('two', TYPE_STRING),
        null
      )
    })
    it('clear', function () {
      strictEqual(cache.size(), 1)
      cache.clear()
      strictEqual(cache.size(), 0)
    })
  })
  describe('expire', function () {
    before(function () {
      cache.set('obj', { a: 1 }, TYPE_HASH)
      cache.set('bbb', { b: 2 }, TYPE_HASH)
    })
    let clock
    before(function () {
      clock = sinon.useFakeTimers({ now: 10000 })
    })
    after(function () {
      clock.restore()
    })
    it('hasExpiry', function () {
      strictEqual(cache.hasExpiry('obj'), false)
    })
    it('setExpiry, getExpiry', function () {
      cache.setExpiry('obj', 20000)
      strictEqual(cache.getExpiry('obj'), 20000)
    })
    it('setExpiry not existing key', function () {
      cache.setExpiry('notthere', 20000)
      strictEqual(cache.getExpiry('notthere'), undefined)
    })
    it('has', function () {
      strictEqual(cache.has('obj'), true)
      clock.tick(10000)
      strictEqual(cache.has('obj'), false)
      strictEqual(cache.get('obj', TYPE_HASH), null)
    })
    it('deleteExpiry', function () {
      cache.setExpiry('bbb', 30000)
      strictEqual(cache.deleteExpiry('bbb'), true)
    })
  })
  describe('housekeeping', function () {
    let cache
    before(function () {
      cache = new Cache({ nextHouseKeepingSec: 0.3 })
      const now = Date.now()

      for (let i = 0; i < 1000; i += 50) {
        const key = 'k' + i
        cache.set(key, 'v' + i, TYPE_STRING)
        cache.setExpiry(key, now + i)
      }
    })
    it('shall start housekeeping', async function () {
      await sleep(300)
      deepStrictEqual([...cache.expires.keys()], [
        'k350', 'k400', 'k450',
        'k500', 'k550', 'k600',
        'k650', 'k700', 'k750',
        'k800', 'k850', 'k900',
        'k950'
      ])
    })
    it('shall start housekeeping 2', async function () {
      await sleep(300)
      deepStrictEqual([...cache.expires.keys()], [
        'k650', 'k700', 'k750',
        'k800', 'k850', 'k900',
        'k950'
      ])
    })
    it('shall start housekeeping 3', async function () {
      await sleep(300)
      deepStrictEqual([...cache.expires.keys()], [
        'k950'
      ])
    })
  })
})
