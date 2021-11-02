const process = require('process')
const net = require('net')
const path = require('path')
const { Cache } = require('./Cache.js')
const { Client } = require('./Client.js')
const { Commands } = require('./Commands.js')
const { Persistence } = require('./Persistence.js')
const { PubSub } = require('./PubSub.js')
const {
  OK,
  USERNAME_DEFAULT,
  ERR_NOAUTH
} = require('./constants.js')
const {
  writeResponse,
  RequestParser
} = require('./Protocol.js')
const {
  isFunction,
  sleep,
  timingSafeEqual,
  createPromise
} = require('./utils.js')
const {
  setLogFn,
  logger
} = require('./log.js')

const EXIT_SIGNALS = [
  'SIGINT',
  'SIGTERM',
  'SIGHUP',
  'SIGBREAK'
]

/**
 * @typedef {import('node:net').Socket} Socket
 */
/**
 * @type {{
 *   error: (...args: any[]) => void,
 *   warn: (...args: any[]) => void,
 *   info: (...args: any[]) => void,
 *   debug: (...args: any[]) => void
 * }}
 */
let log

class Server {
  /**
   * @param {{
   *  username?: string,
   *  password?: string,
   *  log?: function,
   *  gracefulTimeout?: number,
   *  maxBufferLength?: number,
   *  HashMap?: MapConstructor,
   *  nextHouseKeepingSec?: number,
   *  dbDir?: string
   * }} options
   */
  constructor (options) {
    const {
      username = USERNAME_DEFAULT,
      password,
      log: _logger, // general logging e.g. to use console logging `() => console`
      gracefulTimeout = 100, // server timeout
      maxBufferLength, // RequestParser
      HashMap, // Cache
      nextHouseKeepingSec, // Cache
      dbDir // Persistence
    } = options || {}

    if (isFunction(_logger)) {
      setLogFn(_logger)
    }
    log = logger()

    const filename = dbDir
      ? path.resolve(dbDir, 'db.aof')
      : undefined

    this._config = {
      version: '7.0.0',
      name: 'sider-mem',
      mode: 'standalone',
      role: 'master'
    }

    this._opts = { maxBufferLength, gracefulTimeout, port: undefined }
    this._cache = new Cache({ HashMap, nextHouseKeepingSec })
    this._pubsub = new PubSub()
    this._store = new Persistence({ filename, cache: this._cache })

    this._sockets = new Set()
    this._isShutdown = false

    this._needsAuth = password !== undefined
    /**
     *
     * @param {{ username?: string, password?: string }} auth
     * @returns
     */
    this._verifyAuth = (auth) => {
      const u = timingSafeEqual(auth.username, username)
      const p = timingSafeEqual(auth.password, password)
      return u && p
    }
  }

  /**
   * @private
   * @param {any[]} req
   * @param {Commands} commands
   * @param {Client} client
   * @returns {Promise<string>}
   */
  async _handleRequest (req, commands, client) {
    log.debug('%j', req)
    const [cmd, ...args] = req

    if (this._needsAuth && !client.isAuthenticated) {
      const data = (cmd === 'auth')
        ? commands.auth(...args)
        : new Error(ERR_NOAUTH)
      return writeResponse(data)
    }

    let data
    try {
      if (commands.hasTransaction()) {
        data = await commands.handleTransaction(cmd, args)
      } else {
        data = await commands.handleCommand(cmd, args)
      }
    } catch (err) {
      log.warn({ err })
      data = err
    }

    return writeResponse(data)
  }

  /**
   * @private
   * @param {Socket} socket
   * @returns
   */
  _connect (socket) {
    if (this._isShutdown) {
      socket.destroy()
      return
    }

    this._sockets.add(socket)
    socket.once('close', () => {
      this._sockets.delete(socket)
    })

    const parser = new RequestParser(this._opts)
    const client = new Client(socket)
    const commands = new Commands({ server: this, drain: this._store, client })

    log.info('client connected %s', client.addr)

    const processQueuedRequest = async () => {
      const req = client.nextRequest()
      if (!req) return
      const data = await this._handleRequest(req, commands, client)
      log.debug('%j', data)
      socket.write(data)
      processQueuedRequest()
    }

    parser.on('request', async req => {
      if (client.queueRequest(req)) {
        processQueuedRequest()
      }
    })

    socket.on('data', (data) => {
      // log.warn('%s', data.toString())
      parser.parse(data)
    })

    socket.on('end', () => {
      log.info('client disconnected %s', client.addr)
    })

    /* c8 ignore next 7 */
    socket.on('error', (err) => {
      log.error('error', err)
    })

    socket.on('timeout', () => {
      log.info('timeout')
    })
  }

  /**
   * @param {{
   *  socket?: Socket,
   *  host?: string | undefined;
   *  port?: string;
   * }} options
   */
  async listen (options) {
    const {
      socket,
      host = '127.0.0.1',
      port = 6379
    } = options || {}

    await this._store.load()

    Object.assign(this._opts, { socket, host, port })
    this._server = net.createServer(socket => this._connect(socket))

    EXIT_SIGNALS.forEach(signal => process.on(signal, () => {
      this.close().finally(() => process.exit())
    }))

    const { promise, reject, resolve } = createPromise()

    const cb = (/** @type {Error} */ err) => {
      if (err) {
        log.error(err)
        reject(err)
      }
      log.info('server online %j', this._server?.address())
      resolve()
    }

    if (socket) {
      this._server.listen(socket, cb)
    } else {
      // @ts-ignore
      this._server.listen(port, host, cb)
    }

    return promise
  }

  async close () {
    const { promise, reject, resolve } = createPromise()
    if (this._isShutdown) return
    this._isShutdown = true

    if (this._sockets.size) {
      log.info('server closing open connections %s', this._sockets.size)
      await sleep(this._opts.gracefulTimeout)
      for (const socket of this._sockets) {
        socket.destroy()
      }
    }

    this._server?.close((err) => err ? reject(err) : resolve(OK))
    log.info('server closed')

    return promise
  }
}

module.exports = { Server }
