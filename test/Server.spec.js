// @ts-nocheck

const assert = require('assert')
const log = require('debug')('test:server')
const fsp = require('fs/promises')
const path = require('path')
const process = require('process')
const sinon = require('sinon')
const { promisify } = require('util')
const { Server } = require('../src/index.js')
// const { HamtMap, MegaMap } = require('..')
const { sleep } = require('../src/utils.js')
const {
  createClient,
  assertError,
  assertRange,
  stringToObject,
  arrayToObject,
  // eslint-disable-next-line no-unused-vars
  timer
} = require('./support.js')
const { strictEqual, deepStrictEqual } = require('assert')

const ERR_NOT_INTEGER = 'ERR value is not an integer or out of range'
const KEY_NOT_EXISTS = -2
// const KEY_NO_EXPIRY = -1

const PORT = 6380

const clientPort = process.env.PORT || PORT
// eslint-disable-next-line eqeqeq
const isRedis = clientPort == 6379

const sleepx = (clock) => (ms) => isRedis
  ? sleep(ms)
  : Promise.resolve().then(clock.tick(ms))

describe('Server', function () {
  /** @type {Server} */
  let server

  before(function () {
    const opts = { }
    // const opts = { HashMap: HamtMap, log: () => console }
    server = new Server(opts)
    return server.listen({ port: PORT })
  })
  after(function () {
    return server.close()
  })

  let client
  let majorVersion = 6
  before(async function () {
    const host = '127.0.0.1'
    client = createClient({ host, port: clientPort })
    await client.info()
    majorVersion = client.server_info.versions[0]
  })
  after(function () {
    client.quit()
  })

  describe('various', function () {
    it('info server', async function () {
      const res = await client.info('server')
      log(res)
      const obj = stringToObject(res)
      // log(obj)
      assert.ok('# Server' in obj)
      assert.ok('redis_version' in obj)
    })

    it('hello', async function () {
      const res = await client.hello()
      // console.log(res)
      const obj = arrayToObject(res)
      // console.log(obj)
      assert.ok(/^redis|sider-mem$/.test(obj.server))
      strictEqual(obj.role, 'master')
      deepStrictEqual(Object.keys(obj).sort(), [
        'id',
        'mode',
        'modules',
        'proto',
        'role',
        'server',
        'version'
      ])
    })

    it('ping', async function () {
      assert.strictEqual(
        await client.ping(),
        'PONG'
      )
    })

    it('ping with message', async function () {
      assert.strictEqual(
        await client.ping('hello world'),
        'hello world'
      )
    })

    it('echo', async function () {
      assert.strictEqual(
        await client.echo('hello world'),
        'hello world'
      )
    })

    it('shall fail on unknown command', async function () {
      await assertError(async () => {
        await client.sendCommand('foo')
      }, 'ERR unknown command `foo`, with args beginning with: ')
    })

    it('shall fail on unknown command with args', async function () {
      await assertError(async () => {
        await client.sendCommand('foo', [1, 'one'])
      }, /^ERR unknown command `foo`, with args beginning with: `1`, `one`/)
    })

    it('time', async function () {
      const result = await client.time()
      log(result)
      strictEqual(result.length, 2)
    })

    it('command', async function () {
      const res = await client.command()
      const obj = Object.fromEntries(res)
      strictEqual(obj.get, 2)
    })
    it('command ping', async function () {
      const res = await client.command('info', 'foo', 'ping')
      const obj = Object.fromEntries(res.map(a => a || ['null', a]))
      deepStrictEqual(obj, { null: null, ping: -1 })
    })
    it('command foo', async function () {
      await assertError(async () => {
        await client.command('foo')
      }, "ERR Unknown subcommand or wrong number of arguments for 'foo'. Try COMMAND HELP.")
    })

    it.skip('TODO command', async function () {
      const list = await client.command()
      const obj = list.sort((a, b) => a[0].localeCompare(b[0])).reduce((o, [cmd, arity, flags, first, last, step, area]) => {
        o[cmd] = [arity, flags, first, last, step, area]
        return o
      }, {})
      Object.entries(obj).forEach(([k, v]) => {
        // eslint-disable-next-line no-console
        console.log(`"${k}": ${JSON.stringify(v)},`)
      })
      // console.dir(obj, { depth: null })
    })
  })

  describe('client', function () {
    it('client setname', async function () {
      strictEqual(
        await client.client('setname', 'my-client'),
        'OK'
      )
    })
    it('client getname', async function () {
      strictEqual(
        await client.client('getname'),
        'my-client'
      )
    })
    it('client list', async function () {
      const res = await client.client('list')
      const obj = stringToObject(res, / /, /=/)
      log('%j', obj)
      strictEqual(obj.name, 'my-client')
      strictEqual(obj.user, 'default')
      strictEqual(obj.db, '0')
    })
    it('shall fail on unknown command', async function () {
      await assertError(async () => {
        await client.client('foo')
      }, "ERR Unknown subcommand or wrong number of arguments for 'foo'. Try CLIENT HELP.")
    })
    it('select db', async function () {
      strictEqual(
        await client.select(0),
        'OK'
      )
    })
  })

  describe('multi-exec', function () {
    it('all ok', async function () {
      const key = 'test:multi:1'
      const multi = client.cb.multi()
        .get('test:not-there')
        .set(key, 3)
        .incr(key)
        .decrby(key, 10)
        .del(key)
      assert.deepStrictEqual(
        await promisify(multi.exec.bind(multi))(),
        [null, 'OK', 4, -6, 1])
    })

    it('with error', async function () {
      await assertError(async () => {
        const key = 'test:multi:err'
        const multi = client.cb.multi()
          .get('test:not-there')
          .set(key, 3)
          .incr(key)
          .decrby(key)
          .del(key)
        await promisify(multi.exec.bind(multi))()
      }, 'EXECABORT Transaction discarded because of previous errors.')
    })
  })

  describe('flush-scan', function () {
    it('flushall', async function () {
      const key = 'test:flushall:'
      let cnt = 0
      await client.mset(Object.entries({
        [key + cnt]: cnt++,
        [key + cnt]: cnt++,
        [key + cnt]: cnt++,
        [key + cnt]: cnt++,
        [key + cnt]: cnt++
      }).flat())
      await client.flushall()
      const r = await client.scan(0)
      deepStrictEqual(r, ['0', []])
    })

    it('scan 0', async function () {
      const key = 'test:scan:'
      let cnt = 0
      await client.flushdb()
      await client.mset(Object.entries({
        [key + cnt]: cnt++,
        [key + cnt]: cnt++,
        [key + cnt]: cnt++,
        [key + cnt]: cnt++,
        [key + cnt]: cnt++
      }).flat())
      const [cursor, results] = await client.scan(0)
      strictEqual(cursor, '0')
      deepStrictEqual(results.sort(), [
        'test:scan:0',
        'test:scan:1',
        'test:scan:2',
        'test:scan:3',
        'test:scan:4'
      ])
    })

    it('scan 0 match foo*', async function () {
      let cnt = 0
      await client.flushall()
      await client.mset(Object.entries({
        foo: cnt++,
        '.foo': cnt++,
        'foo*bar': cnt++,
        afob: cnt++,
        afoo: cnt++,
        afoob: cnt++,
        afOob: cnt++
      }).flat())
      const [cursor, results] = await client.scan(0, 'match', 'foo*')
      strictEqual(typeof cursor, 'string')
      deepStrictEqual(results.sort(), [
        'foo',
        'foo*bar'
      ])
    })

    it('scan 0 count 3', async function () {
      let cnt = 0
      await client.flushall()
      await client.mset(Object.entries({
        foo: cnt++,
        '.foo': cnt++,
        'foo*bar': cnt++,
        afob: cnt++,
        afoo: cnt++,
        afoob: cnt++,
        afOob: cnt++
      }).flat())
      const [cursor, results] = await client.scan(0, 'count', 3)
      strictEqual(typeof cursor, 'string')
      assert.ok(cursor !== '0')
      strictEqual(results.length, 3)
    })

    it('scan o type string', async function () {
      await client.flushall()
      let cnt = 0
      strictEqual(
        await client.mset('aa', cnt++, 'ab', cnt++, 'ac', cnt++, 'ba', cnt++, 'bb', cnt++),
        'OK'
      )
      strictEqual(
        await client.hset('ha', 'aa', cnt++, 'ab', cnt++, 'ac', cnt++, 'ba', cnt++, 'bb', cnt++),
        5
      )
      strictEqual(
        await client.hset('hb', 'aa', cnt++, 'ab', cnt++, 'ac', cnt++, 'ba', cnt++, 'bb', cnt++),
        5
      )
      const [cursor, results] = await client.scan('0', 'type', 'string')
      strictEqual(cursor, '0')
      deepStrictEqual(results.sort(), ['aa', 'ab', 'ac', 'ba', 'bb'])
    })

    it('scan cursor must be an integer', async function () {
      await assertError(async () => {
        await client.scan('foo')
      }, 'ERR invalid cursor')
    })
  })

  describe('set-get', function () {
    it('set', async function () {
      const key = 'test:hello'
      assert.strictEqual(
        await client.set(key, 'world'),
        'OK')
    })

    it('type', async function () {
      const key = 'test:hello'
      assert.strictEqual(
        await client.type(key),
        'string')
    })

    it('get', async function () {
      const key = 'test:hello'
      assert.strictEqual(
        await client.get(key),
        'world')
    })

    it('strlen', async function () {
      const key = 'test:strlen:hello'
      await client.set(key, 'hello world')
      assert.strictEqual(
        await client.strlen(key),
        11)
    })
    it('strlen on unknown key', async function () {
      const key = 'test:strlen:not-there'
      await client.del(key)
      assert.strictEqual(
        await client.strlen(key),
        0)
    })

    it('set key value NX', async function () {
      const key = 'test:set_nx:0'
      const value = 'Hello'
      await client.del(key)
      assert.strictEqual(
        await client.set(key, value, 'NX'),
        'OK')
      // do not set the 2nd time
      assert.strictEqual(
        await client.set(key, value, 'NX'),
        null)
    })

    it('set key value XX', async function () {
      const key = 'test:set_xx:0'
      const value = 'Hello'
      await client.del(key)
      assert.strictEqual(
        await client.set(key, value + 0, 'XX'),
        null)
      assert.strictEqual(
        await client.set(key, value + 1),
        'OK')
      // do not set the 2nd time
      assert.strictEqual(
        await client.set(key, value + 2, 'XX'),
        'OK')
      assert.strictEqual(
        await client.get(key),
        value + 2)
    })

    it('setex key 10 value', async function () {
      const key = 'test:setex:1'
      const value = 'foobar'
      await client.del(key)

      assert.strictEqual(
        await client.setex(key, 10, value),
        'OK'
      )
      assertRange(
        await client.ttl(key),
        [10, 9]
      )
      assert.strictEqual(
        await client.get(key),
        value
      )
    })

    it('psetex key 200 value', async function () {
      const key = 'test:psetex:1'
      const value = 'foobar'
      await client.del(key)

      assert.strictEqual(
        await client.psetex(key, 200, value),
        'OK'
      )
      assertRange(
        await client.pttl(key),
        [200, 150]
      )
      assert.strictEqual(
        await client.get(key),
        value
      )
    })

    it('throws on unknown type', async function () {
      const key = 'test:set_NN:0'
      await assertError(async () => {
        await client.set(key, 'Hello', 'NN')
      }, 'ERR syntax error')
    })

    it('get undefined', async function () {
      const key = 'test:undefined'
      assert.strictEqual(
        await client.get(key),
        null)
    })

    it('getdel undefined', async function () {
      const key = 'test:getdel.0'
      await client.del(key)
      assert.strictEqual(
        await client.getdel(key),
        null)
    })

    it('getdel', async function () {
      const key = 'test:getdel.1'
      const value = 'foobar'
      await client.del(key)
      await client.set(key, value)
      assert.strictEqual(
        await client.getdel(key),
        value)
      assert.strictEqual(
        await client.get(key),
        null)
    })

    it('append undefined', async function () {
      const key = 'test:append.0'
      await client.del(key)
      assert.strictEqual(
        await client.append(key, 'bar'),
        3)
      assert.strictEqual(
        await client.get(key),
        'bar')
    })

    it('append', async function () {
      const key = 'test:append.1'
      await client.del(key)

      await client.set(key, 'foo')
      assert.strictEqual(
        await client.append(key, 'bar'),
        6)
      assert.strictEqual(
        await client.get(key),
        'foobar')
    })

    it('append on object fails', async function () {
      const key = 'test:append:2'
      await client.del(key)
      assert.strictEqual(await client.hset(key, 'foo', 'bar'), 1)
      await assertError(async () => {
        await client.append(key, 'bar')
      }, 'WRONGTYPE Operation against a key holding the wrong kind of value')
    })

    it('setrange', async function () {
      const key = 'test:setrange:0'
      await client.del(key)
      await client.set(key, 'hello')
      assert.strictEqual(
        await client.setrange(key, 8, 'world'),
        13
      )
      assert.strictEqual(
        await client.get(key),
        'hello\x00\x00\x00world'
      )
    })

    it('setrange on non existing key', async function () {
      const key = 'test:setrange:1'
      await client.del(key)
      assert.strictEqual(
        await client.setrange(key, 8, 'world'),
        13
      )
      assert.strictEqual(
        await client.get(key),
        '\x00\x00\x00\x00\x00\x00\x00\x00world'
      )
    })

    it('setrange on object fails', async function () {
      const key = 'test:setrange:2'
      await client.del(key)
      assert.strictEqual(await client.hset(key, 'foo', 'bar'), 1)
      await assertError(async () => {
        await client.setrange(key, 8, 'bar')
      }, 'WRONGTYPE Operation against a key holding the wrong kind of value')
    })

    it('getrange undefined', async function () {
      const key = 'test:getrange.0'
      await client.del(key)
      assert.strictEqual(
        await client.getrange(key, 2, 10),
        '')
    })

    it('getrange', async function () {
      const key = 'test:getrange.1'
      await client.del(key)
      await client.set(key, 'abcdefghijklmnop')

      assert.strictEqual(
        await client.getrange(key, 0, 4),
        'abcde')
      assert.strictEqual(
        await client.getrange(key, 0, 0),
        'a')
      assert.strictEqual(
        await client.getrange(key, '3', '-3'),
        'defghijklmn')
      assert.strictEqual(
        await client.getrange(key, -7, -3),
        'jklmn')
    })

    it('getrange 1 foo', async function () {
      const key = 'test:getrange.1'
      await assertError(async () => {
        await client.getrange(key, 1, 'foo')
      }, ERR_NOT_INTEGER)
    })

    it('getrange foo -3', async function () {
      const key = 'test:getrange.1'
      await assertError(async () => {
        await client.getrange(key, 'foo', -3)
      }, ERR_NOT_INTEGER)
    })

    it('getset undefined', async function () {
      const key = 'test:getset.0'
      await client.del(key)

      assert.strictEqual(
        await client.getset(key, 'Hello'),
        null)
      assert.strictEqual(
        await client.get(key),
        'Hello')
    })

    it('getset', async function () {
      const key = 'test:getset.1'
      await client.del(key)
      await client.set(key, 'Hello')

      assert.strictEqual(
        await client.getset(key, 'World'),
        'Hello')
      assert.strictEqual(
        await client.get(key),
        'World')
    })

    it('getset wrong arguments', async function () {
      const key = 'test:getrange.2'
      await assertError(async () => {
        await client.getset(key)
      }, "ERR wrong number of arguments for 'getset' command")
    })

    it('mset', async function () {
      const args = [1, 2, 3, 4, 5, 6].reduce((a, n) => {
        a.push('test:mset:' + n)
        a.push('hello ' + n)
        return a
      }, [])
      assert.strictEqual(
        await client.mset(...args),
        'OK')
    })

    it('mget', async function () {
      const args = [0, 1, 2, 3, 4, 5, 6].reduce((a, n) => {
        a.push('test:mset:' + n)
        return a
      }, [])
      assert.deepStrictEqual(
        await client.mget(...args),
        [
          null,
          'hello 1',
          'hello 2',
          'hello 3',
          'hello 4',
          'hello 5',
          'hello 6'
        ]
      )
    })

    it('mset wrong parameters', async function () {
      await assertError(async () => {
        await client.mset('test:mset:err1', 'foobar', 'test:mset:err2')
      }, /^ERR wrong number of arguments for (MSET|'mset' command)/)
    })

    it('msetnx', async function () {
      const key = 'test:msetnx:'
      await client.del(key + '1')
      await client.del(key + '2')

      assert.strictEqual(
        await client.msetnx(key + '1', 'hello', key + '2', 'world'),
        1)
      assert.strictEqual(
        await client.msetnx(key + '2', 'foo', key + '3', 'bar'),
        0)
      assert.deepStrictEqual(
        await client.mget(key + '1', key + '2', key + '3'),
        ['hello', 'world', null])
    })
  })

  describe('rename', function () {
    const value = 'watnana'
    before(async function () {
      await client.flushall()
    })

    it('rename', async function () {
      await client.set('test:rename:1', value)
      strictEqual(
        await client.rename('test:rename:1', 'test:renamed:1'),
        'OK'
      )
      strictEqual(
        await client.get('test:rename:1'),
        null
      )
      strictEqual(
        await client.get('test:renamed:1'),
        value
      )
    })

    it('rename on undefined key', async function () {
      await assertError(async () => {
        await client.rename('test:rename:notthere', 'test:renamed:1')
      }, 'ERR no such key')
      strictEqual(
        await client.get('test:renamed:1'),
        value
      )
    })

    it('renamenx', async function () {
      await client.set('test:renamenx:2', value + '2')
      strictEqual(
        await client.renamenx('test:renamenx:2', 'test:renamednx:2'),
        1
      )
      strictEqual(
        await client.get('test:renamenx:2'),
        null
      )
      strictEqual(
        await client.get('test:renamednx:2'),
        value + '2'
      )
    })

    it('renamenx on undefined key', async function () {
      await assertError(async () => {
        await client.renamenx('test:renamenx:notthere', 'test:renamednx:2')
      }, 'ERR no such key')
      strictEqual(
        await client.get('test:renamednx:2'),
        value + '2'
      )
    })

    it('renamenx on defined newkey', async function () {
      await client.set('test:renamenx:3', value + '3')
      strictEqual(
        await client.renamenx('test:renamenx:3', 'test:renamednx:2'),
        0
      )
      strictEqual(
        await client.get('test:renamednx:2'),
        value + '2'
      )
      strictEqual(
        await client.get('test:renamenx:3'),
        value + '3'
      )
    })
  })

  describe('expire', function () {
    let clock
    beforeEach(function () {
      clock = sinon.useFakeTimers({ shouldAdvanceTime: true, now: Date.now() })
    })
    afterEach(function () {
      clock.restore()
    })

    it('expire', async function () {
      this.timeout(3000)
      const sleep = sleepx(clock)

      const key = 'test:expire:0'
      const value = 'foobar'
      const multi = client.cb.multi()
        .del(key)
        .set(key, value)
        .expire(key, 1)
      assert.deepStrictEqual(
        await promisify(multi.exec.bind(multi))(),
        [0, 'OK', 1])
      assertRange(
        await client.ttl(key),
        [1, 0])

      await sleep(1200)
      assert.strictEqual(
        await client.get(key),
        null)
      assert.strictEqual(
        await client.ttl(key),
        -2)
    })

    it('expireat', async function () {
      const key = 'test:expireat:0'
      const value = 'foobar'
      await client.del(key)
      await client.set(key, value)
      assert.strictEqual(
        await client.expireat(key, Math.floor(Date.now() / 1000) + 300),
        1
      )
      assertRange(
        await client.ttl(key),
        [300, 299]
      )
    })

    it('expiretime', async function () {
      if (majorVersion < 7) return

      const key = 'test:expiretime:0'
      const value = 'foobar'
      await client.del(key)
      await client.set(key, value)
      const expiresAt = Math.floor(Date.now() / 1000) + 300

      assert.strictEqual(
        await client.expireat(key, expiresAt),
        1
      )
      assertRange(
        await client.sendCommand('expiretime', [key]),
        [expiresAt, expiresAt]
      )
    })

    it('pexpire', async function () {
      const sleep = sleepx(clock)

      const key = 'test:pexpire:1'
      const value = 'foobar'
      const multi = client.cb.multi()
        .del(key)
        .set(key, value)
        .pexpire(key, 200)
      assert.deepStrictEqual(
        await promisify(multi.exec.bind(multi))(),
        [0, 'OK', 1])
      const ttl1 = await client.pttl(key)
      assertRange(ttl1, [200, 150])

      await sleep(100 - 200 + ttl1)
      assert.strictEqual(
        await client.get(key),
        value)
      assertRange(
        await client.pttl(key),
        [100, 80])

      await sleep(105)
      assert.strictEqual(
        await client.get(key),
        null)
      assert.strictEqual(
        await client.ttl(key),
        -2)
    })

    it('pexpire on unknown key', async function () {
      const key = 'test:pexpire:2'
      const multi = client.cb.multi()
        .del(key)
        .pexpire(key, 200)
      assert.deepStrictEqual(
        await promisify(multi.exec.bind(multi))(),
        [0, 0])
      assert.strictEqual(
        await client.pttl(key),
        KEY_NOT_EXISTS)
      assert.strictEqual(
        await client.pttl(key),
        KEY_NOT_EXISTS)
    })

    it('persist', async function () {
      const sleep = sleepx(clock)

      const key = 'test:persist:1'
      const value = 'foobar'
      const multi = client.cb.multi()
        .del(key)
        .set(key, value)
        .pexpire(key, 200)
      assert.deepStrictEqual(
        await promisify(multi.exec.bind(multi))(),
        [0, 'OK', 1])
      const ttl1 = await client.pttl(key)
      assertRange(ttl1, [200, 150])

      await sleep(100 - 200 + ttl1)
      assert.strictEqual(
        await client.get(key),
        value)
      assertRange(
        await client.pttl(key),
        [100, 80])

      assert.strictEqual(
        await client.persist(key),
        1)
      assert.strictEqual(
        await client.ttl(key),
        -1)
    })

    it('persist on expired key', async function () {
      const key = 'test:persist:2'
      const multi = client.cb.multi()
        .del(key)
        .set(key, 'foobar')
        .pexpire(key, 100)
      assert.deepStrictEqual(
        await promisify(multi.exec.bind(multi))(),
        [0, 'OK', 1])

      await sleep(105)

      assert.strictEqual(
        await client.persist(key),
        0)
      assert.strictEqual(
        await client.pttl(key),
        KEY_NOT_EXISTS)
    })

    it('pexpireat', async function () {
      const key = 'test:pexpireat:1'
      const value = 'foobar'

      await client.del(key)
      await client.set(key, value)

      assert.strictEqual(
        await client.pexpireat(key, Date.now() + 200),
        1)

      await sleep(100)
      assert.strictEqual(
        await client.get(key),
        value)

      assertRange(
        await client.pttl(key),
        [130, 70]) // sleep is inaccurate allow ±30ms

      await sleep(105)
      assert.strictEqual(
        await client.get(key),
        null)
      assert.strictEqual(
        await client.ttl(key),
        KEY_NOT_EXISTS)
    })

    it('pexpire nx', async function () {
      if (majorVersion < 7) return
      const sleep = sleepx(clock)

      const key = 'test:pexpire_nx:1'
      const value = 'foobar'
      const multi = client.cb.multi()
        .del(key)
        .set(key, value)
        .pexpire(key, 200, 'NX')
      assert.deepStrictEqual(
        await promisify(multi.exec.bind(multi))(),
        [0, 'OK', 1])

      assert.strictEqual(
        await client.get(key),
        value)
      const pttl1 = await client.pttl(key)

      assert.strictEqual(
        await client.pexpire(key, 200, 'NX'),
        0)
      const pttl2 = await client.pttl(key)

      assertRange(pttl2, [pttl1, pttl1 - 10])

      await sleep(200)
      assert.strictEqual(
        await client.get(key),
        null)
    })

    it('pexpire xx', async function () {
      if (majorVersion < 7) return
      const sleep = sleepx(clock)

      const key = 'test:pexpire_xx:1'
      const value = 'foobar'
      const multi = client.cb.multi()
        .del(key)
        .set(key, value)
        .pexpire(key, 200, 'XX')
      assert.deepStrictEqual(
        await promisify(multi.exec.bind(multi))(),
        [0, 'OK', 0])

      await client.pexpire(key, 200)
      const pttl1 = await client.pttl(key)

      await sleep(100)

      assert.strictEqual(
        await client.pexpire(key, 200, 'XX'),
        1)
      const pttl2 = await client.pttl(key)

      assertRange(pttl2, [pttl1, pttl1 - 10])

      await sleep(200)
      assert.strictEqual(
        await client.get(key),
        null)
    })

    it('pexpire gt', async function () {
      if (majorVersion < 7) return
      const sleep = sleepx(clock)

      const key = 'test:pexpire_gt:1'
      const value = 'foobar'

      await client.del(key)
      assert.strictEqual(
        await client.set(key, value),
        'OK')

      assert.strictEqual(
        await client.pexpire(key, 100, 'GT'),
        0)

      await client.pexpire(key, 100)

      assert.strictEqual(
        await client.pexpire(key, 50, 'GT'),
        0)
      assert.strictEqual(
        await client.pexpire(key, 200, 'GT'),
        1)

      const pttl1 = await client.pttl(key)

      await sleep(100)

      assert.strictEqual(
        await client.pexpire(key, 200, 'GT'),
        1)
      const pttl2 = await client.pttl(key)

      assertRange(pttl2, [pttl1, pttl1 - 10])

      await sleep(200)
      assert.strictEqual(
        await client.get(key),
        null)
    })

    it('pexpire lt', async function () {
      if (majorVersion < 7) return
      const sleep = sleepx(clock)

      const key = 'test:pexpire_lt:1'
      const value = 'foobar'

      await client.del(key)
      assert.strictEqual(
        await client.set(key, value),
        'OK')

      assert.strictEqual(
        await client.pexpire(key, 100, 'LT'),
        0)

      await client.pexpire(key, 300)

      assert.strictEqual(
        await client.pexpire(key, 400, 'LT'),
        0)
      assert.strictEqual(
        await client.pexpire(key, 200, 'LT'),
        1)
      assertRange(
        await client.pttl(key),
        [200, 190]
      )

      await sleep(100)

      assert.strictEqual(
        await client.pexpire(key, 50, 'LT'),
        1)
      assertRange(
        await client.pttl(key),
        [50, 40]
      )

      await sleep(60)
      assert.strictEqual(
        await client.get(key),
        null)
    })

    it('set key value EX 1', async function () {
      const sleep = sleepx(clock)

      const key = 'test:setex1'
      const value = 'Hello'

      await client.del(key)
      await client.set(key, value, 'EX', 1)
      assertRange(
        await client.ttl(key),
        [1, 0])
      assert.strictEqual(
        await client.get(key),
        value)
      await sleep(1200)
      assert.strictEqual(
        await client.get(key),
        null)
    })

    it('set key value PX 200', async function () {
      const sleep = sleepx(clock)

      const key = 'test:setpx200'
      const value = 'Hello'

      await client.del(key)
      await client.set(key, value, 'PX', 200)
      assertRange(
        await client.pttl(key),
        [200, 150])
      assert.strictEqual(
        await client.get(key),
        value)
      await sleep(205)
      assert.strictEqual(
        await client.get(key),
        null)
    })
  })

  describe('incr-decr', function () {
    it('incr', async function () {
      const key = 'test:incr:0'
      await client.del(key)
      assert.strictEqual(
        await client.incr(key),
        1)
    })

    it('set 5 and incr', async function () {
      const key = 'test:incr:1'
      await client.del(key)
      await client.set(key, 5)
      assert.strictEqual(
        await client.incr(key),
        6)
    })

    it('set "foo" and incr', async function () {
      await assertError(async () => {
        const key = 'test:incr:2'
        await client.del(key)
        await client.set(key, 'foo')
        await client.incr(key)
      }, ERR_NOT_INTEGER)
    })

    it('incrby', async function () {
      await assertError(async () => {
        const key = 'test:incrby:0'
        await client.incrby(key)
      }, "ERR wrong number of arguments for 'incrby' command")
    })

    it('incrby 3', async function () {
      const key = 'test:incrby:0'
      await client.del(key)
      assert.strictEqual(
        await client.incrby(key, 3),
        3)
    })

    it('set 5 and incrby 3', async function () {
      const key = 'test:incrby:1'
      await client.del(key)
      await client.set(key, 5)
      assert.strictEqual(
        await client.incrby(key, 3),
        8)
    })

    it('set 5 and incrby "foo"', async function () {
      await assertError(async () => {
        const key = 'test:incrby:1'
        await client.set(key, 5)
        await client.incrby(key, 'foo')
      }, ERR_NOT_INTEGER)
    })

    it('set "foo" and incrby', async function () {
      await assertError(async () => {
        const key = 'test:incrby:2'
        await client.set(key, 'foo')
        await client.incrby(key, 5)
      }, ERR_NOT_INTEGER)
    })

    it('decr', async function () {
      const key = 'test:decr:0'
      await client.del(key)
      assert.strictEqual(
        await client.decr(key),
        -1)
    })

    it('set 5 and decr', async function () {
      const key = 'test:decr:1'
      await client.del(key)
      await client.set(key, 5)
      assert.strictEqual(
        await client.decr(key),
        4)
    })

    it('set "foo" and decr', async function () {
      await assertError(async () => {
        const key = 'test:decr:2'
        await client.del(key)
        await client.set(key, 'foo')
        await client.decr(key)
      }, ERR_NOT_INTEGER)
    })

    it('decrby', async function () {
      await assertError(async () => {
        const key = 'test:decrby:0'
        await client.decrby(key)
      }, "ERR wrong number of arguments for 'decrby' command")
    })

    it('decrby 3', async function () {
      const key = 'test:decrby:0'
      await client.del(key)
      assert.strictEqual(
        await client.decrby(key, 3),
        -3)
    })

    it('set 5 and decrby 3', async function () {
      const key = 'test:decrby:1'
      await client.del(key)
      await client.set(key, 5)
      assert.strictEqual(
        await client.decrby(key, 3),
        2)
    })

    it('set 5 and decrby "foo"', async function () {
      await assertError(async () => {
        const key = 'test:decrby:1'
        await client.set(key, 5)
        await client.decrby(key, 'foo')
      }, ERR_NOT_INTEGER)
    })

    it('set "foo" and decrby', async function () {
      await assertError(async () => {
        const key = 'test:decrby:2'
        await client.set(key, 'foo')
        await client.decrby(key, 5)
      }, ERR_NOT_INTEGER)
    })

    it('incrbyfloat', async function () {
      await assertError(async () => {
        const key = 'test:incrbyfloat:0'
        await client.incrbyfloat(key)
        throw new Error('failed')
      }, "ERR wrong number of arguments for 'incrbyfloat' command")
    })

    it('incrbyfloat 3.14', async function () {
      const key = 'test:incrbyfloat:0'
      await client.del(key)
      assert.strictEqual(
        await client.incrbyfloat(key, 3.14),
        '3.14')
    })

    it('set 5.2 and incrbyfloat -2.1', async function () {
      const key = 'test:incrbyfloat:2.1'
      await client.del(key)
      await client.set(key, 5.2)
      assert.strictEqual(
        await client.incrbyfloat(key, -2.1),
        '3.1')
    })
  })

  describe('hash', function () {
    const key = 'test:hset:0'
    let v
    before(async function () {
      await client.del(key)
      v = await client.hset(key, 'foo', 'bar', 'number', 1)
    })
    it('hset', async function () {
      assert.strictEqual(v, 2)
    })
    it('hmset', async function () {
      const v = await client.hmset(key + '1', 'foo', 'bar', 'number', 1)
      strictEqual(v, 'OK')
      deepStrictEqual(
        await client.hgetall(key + '1'),
        { foo: 'bar', number: '1' }
      )
    })
    it('type', async function () {
      assert.strictEqual(
        await client.type(key),
        'hash')
    })
    it('hgetall', async function () {
      assert.deepStrictEqual(
        await client.hgetall(key),
        { foo: 'bar', number: '1' }
      )
    })
    it('hget', async function () {
      assert.deepStrictEqual(
        await client.hget(key, 'foo'),
        'bar'
      )
    })
    it('hget undefined field', async function () {
      assert.deepStrictEqual(
        await client.hget(key, 'faa'),
        null
      )
    })
    it('hset change field', async function () {
      assert.strictEqual(
        await client.hset(key, 'foo', 'baz'),
        0
      )
    })
    it('hset add field', async function () {
      assert.strictEqual(
        await client.hset(key, '~!"', 'strange'),
        1
      )
    })
    it('hkeys', async function () {
      assert.deepStrictEqual(
        await client.hkeys(key),
        ['foo', 'number', '~!"']
      )
    })
    it('hscan 0 match fo*', async function () {
      deepStrictEqual(
        await client.hscan(key, 0, 'match', 'fo*'),
        ['0', ['foo']]
      )
    })
    it('hvals', async function () {
      assert.deepStrictEqual(
        await client.hvals(key),
        ['baz', '1', 'strange']
      )
    })
    it('hmget', async function () {
      assert.deepStrictEqual(
        await client.hmget(key, 'number', 'not-there', 'foo'),
        ['1', null, 'baz']
      )
    })
    it('hlen', async function () {
      assert.deepStrictEqual(
        await client.hlen(key),
        3
      )
    })
    it('hexists', async function () {
      assert.deepStrictEqual(
        await client.hexists(key, 'foo'),
        1
      )
    })
    it('hexists undefined field', async function () {
      assert.deepStrictEqual(
        await client.hexists(key, 'faa'),
        0
      )
    })
    it('hsetnx', async function () {
      assert.strictEqual(
        await client.hsetnx(key, 'foo', 'nana'),
        0
      )
    })
    it('hdel undefined field', async function () {
      assert.deepStrictEqual(
        await client.hdel(key, 'faa'),
        0
      )
    })
    it('hdel', async function () {
      assert.deepStrictEqual(
        await client.hdel(key, 'foo'),
        1
      )
      assert.deepStrictEqual(
        await client.hkeys(key),
        ['number', '~!"']
      )
    })
    it('hincrby', async function () {
      assert.deepStrictEqual(
        await client.hincrby(key, 'number', 2),
        3
      )
    })
    it('hincrby undefined field', async function () {
      assert.deepStrictEqual(
        await client.hincrby(key, 'newNumber', 2),
        2
      )
      assert.deepStrictEqual(
        await client.hkeys(key),
        ['number', '~!"', 'newNumber']
      )
    })
    it('hincrbyfloat', async function () {
      assert.deepStrictEqual(
        await client.hincrbyfloat(key, 'number', 3.24),
        '6.24'
      )
    })
    it('strlen', async function () {
      await client.hset(key, 'strlen', 'hello world')
      assert.strictEqual(
        await client.hstrlen(key, 'strlen'),
        11)
    })
  })

  describe('hash on not existing key', function () {
    const key = 'test:hset:not-there'

    before(async function () {
      await client.del(key)
    })

    it('hget', async function () {
      assert.strictEqual(
        await client.hget(key, 'foo'),
        null
      )
    })
    it('hgetall', async function () {
      assert.strictEqual(
        await client.hgetall(key),
        null
      )
    })
    it('hmget', async function () {
      assert.deepStrictEqual(
        await client.hmget(key, 'number', 'foo'),
        [null, null]
      )
    })
    it('hkeys', async function () {
      assert.deepStrictEqual(
        await client.hkeys(key),
        []
      )
    })
    it('hvals', async function () {
      assert.deepStrictEqual(
        await client.hvals(key),
        []
      )
    })
    it('hscan 0 match fo*', async function () {
      deepStrictEqual(
        await client.hscan(key, 0, 'match', 'fo*'),
        ['0', []]
      )
    })
    it('hlen', async function () {
      assert.strictEqual(
        await client.hlen(key),
        0
      )
    })
    it('hdel', async function () {
      assert.strictEqual(
        await client.hdel(key, 'foo'),
        0
      )
    })
    it('hexists', async function () {
      assert.strictEqual(
        await client.hexists(key, 'foo'),
        0
      )
    })
    it('hsetnx', async function () {
      assert.strictEqual(
        await client.hsetnx(key, 'wat', 'nana'),
        1
      )
    })
    it('hincrby', async function () {
      await client.hdel(key, 'foo')
      assert.strictEqual(
        await client.hincrby(key, 'foo', 2),
        2
      )
    })
    it('hincrby with string', async function () {
      await client.hdel(key, 'foo')
      await assertError(async () => {
        await client.hincrby(key, 'foo', 'bar')
      }, 'ERR value is not an integer or out of range')
    })
    it('hincrby on string', async function () {
      await client.hset(key, 'foo', 'bar')
      await assertError(async () => {
        await client.hincrby(key, 'foo', 2)
      }, 'ERR hash value is not an integer')
    })
    it('hincrbyfloat', async function () {
      await client.hdel(key, 'foo')
      assert.strictEqual(
        await client.hincrbyfloat(key, 'foo', 2.2),
        '2.2'
      )
    })
    it('hincrbyfloat with string', async function () {
      await client.hdel(key, 'foo')
      await assertError(async () => {
        await client.hincrbyfloat(key, 'foo', 'bar')
      }, 'ERR value is not a valid float')
    })
    it('hincrbyfloat on string', async function () {
      await client.hset(key, 'foo', 'bar')
      await assertError(async () => {
        await client.hincrbyfloat(key, 'foo', 2.5)
      }, 'ERR hash value is not a float')
    })
    it('strlen', async function () {
      assert.strictEqual(
        await client.hstrlen(key, 'strlen'),
        0)
    })
  })

  describe('hash error', function () {
    it('shall return wrong type error if key is not an hash', async function () {
      const key = 'test:hset:error'
      await client.del(key)
      await client.set(key, 'foo')
      await assertError(async () => {
        await client.hset(key, 'foo', 'bar')
      }, 'WRONGTYPE Operation against a key holding the wrong kind of value')
    })

    it('shall overwrite hash with set', async function () {
      const key = 'test:hset:error'
      await client.del(key)
      await client.hset(key, 'foo', 'bar')
      await client.set(key, 'foo')
      assert.strictEqual(
        await client.get(key),
        'foo'
      )
    })
  })

  describe('list', function () {
    const key = 'test:list'

    before(async function () {
      await client.del(key)
    })

    it('rpop on empty list', async function () {
      assert.strictEqual(
        await client.rpop(key),
        null
      )
    })

    it('rpush', async function () {
      assert.strictEqual(
        await client.rpush(key, 'one', 'two', 'three'),
        3
      )
    })

    it('rpop', async function () {
      assert.strictEqual(
        await client.rpop(key),
        'three'
      )
    })

    it('rpop count 4', async function () {
      assert.deepStrictEqual(
        await client.rpop(key, 4),
        ['two', 'one']
      )
    })

    it('llen on unknown key', async function () {
      assert.strictEqual(
        await client.llen(key + ':unknown'),
        0
      )
    })

    it('lpush', async function () {
      assert.strictEqual(
        await client.lpush(key, '1', '2', '3'),
        3
      )
    })

    it('lpop', async function () {
      assert.strictEqual(
        await client.lpop(key),
        '3'
      )
    })

    it('rpop', async function () {
      assert.strictEqual(
        await client.rpop(key),
        '1'
      )
    })

    it('lpop count 4', async function () {
      assert.deepStrictEqual(
        await client.lpop(key, 4),
        ['2']
      )
    })

    it('lpushx on not existing key', async function () {
      assert.deepStrictEqual(
        await client.lpushx(key + ':unknown', 'aa', 'bb', 'cc'),
        0
      )
    })

    it('lpushx', async function () {
      const _key = key + ':lpushx'
      await client.del(_key)
      await client.rpush(_key, 'zz')
      assert.deepStrictEqual(
        await client.lpushx(_key, 'aa', 'bb', 'cc'),
        4
      )
    })

    it('rpushx on not existing key', async function () {
      assert.deepStrictEqual(
        await client.rpushx(key + ':unknown', 'aa', 'bb', 'cc'),
        0
      )
    })

    it('rpushx', async function () {
      const _key = key + ':rpushx'
      await client.del(_key)
      await client.lpush(_key, 'zz')
      assert.deepStrictEqual(
        await client.rpushx(_key, 'aa', 'bb', 'cc'),
        4
      )
    })

    it('lindex on not existing key', async function () {
      const _key = key + ':unknown'
      assert.deepStrictEqual(
        await client.lindex(_key, 0),
        null
      )
    })

    it('lindex', async function () {
      const _key = key + ':lindex'
      await client.del(_key)
      await client.rpush(_key, 'aa', 'bb', 'cc')
      assert.deepStrictEqual(
        await client.lindex(_key, 2),
        'cc'
      )
      assert.deepStrictEqual(
        await client.lindex(_key, -2),
        'bb'
      )
    })

    it('llen', async function () {
      const _key = key + ':llen'
      await client.del(_key)
      await client.rpush(_key, ['0', '1', '2', '3', '4', '5', '6'])
      assert.strictEqual(
        await client.llen(_key),
        7
      )
    })

    it('lrange on non existing key', async function () {
      const _key = key + ':unknown'
      assert.deepStrictEqual(
        await client.lrange(_key, 1, 3),
        []
      )
    })

    it('lrange', async function () {
      const _key = key + ':lrange'
      const elements = 'abcdefghijklmnopq'.split('')
      await client.del(_key)
      await client.rpush(_key, ...elements)
      assert.deepStrictEqual(
        await client.lrange(_key, 4, 10),
        ['e', 'f', 'g', 'h', 'i', 'j', 'k']
      )
    })

    it('lrange negative start', async function () {
      const _key = key + ':lrange'
      const elements = 'abcdefghijklmnopq'.split('')
      await client.del(_key)
      await client.rpush(_key, ...elements)
      assert.deepStrictEqual(
        await client.lrange(_key, -4, 10),
        []
      )
    })

    it('lrange out of bounds', async function () {
      const _key = key + ':lrange'
      const elements = 'abcd'.split('')
      await client.del(_key)
      await client.rpush(_key, ...elements)
      assert.deepStrictEqual(
        await client.lrange(_key, 5, 10),
        []
      )
    })

    it('ltrim', async function () {
      const _key = key + ':ltrim'
      await client.del(_key)
      await client.rpush(_key, ['one', 'two', 'three', 'four'])
      assert.strictEqual(
        await client.ltrim(_key, 1, -2),
        'OK'
      )
      assert.deepStrictEqual(
        await client.lrange(_key, 0, -1),
        ['two', 'three']
      )
    })

    it('lrem', async function () {
      const _key = key + ':lrem'
      await client.del(_key)
      await client.rpush(_key, ['1', '0', '2', '3', '0', '0', '4', '5', '0', '6'])
      assert.strictEqual(
        await client.lrem(_key, 0, '0'),
        4
      )
      assert.deepStrictEqual(
        await client.lrange(_key, 0, -1),
        ['1', '2', '3', '4', '5', '6']
      )
    })

    it('lrem head 2', async function () {
      const _key = key + ':lrem'
      await client.del(_key)
      await client.rpush(_key, ['1', '0', '2', '3', '0', '0', '4', '5', '0', '6'])
      assert.strictEqual(
        await client.lrem(_key, 2, '0'),
        2
      )
      assert.deepStrictEqual(
        await client.lrange(_key, 0, -1),
        ['1', '2', '3', '0', '4', '5', '0', '6']
      )
    })

    it('lrem tail -3', async function () {
      const _key = key + ':lrem'
      await client.del(_key)
      await client.rpush(_key, ['1', '0', '2', '3', '0', '0', '4', '5', '0', '6'])
      assert.strictEqual(
        await client.lrem(_key, -3, '0'),
        3
      )
      assert.deepStrictEqual(
        await client.lrange(_key, 0, -1),
        ['1', '0', '2', '3', '4', '5', '6']
      )
    })

    it('lset', async function () {
      const _key = key + ':lset'
      await client.del(_key)
      await client.rpush(_key, ['one', 'two', 'three'])
      assert.strictEqual(
        await client.lset(_key, 0, 'four'),
        'OK'
      )
      assert.strictEqual(
        await client.lset(_key, -2, 'five'),
        'OK'
      )
      assert.deepStrictEqual(
        await client.lrange(_key, 0, -1),
        ['four', 'five', 'three']
      )
    })

    it('lset out of bounds', async function () {
      const _key = key + ':lset'
      await client.del(_key)
      await client.rpush(_key, ['one', 'two', 'three'])
      await assertError(async () => {
        await client.lset(_key, 4, 'four')
      }, 'ERR index out of range')
    })

    it('lpos', async function () {
      const _key = key + ':lpos'
      await client.del(_key)
      await client.rpush(_key, ['a', 'b', 'c', 'd', '1', '2', '3', '4', '3', '3', '3'])
      assert.strictEqual(
        await client.lpos(_key, '3'),
        6
      )
      assert.deepStrictEqual(
        await client.lpos(_key, '3', 'COUNT', 0, 'RANK', 2),
        [8, 9, 10]
      )
    })

    it('lpos rank -3', async function () {
      const _key = key + ':lpos'
      await client.del(_key)
      await client.rpush(_key, ['3', 'a', 'b', 'c', 'd', '1', '2', '3', '4', '3', '3', '3'])
      assert.deepStrictEqual(
        await client.lpos(_key, '3', 'COUNT', 3, 'RANK', -2),
        [10, 9, 7]
      )
    })

    it('lpos on unexisting key', async function () {
      const _key = key + ':lpos'
      await client.del(_key)
      assert.strictEqual(
        await client.lpos(_key, '3'),
        null
      )
    })

    it('lpos zero rank', async function () {
      const _key = key + ':lpos'
      await client.del(_key)
      await assertError(async () => {
        await client.lpos(_key, '3', 'RANK', 0)
      }, "ERR RANK can't be zero: use 1 to start from the first match, 2 from the second ... or use negative to start from the end of the list")
    })

    it('lpos negative count', async function () {
      const _key = key + ':lpos'
      await client.del(_key)
      await assertError(async () => {
        await client.lpos(_key, '3', 'count', -1)
      }, "ERR COUNT can't be negative")
    })

    it('lpos negative maxlen', async function () {
      const _key = key + ':lpos'
      await client.del(_key)
      await assertError(async () => {
        await client.lpos(_key, '3', 'maxlen', -1)
      }, "ERR MAXLEN can't be negative")
    })
  })

  describe('list error', function () {
    const key = 'test:list:error'

    before(async function () {
      await client.del(key)
    })

    it('rpush no elements', async function () {
      await assertError(async () => {
        await client.rpush(key)
      }, 'ERR wrong number of arguments for \'rpush\' command')
    })

    it('lrange with start not a number', async function () {
      const _key = key + ':lrange:error'
      const elements = 'abcdefghijklmnopq'.split('')
      await client.del(_key)
      await client.rpush(_key, ...elements)
      await assertError(async () => {
        await client.lrange(_key, 'x4', 10)
      }, 'ERR value is not an integer or out of range')
    })

    it('ltrim start > stop', async function () {
      const _key = key + ':ltrim:error'
      const elements = 'abcdefghijklmnopq'.split('')
      await client.del(_key)
      await client.rpush(_key, ...elements)
      assert.strictEqual(
        await client.ltrim(_key, 10, 1),
        'OK'
      )
      assert.deepStrictEqual(
        await client.lrange(_key, 0, -1),
        []
      )
    })

    it('ltrim on undefined key', async function () {
      const _key = key + ':ltrim:undefined'
      await client.del(_key)
      assert.strictEqual(
        await client.ltrim(_key, 1, 10),
        'OK'
      )
      assert.deepStrictEqual(
        await client.lrange(_key, 0, -1),
        []
      )
    })
  })
})

describe('Client quit', function () {
  let server
  before(function () {
    server = new Server()
    return server.listen({ port: PORT })
  })
  after(function () {
    return server.close()
  })
  let client
  before(function () {
    client = createClient({ port: clientPort })
  })

  it('should connect and quit', async function () {
    strictEqual(
      await client.quit(),
      'OK'
    )
  })
  it('connection is gone', async function () {
    await assertError(async () => {
      await client.hello()
    }, "HELLO can't be processed. The connection is already closed.")
  })
})

describe('Server with persistence', function () {
  // eslint-disable-next-line eqeqeq
  if (process.env.PORT == 6379) return

  const dbDir = path.resolve(__dirname, 'fixtures')
  const baseFilename = path.resolve(dbDir, 'db')

  const noop = () => {}
  const toArr = (obj) => Object.entries(obj).flat()
  const toSecs = ms => Math.floor(ms / 1000)
  const toEpoch = datestr => new Date(datestr).getTime()
  const toTicks = datestr => toSecs(toEpoch(datestr) - Date.now()) * 1000
  const getCacheContent = (cache) => ({
    map: Object.fromEntries(cache.map),
    expires: Object.fromEntries(cache.expires)
  })

  const opts = { dbDir }
  // const opts = { dbDir, log: () => console }

  before(async function () {
    await fsp.unlink(baseFilename + '.aof').catch(noop)
  })

  let server
  before(function () {
    server = new Server(opts)
    return server.listen({ port: PORT })
  })
  after(function () {
    return server.close()
  })

  let client
  before(async function () {
    const host = '127.0.0.1'
    client = createClient({ host, port: clientPort })
    await client.info()
  })
  after(function () {
    client.quit()
  })

  const cacheContent = {}

  it('shall create persistent keys', async function () {
    const results = await Promise.all([
      client.set('str1', 'str1'),
      client.set('str2', 'str2', 'PX', toTicks('2000-01-01T12:00:00Z')),
      client.set('str3', 'str3'),
      client.set('str4', 'str4', 'EX', toSecs(toTicks('2030-01-01T12:00:00Z'))),
      client.mset('m:num1', '1', 'm:num2', '2', 'm:num3', '3', 'm:num4', '4'),
      client.hset('hash:1', ...toArr({ a: 1, b: 2, c: 3 })),
      client.expireat('hash:1', toSecs(toEpoch('2030-01-01T12:00:00Z'))),
      client.incr('m:num2'),
      client.decr('m:num4'),
      client.del('m:num1', 'm:num3'),
      client.persist('str2'),
      client.persist('str4')
    ])
    // console.log(results)
    deepStrictEqual(
      results,
      ['OK', 'OK', 'OK', 'OK', 'OK', 3, 1, 3, 3, 2, 0, 1]
    )
    Object.assign(cacheContent, getCacheContent(server._cache))
  })

  it('compare stored db', async function () {
    const pexpireatMsReplacer = str => str.replace(/(pexpireat\r\n\$4\r\n\S+\r\n:)(\d+)/g, (m, m1, m2) => {
      m2 = m2.replace(/\d{3}$/, '000')
      return m1 + m2
    })

    const result = await fsp.readFile(baseFilename + '.aof', 'utf8')
    const exp = await fsp.readFile(baseFilename + '.exp.aof', 'utf8')

    strictEqual(pexpireatMsReplacer(result), pexpireatMsReplacer(exp))
  })

  it('start with persisted db', async function () {
    const server = new Server(opts)
    await server.listen({ port: PORT + 1 })

    // verify cache content
    deepStrictEqual(
      getCacheContent(server._cache),
      cacheContent
    )

    await server.close()
  })
})
