const assert = require('assert')
const { Server } = require('../src/index.js')
const { createPromise, sleep } = require('../src/utils.js')
const {
  createClient
} = require('./support.js')

const { strictEqual, deepStrictEqual } = assert

const PORT = 6380
const clientPort = process.env.PORT || PORT

describe('PubSub', function () {
  /** @type {Server} */
  let server
  const host = '127.0.0.1'

  before(function () {
    const opts = {}
    // const opts = { HashMap: HamtMap, log: () => console }
    server = new Server(opts)
    return server.listen({ port: PORT })
  })
  after(function () {
    return server.close()
  })

  let client
  let subscriber
  let publisher
  let psubscriber
  const clientOpts = { host, port: clientPort }
  before(async function () {
    client = createClient(clientOpts)
    await client.info()
    subscriber = createClient(clientOpts)
    psubscriber = createClient(clientOpts)
    publisher = subscriber.cb.duplicate()
  })
  after(function () {
    subscriber.quit()
    psubscriber.quit()
    publisher.quit()
    client.quit()
  })

  describe('channels', function () {
    it('shall subscribe', async function () {
      const subscribed = []

      subscriber.on('subscribe', (channel, count) => {
      // console.log(channel, count)
        subscribed.push([channel, count])
      })

      strictEqual(
        await subscriber.subscribe('foo'),
        'foo'
      )
      strictEqual(
        await subscriber.subscribe('faa', 'foo', 'aaa', 'fii'),
        'fii'
      )

      deepStrictEqual(subscribed, [['foo', 1], ['faa', 2], ['foo', 2], ['aaa', 3], ['fii', 4]])
    })

    it('shall publish', async function () {
      const messages = []
      const p = createPromise()

      subscriber.on('message', (channel, message) => {
        // console.log(channel, message)
        messages.push([channel, message])
        if (messages.length === 3) p.resolve()
      })

      strictEqual(
        await publisher.publish('foo', 'bar'),
        true
      )
      strictEqual(
        await publisher.publish('faa', 'baa'),
        true
      )
      strictEqual(
        await publisher.publish('foo', 'baz'),
        true
      )
      await p.promise
      deepStrictEqual(messages, [['foo', 'bar'], ['faa', 'baa'], ['foo', 'baz']])
    })

    it('shall get channels', async function () {
    // need client in "normal mode"
      deepStrictEqual(
        (await client.sendCommand('pubsub', ['channels'])).sort(),
        ['faa', 'fii', 'aaa', 'foo'].sort()
      )
      deepStrictEqual(
        (await client.sendCommand('pubsub', ['channels', '?aa'])).sort(),
        ['faa', 'aaa'].sort()
      )
    })

    it('shall get number of subscribers', async function () {
    // need client in "normal mode"
      deepStrictEqual(
        await client.sendCommand('pubsub', ['numsub']),
        []
      )
      deepStrictEqual(
        await client.sendCommand('pubsub', ['numsub', 'aaa', 'foo']),
        ['aaa', 1, 'foo', 1]
      )
    })

    it('shall drop subscription in case of closing', async function () {
      const subscriber = createClient(clientOpts)
      await subscriber.info()
      await subscriber.subscribe('foo')
      deepStrictEqual(
        await client.sendCommand('pubsub', ['numsub', 'foo']),
        ['foo', 2]
      )
      subscriber.quit()
      await sleep(20)
      deepStrictEqual(
        await client.sendCommand('pubsub', ['numsub', 'foo']),
        ['foo', 1]
      )
    })

    it('shall unsubscribe from one channel', async function () {
      strictEqual(
        await subscriber.unsubscribe('foo'),
        'foo'
      )
      deepStrictEqual(
        (await client.sendCommand('pubsub', ['channels'])).sort(),
        ['faa', 'fii', 'aaa'].sort()
      )
    })

    it('shall unsubscribe from all channels', async function () {
      const unsubscribed = {}

      subscriber.on('unsubscribe', (channel, count) => {
        unsubscribed[channel] = count
      // console.log([channel, count])
      })

      await subscriber.unsubscribe()

      deepStrictEqual(
        await client.sendCommand('pubsub', ['channels']),
        []
      )
      strictEqual(
        await subscriber.unsubscribe('lala'),
        'lala'
      )

      deepStrictEqual(
        Object.keys(unsubscribed).sort(),
        ['aaa', 'faa', 'fii', 'lala']
      )
      strictEqual(unsubscribed.lala, 0)
    })
  })
  describe('pattern', function () {
    it('shall psubscribe', async function () {
      const subscribed = []

      psubscriber.on('psubscribe', (channel, count) => {
      // console.log(channel, count)
        subscribed.push([channel, count])
      })

      await psubscriber.psubscribe('foo')
      await psubscriber.psubscribe('*aa')

      deepStrictEqual(subscribed, [['foo', 1], ['*aa', 2]])
    })

    it('shall psubscribe on channel subscription', async function () {
      const messages = []
      const p = createPromise()

      psubscriber.on('pmessage', (pattern, channel, message) => {
        messages.push([pattern, channel, message])
        if (messages.length === 2) p.resolve()
      })

      await publisher.publish('foo', 'bar')
      await publisher.publish('aaa', 'ahh')

      await p.promise

      deepStrictEqual(messages,
        [['foo', 'foo', 'bar'], ['*aa', 'aaa', 'ahh']]
      )
    })

    it('shall get number of subscribed patterns', async function () {
      deepStrictEqual(
        await client.sendCommand('pubsub', ['channels']),
        []
      )

      deepStrictEqual(
        await client.sendCommand('pubsub', ['numpat']),
        2
      )
    })

    it('shall drop subscription in case of closing', async function () {
      const subscriber = createClient(clientOpts)
      await subscriber.info()
      await subscriber.psubscribe('bbb', 'foo')
      strictEqual(
        await client.sendCommand('pubsub', ['numpat']),
        3
      )
      subscriber.quit()
      await sleep(20)
      strictEqual(
        await client.sendCommand('pubsub', ['numpat']),
        2
      )
    })

    it('shall unsubscribe from all patterns', async function () {
      const unsubscribed = {}

      psubscriber.on('punsubscribe', (pattern, count) => {
        unsubscribed[pattern] = count
      // console.log([pattern, count])
      })

      await psubscriber.punsubscribe()

      deepStrictEqual(
        await client.sendCommand('pubsub', ['numpat']),
        0
      )
      strictEqual(
        await psubscriber.punsubscribe('lala'),
        'lala'
      )

      deepStrictEqual(
        Object.keys(unsubscribed).sort(),
        ['*aa', 'foo', 'lala']
      )
      strictEqual(unsubscribed.lala, 0)
    })
  })
})
