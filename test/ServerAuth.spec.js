const process = require('process')
const assert = require('assert')
const log = require('debug')('test')
const { Server } = require('..')
const { sleep } = require('../src/utils.js')
const {
  createClient
} = require('./support.js')
const { strictEqual } = assert

const PORT = 6380

const clientPort = process.env.PORT || PORT

describe('Server authentication', function () {
  const username = 'alice'
  const password = 'somepassword'
  let server

  before(function () {
    server = new Server({ username, password })
    return server.listen({ port: PORT })
  })
  after(function () {
    return server.close()
  })

  let client
  before(async function () {
    const host = '127.0.0.1'
    client = createClient({ host, port: clientPort, user: username, password })
    await sleep(50)
  })
  after(function () {
    client.quit()
  })

  describe('various', function () {
    it('ping', async function () {
      strictEqual(
        await client.ping(),
        'PONG'
      )
    })

    it('info', async function () {
      const result = await client.info('server')
      log(result)
      assert.ok(/redis_version/.test(result))
    })
  })
})

describe('Server bad authentication', function () {
  const username = 'alice'
  const password = 'somepassword'

  let server
  before(function () {
    server = new Server({ username, password })
    return server.listen({ port: PORT })
  })
  after(function () {
    return server.close()
  })

  it('should not connect with wrong credentials', function (done) {
    const client = createClient({ port: clientPort, user: username, password: 'wrong' })
    let cnt = 0
    client.on('error', (err) => {
      // console.log(err.message)
      cnt++
      cnt === 1 && strictEqual(err.message, 'WRONGPASS invalid username-password pair or user is disabled.')
      cnt === 2 && strictEqual(err.message, 'Ready check failed: NOAUTH Authentication required.')
      cnt === 2 && done()
    })
  })

  it('should not connect without credentials', function (done) {
    const client = createClient({ port: clientPort })
    client.on('error', (err) => {
      strictEqual(err.message, 'Ready check failed: NOAUTH Authentication required.')
      done()
    })
  })
})
