const assert = require('assert')
const path = require('path')
const fsp = require('fs/promises')
const { Persistence } = require('../src/Persistence.js')
const { Cache } = require('../src/Cache.js')
const { nextTick } = require('../src/utils.js')
const log = require('debug')('test:persistence')

describe('Persistence', function () {
  describe('100k keys', function () {
    // this.timeout(15000)

    let cache
    const count = 1e5
    const filename = path.resolve(__dirname, 'fixtures/large.aof')

    before(function () {
      cache = new Cache({})
    })

    before(async function () {
      await fsp.unlink(filename).catch(() => {})
    })
    before(function () {
      log('mem before: %j', process.memoryUsage())
    })
    afterEach(function () {
      log('mem after:  %j', process.memoryUsage())
    })

    it('shall write keys', async function () {
      const store = new Persistence({ filename })
      for (let i = 0; i <= count; i++) {
        const key = 'test:persist:' + i
        const value = 'string' + i
        store.write('set', key, value)
        if (i % 100 === 0) {
          await nextTick() // pass to event loop
        }
      }
    })

    it('shall read keys into cache', async function () {
      const store = new Persistence({ filename, cache })
      await store.load()
      assert.strictEqual(
        cache.get('test:persist:' + count, 'string'),
        'string' + count
      )
    })
  })

  describe('corrupt file', function () {
    let cache
    const filename = path.resolve(__dirname, 'fixtures/corrupt.aof')

    before(function () {
      cache = new Cache({})
    })

    it('shall read keys into cache', async function () {
      const store = new Persistence({ filename, cache })
      await store.load()
      assert.deepStrictEqual(
        Object.fromEntries(cache.map),
        {
          'test:persist:0': { type: 'string', value: 'string0' },
          'test:persist:2': { type: 'string', value: 'string2' },
          'test:persist:3': { type: 'string', value: 'string3' }
        })
    })
  })
})
