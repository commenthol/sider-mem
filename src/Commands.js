/**
 * Implements the Redis mem-cache for the supported commands
 * @module Commands
 * @copyright 2021 commenthol <commenthol@gmail.com>
 * @license MIT
 * @see https://redis.io/commands
 */

// @ts-check

const os = require('os')
const { commandList } = require('./commandList.js')
const {
  createBulkStringResp,
  createSimpleArrayResp,
  ResponseData,
  writeResponse
} = require('./Protocol.js')
const {
  isNil,
  isFunction,
  isInteger,
  isString,
  isNumber,
  toNumber,
  capitalize,
  toHumanMemSize,
  isMatch,
  nextTick,
  msToSecs,
  getType
} = require('./utils.js')
const {
  OK,
  USERNAME_DEFAULT,
  DAY_SECONDS,
  ERR_CLIENT_NAMES,
  ERR_CURSOR,
  ERR_DB_INDEX,
  ERR_HASH_FLOAT,
  ERR_HASH_INTEGER,
  ERR_NOT_INTEGER,
  ERR_SYNTAX,
  ERR_TYPE,
  ERR_VALUE_FLOAT,
  ERR_WRONGPASS,
  ERR_EXECABORT,
  ERR_NO_SUCH_KEY,
  ERR_RANGE,
  NX,
  XX,
  GT,
  LT,
  KEY_NOT_EXISTS,
  KEY_NO_EXPIRY,
  TRUE,
  FALSE,
  TYPE_STRING,
  TYPE_HASH,
  TYPE_NONE,
  TYPE_LIST
} = require('./constants.js')
const { logger } = require('./log.js')

/**
 * @typedef {import('./Server.js').Server} Server
 * @typedef {import('./Cache.js').Cache} Cache
 * @typedef {import('./Client.js').Client} Client
 * @typedef {import('./Persistence.js').Persistence} Persistence
 * @typedef {import('./PubSub.js').PubSub} PubSub
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

const PEXPIREAT = 'pexpireat'
const SET = 'set'

/**
 * @param {any[]} values
 */
const assertInteger = (...values) => {
  for (const value of values) {
    if (!isInteger(Number(value))) {
      throw new Error(ERR_NOT_INTEGER)
    }
  }
}

/**
 * @param {string[]} args
 * @returns {{matcher: function, count: number, type: string|undefined}}
 */
const parseScanArgs = (args) => {
  let matcher = () => true
  let count = 10
  let type

  for (let i = 0; i < args.length; i += 2) {
    const cmd = String(args[i]).toLowerCase()
    const val = args[i + 1]
    switch (cmd) {
      case 'match':
        // @ts-ignore
        matcher = isMatch(val)
        break
      case 'count': {
        const int = Number(val)
        if (isInteger(int)) {
          count = int
        }
        break
      }
      case 'type':
        type = getType(val)
        break
      default:
        log.error('%s for "%s" "%s"', ERR_SYNTAX, cmd, val)
        throw new Error(ERR_SYNTAX)
    }
  }
  return { matcher, count, type }
}

/**
 * @param {number} index
 * @param {number} length
 * @returns {number}
 */
const normNegativeIndex = (index, length) => index < 0 ? length + index : index

/**
 * finds start stop position for lrange
 * @param {number} start
 * @param {number} stop
 * @param {number} length
 * @returns {[start?: number, stop?: number]}
 */
const lrangeStartStop = (start, stop, length) => {
  start = Number(start)
  stop = Number(stop)
  assertInteger(start, stop)
  if (!length) return []
  start = normNegativeIndex(start, length)
  stop = normNegativeIndex(stop, length)
  if (start > stop) return []
  return [start, stop + 1]
}

/**
 * obtain subarguments of a command as hashmap
 * @param {any[]} arr
 * @param {function} [transform]
 * @returns {object}
 */
const subarguments = (arr, transform = v => v) => {
  const args = {}
  for (let i = 0; i < arr.length; i += 2) {
    const key = String(arr[i]).toLowerCase()
    const val = arr[i + 1]
    args[key] = transform(val)
  }
  return args
}

class Commands {
  /**
   * @param {{
   *  server: Server;
   *  cache?: Cache;
   *  client: Client;
   *  pubsub?: PubSub;
   *  drain: Persistence;
   * }} options
   */
  constructor (options) {
    const {
      server,
      cache,
      client,
      pubsub,
      drain
    } = options

    log = logger('commands')

    this._server = server
    this._client = client
    this._cache = cache || server._cache
    this._pubsub = pubsub || server?._pubsub
    this._drain = drain
  }

  /**
   * @param {string} cmd
   * @param {any[]} args
   * @returns {Error}
   */
  unknownCommand (cmd, args) {
    return new Error(`ERR unknown command \`${cmd}\`, with args beginning with: ${args.map((/** @type {any} */ a) => `\`${a}\``).join(', ')}`)
  }

  /**
   * @param {string} cmd
   * @param {string} subcmd
   * @returns {Error}
   */
  unknownSubCommand (cmd, subcmd) {
    return new Error(`ERR Unknown subcommand or wrong number of arguments for '${subcmd}'. Try ${cmd.toUpperCase()} HELP.`)
  }

  /**
   * @param {string} cmd
   * @param {any[]} args
   * @throws {Error}
   */
  assertCommand (cmd, args) {
    /** @type {[arity:number, flags:string[], first:number, last:number, step:number, refs: string[]]} */
    const fields = commandList[cmd]
    if (!fields) {
      throw this.unknownCommand(cmd, args)
    }
    let fails = false
    const len = args.length
    const [arity, , , , step] = fields
    if (arity > 0) { // fixed length
      fails = len !== arity - 1
    } else if (arity === -1) {
      // noop
    } else {
      const _arity = -arity - 1
      fails = len < _arity || (step ? (len % step) !== 0 : false)
    }
    if (fails) {
      throw new Error(`ERR wrong number of arguments for '${cmd}' command`)
    }
  }

  /**
   * @param {string} cmd
   * @param {any} args
   * @returns {Promise<any>}
   */
  async handleCommand (cmd, args) {
    if (isFunction(this[cmd])) {
      this.assertCommand(cmd, args)
      const data = await this[cmd](...args)
      // log.debug(cmd, data)
      return data
    } else {
      throw this.unknownCommand(cmd, args)
    }
  }

  // ---- server related

  /**
   * @param {any[]} section
   * @returns {ResponseData}
   */
  info (...section) {
    const { version, mode, role } = this._server._config
    const { port } = this._server._opts
    const uptimeInSecs = Math.floor(process.uptime())
    const uptimeInDays = Math.floor(uptimeInSecs / DAY_SECONDS)

    const { rss, heapTotal, heapUsed } = process.memoryUsage()
    const totalSystemMemory = os.totalmem()

    const vals = {
      server: {
        redis_version: version,
        // redis_git_sha1: '00000000',
        // redis_git_dirty: 0,
        // redis_build_id: '8e8f21c771ddd347',
        redis_mode: mode,
        // os: 'Linux 5.4.0-88-generic x86_64',
        // arch_bits: 64,
        process_id: process.pid,
        tcp_port: port,
        uptime_in_seconds: uptimeInSecs,
        uptime_in_days: uptimeInDays
        // hz: 10,
        // configured_hz: 10,
        // lru_clock: 6995322,
        // executable: '/data/redis-server',
        // config_file: '',
        // io_threads_active: 0
      },
      clients: {
        connected_clients: this._server._sockets.size
        // client_recent_max_input_buffer: 8,
        // client_recent_max_output_buffer: 0,
        // blocked_clients: 0,
        // tracking_clients: 0,
        // clients_in_timeout_table: 0
      },
      memory: {
        used_memory: heapUsed,
        used_memory_human: toHumanMemSize(heapUsed),
        used_memory_rss: rss,
        used_memory_rss_human: toHumanMemSize(rss),
        used_memory_peak: heapTotal,
        used_memory_peak_human: toHumanMemSize(heapTotal),
        // used_memory_peak_perc: '100.00%',
        // used_memory_overhead: '803224',
        // used_memory_startup: '803152',
        // used_memory_dataset: '63496',
        // used_memory_dataset_perc: '99.89%',
        // allocator_allocated: '1076256',
        // allocator_active: '1355776',
        // allocator_resident: '4018176',
        total_system_memory: totalSystemMemory,
        total_system_memory_human: toHumanMemSize(totalSystemMemory)
        // used_memory_lua: '37888',
        // used_memory_lua_human: '37.00K',
        // used_memory_scripts: '0',
        // used_memory_scripts_human: '0B',
        // number_of_cached_scripts: '0',
        // maxmemory: '0',
        // maxmemory_human: '0B',
        // maxmemory_policy: 'noeviction',
        // allocator_frag_ratio: '1.26',
        // allocator_frag_bytes: '279520',
        // allocator_rss_ratio: '2.96',
        // allocator_rss_bytes: '2662400',
        // rss_overhead_ratio: '1.49',
        // rss_overhead_bytes: '1961984',
        // mem_fragmentation_ratio: '7.44',
        // mem_fragmentation_bytes: '5176896',
        // mem_not_counted_for_evict: '0',
        // mem_replication_backlog: '0',
        // mem_clients_slaves: '0',
        // mem_clients_normal: '0',
        // mem_aof_buffer: '0',
        // mem_allocator: 'jemalloc-5.1.0',
        // active_defrag_running: '0',
        // lazyfree_pending_objects: '0'
      },
      persistence: {
        // loading: 0,
        // rdb_changes_since_last_save: 0,
        // rdb_bgsave_in_progress: 0,
        // rdb_last_save_time: 1634385207,
        // rdb_last_bgsave_status: ok,
        // rdb_last_bgsave_time_sec: 0,
        // rdb_current_bgsave_time_sec: -1,
        // rdb_last_cow_size: 106496,
        // aof_enabled: 0,
        // aof_rewrite_in_progress: 0,
        // aof_rewrite_scheduled: 0,
        // aof_last_rewrite_time_sec: -1,
        // aof_current_rewrite_time_sec: -1,
        // aof_last_bgrewrite_status: ok,
        // aof_last_write_status: ok,
        // aof_last_cow_size: 0,
        // module_fork_in_progress: 0,
        // module_fork_last_cow_size: 0
      },
      stats: {
        // total_connections_received: 7,
        // total_commands_processed: 19,
        // instantaneous_ops_per_sec: 0,
        // total_net_input_bytes: 466,
        // total_net_output_bytes: 25637,
        // instantaneous_input_kbps: 0.00,
        // instantaneous_output_kbps: 0.00,
        // rejected_connections: 0,
        // sync_full: 0,
        // sync_partial_ok: 0,
        // sync_partial_err: 0,
        // expired_keys: 0,
        // expired_stale_perc: 0.00,
        // expired_time_cap_reached_count: 0,
        // expire_cycle_cpu_milliseconds: 83,
        // evicted_keys: 0,
        // keyspace_hits: 6,
        // keyspace_misses: 0,
        // pubsub_channels: 0,
        // pubsub_patterns: 0,
        // latest_fork_usec: 267,
        // migrate_cached_sockets: 0,
        // slave_expires_tracked_keys: 0,
        // active_defrag_hits: 0,
        // active_defrag_misses: 0,
        // active_defrag_key_hits: 0,
        // active_defrag_key_misses: 0,
        // tracking_total_keys: 0,
        // tracking_total_items: 0,
        // tracking_total_prefixes: 0,
        // unexpected_error_replies: 0,
        // total_reads_processed: 26,
        // total_writes_processed: 19,
        // io_threaded_reads_processed: 0,
        // io_threaded_writes_processed: 0
      },
      replication: {
        role
        // connected_slaves: 0,
        // master_replid: '8c5ee10002f0534f5ab17a4551d40e596c5245b0',
        // master_replid2: '0000000000000000000000000000000000000000',
        // master_repl_offset: 0,
        // second_repl_offset: -1,
        // repl_backlog_active: 0,
        // repl_backlog_size: 1048576,
        // repl_backlog_first_byte_offset: 0,
        // repl_backlog_histlen: 0
      },
      cpu: {
        // used_cpu_sys: 4.254865,
        // used_cpu_user: 4.103966,
        // used_cpu_sys_children: 0.001822,
        // used_cpu_user_children: 0.004918
      },
      modules: {
      },
      cluster: {
        cluster_enabled: 0
      },
      keyspace: {
        db0: 'keys=1,expires=0,avg_ttl=0'
      }
    }

    /**
     * @type {string[]}
     */
    const arr = []

    const sections = section.length ? section : Object.keys(vals)

    sections.forEach(section => {
      // @ts-ignore
      const o = vals[section]
      if (o) {
        arr.push(`# ${capitalize(section, true)}`)
        Object.entries(o).forEach(([k, v]) => {
          arr.push(`${k}:${v}`)
        })
        arr.push('')
      }
    })

    return new ResponseData(arr, createBulkStringResp)
  }

  /**
   * @returns {object}
   */
  hello () {
    const { name, version, mode, role } = this._server._config
    return {
      server: name,
      version,
      proto: 2,
      id: 12, // ???
      mode,
      role,
      modules: []
    }
  }

  /**
   * @throws {Error}
   * @param {string} subcmd
   * @param {any[]} args
   * @returns {string[]}
   */
  command (subcmd, ...args) {
    subcmd = (subcmd || '').toLowerCase()

    /**
     * @private
     * @param {any[]} a
     * @param {any[]} currentValue
     * @returns {(any|null)[]}
     */
    const reducer = (a, [cmd, fields]) => {
      if (!fields) {
        a.push(null)
      } else {
        a.push([cmd, ...fields])
      }
      return a
    }

    if (subcmd) {
      if (subcmd === 'info') {
        return args.map((cmd) => {
          const fields = commandList[cmd] || null
          return [cmd, fields]
        }).reduce(reducer, [])
      } else {
        throw this.unknownSubCommand('command', subcmd)
      }
    }

    return Object.entries(commandList).reduce(reducer, [])
  }

  /**
   * @returns {string[]} [secs: string, microSecs: string]
   */
  time () {
    const now = Date.now()
    const secs = msToSecs(now)
    const microSecs = (now % secs) * 1000
    return [secs, microSecs].map(String)
  }

  // ---- admin

  /**
   * @returns {Promise<void>}
   */
  async shutdown () {
    return this._server.close().finally(() => process.exit())
  }

  // ---- client

  /**
   * @param {any[]} args
   * @returns {string|Error}
   */
  auth (...args) {
    const [username, password] = args.length === 1 ? [USERNAME_DEFAULT, args[0]] : args
    const isAuth = this._server._verifyAuth({ username, password })
    if (isAuth) {
      this._client.isAuthenticated = isAuth
      this._client.user = username
      return OK
    }
    log.error('%s; username %s', ERR_WRONGPASS, username)
    return new Error(ERR_WRONGPASS)
  }

  /**
   * @throws {Error}
   * @param {number} db
   * @returns {string}
   */
  select (db) {
    assertInteger(db)
    if (db > 0) {
      throw new Error(ERR_DB_INDEX)
    }
    this._client.db = db
    return OK
  }

  /**
   * @throws {Error}
   * @param {any} subcmd
   * @param {any[]} args
   * @returns {string|string[]|null}
   */
  client (subcmd, ...args) {
    switch (subcmd) {
      case 'setname': {
        const name = args[0]
        if (/[^0-9a-zA-Z-_]/.test(name)) {
          throw new Error(ERR_CLIENT_NAMES)
        }
        this._client.name = name
        return OK
      }
      case 'getname': {
        return this._client.name ?? null
      }
      case 'list': {
        return Object.entries(this._client.list()).map(([k, v]) => `${k}=${v}`).join(' ')
      }
      default: {
        throw this.unknownSubCommand('client', subcmd)
      }
    }
  }

  /**
   * @returns {string}
   */
  quit () {
    this._client.end()
    return OK
  }

  // ---- general

  /**
   * @param {string} message
   * @returns {string}
   */
  ping (message) {
    return message || 'PONG'
  }

  /**
   * @param {string} message
   * @returns {string}
   */
  echo (message) {
    return message
  }

  /**
   * @param {any[]} keys
   * @returns {number}
   */
  exists (...keys) {
    for (const key of keys) {
      if (this.pttl(key) > KEY_NOT_EXISTS) {
        return TRUE
      }
    }
    return FALSE
  }

  /**
   * @param {any[]} keys
   * @returns {number}
   */
  del (...keys) {
    let count = 0
    const deletedKeys = []
    for (const key of keys) {
      if (this._cache.delete(key)) {
        deletedKeys.push(key)
        count++
      }
    }
    if (deletedKeys.length) {
      this._drain.write('del', ...deletedKeys)
    }
    return count
  }

  /**
   * @private
   * @param {string} key
   * @param {string} newkey
   * @returns {string}
   */
  _rename (key, newkey) {
    const value = this._cache.getAny(key)
    this._cache.set(newkey, value)
    this._cache.delete(key)
    this._drain.write('rename', key, newkey)
    return OK
  }

  /**
   * @param {string} key
   * @param {string} newkey
   * @returns {string}
   */
  rename (key, newkey) {
    if (!this.exists(key)) {
      throw new Error(ERR_NO_SUCH_KEY)
    }
    return this._rename(key, newkey)
  }

  /**
   * @param {string} key
   * @param {string} newkey
   * @returns {number}
   */
  renamenx (key, newkey) {
    if (!this.exists(key)) {
      throw new Error(ERR_NO_SUCH_KEY)
    }
    if (this.exists(newkey)) {
      return FALSE
    }
    this._rename(key, newkey)
    return TRUE
  }

  /**
   * @param {any} key
   * @returns {string}
   */
  type (key) {
    return this._cache.getType(key) || TYPE_NONE
  }

  /**
   * @returns {string} always 'OK
   */
  flushall () {
    this._cache.clear()
    return OK
  }

  /**
   * @returns {string} always 'OK
   */
  flushdb () {
    this._cache.clear()
    return OK
  }

  /**
   * @throws {Error}
   * @param {number} cursor
   * @param {any[]} args
   * @returns {Promise<[cursor: string, results: any[]]>}
   */
  async scan (cursor, ...args) {
    cursor = Number(cursor)

    if (!isInteger(cursor)) {
      throw new Error(ERR_CURSOR)
    }

    const parsed = parseScanArgs(args)

    let iterator = this._client.getCursor(cursor)
    if (!iterator) {
      iterator = this._cache.iterator()
      cursor = 0
    }

    const results = []
    let counter = 0

    while (true) {
      const { value: val = [], done } = iterator.next()
      const [key, value] = val
      const isTypeMatching = parsed.type ? parsed.type === getType(value) : true
      cursor++

      if (key && isTypeMatching && parsed.matcher(key) && this._cache.has(key)) {
        results.push(key)
      }

      if (done || ++counter >= parsed.count) {
        this._client.setCursor(cursor, iterator, done)
        const _cursor = String(done ? 0 : cursor)
        return [_cursor, results]
      } else {
        await nextTick()
      }
    }
  }

  // --- transaction

  /**
   * @returns {boolean}
   */
  hasTransaction () {
    return this._client.hasTransaction
  }

  /**
   * @param {string} cmd
   * @param {any} args
   * @returns {Promise<ResponseData|Error|string>}
   */
  handleTransaction (cmd, args) {
    if (cmd === 'exec') {
      return this.exec()
    }
    this._client.pushTransaction(cmd, args)
    return Promise.resolve('QUEUED')
  }

  /**
   * @returns {string} always 'OK
   */
  multi () {
    this._client.startTransaction()
    return OK
  }

  /**
   * @returns {Promise<ResponseData|Error>}
   */
  async exec () {
    try {
      const arr = []
      const cmdArgs = this._client.endTransaction()
      for (const [cmd, args] of cmdArgs) {
        const result = await this.handleCommand(cmd, args)
        arr.push(writeResponse(result))
      }
      return new ResponseData(arr, createSimpleArrayResp)
    } catch (/** @type {any} */ err) {
      log.warn('EXECABORT %s', err?.message)
      return new Error(ERR_EXECABORT)
    }
  }

  // --- ttl

  /**
   * @param {any} key
   * @param {string|number} seconds
   * @param {string} type
   */
  expire (key, seconds, type) {
    return this.pexpire(key, toNumber(seconds) * 1000, type)
  }

  /**
   * @param {any} key
   * @param {any} timestamp
   * @param {any} type
   * @returns {number} FALSE: 0, TRUE: 1
   */
  expireat (key, timestamp, type) {
    return this.pexpireat(key, toNumber(timestamp) * 1000, type)
  }

  /**
   * @param {any} key
   * @returns {number}
   */
  expiretime (key) {
    return msToSecs(this.pexpiretime(key))
  }

  /**
   * @param {any} key
   * @returns {number} TTL in seconds
   */
  ttl (key) {
    return msToSecs(this.pttl(key))
  }

  /**
   * @param {any} key
   * @param {number} ms
   * @param {any} type
   * @returns {number} FALSE: 0, TRUE: 1
   */
  pexpire (key, ms, type) {
    return this.pexpireat(key, Date.now() + toNumber(ms), type)
  }

  /**
   * @param {any} key
   * @param {number | undefined} timestampMs
   * @param {any} type
   * @returns {number} FALSE: 0, TRUE: 1
   */
  pexpireat (key, timestampMs, type) {
    timestampMs = Number(timestampMs)
    assertInteger(timestampMs)

    const ttl = this.pttl(key)
    if (ttl === KEY_NOT_EXISTS) {
      return FALSE
    }

    let retVal = FALSE

    switch (type) { // type is supported since v7.0.0
      case NX:
        if (ttl === KEY_NO_EXPIRY) {
          retVal = TRUE
        }
        break
      case XX:
        if (ttl !== KEY_NO_EXPIRY) {
          retVal = TRUE
        }
        break
      case GT: {
        const ts = this._cache.getExpiry(key)
        if (timestampMs > ts) {
          retVal = TRUE
        }
        break
      }
      case LT: {
        const ts = this._cache.getExpiry(key)
        if (timestampMs < ts) {
          retVal = TRUE
        }
        break
      }
      default: {
        retVal = TRUE
        break
      }
    }

    if (timestampMs <= Date.now()) {
      this.del(key)
      return FALSE
    }

    if (retVal === TRUE) {
      this._cache.setExpiry(key, timestampMs)
      this._drain.write(PEXPIREAT, key, timestampMs)
      return TRUE
    }
    return FALSE
  }

  /**
   * @param {any} key
   * @returns {number}
   */
  pexpiretime (key) {
    if (!this._cache.hasExpiry(key)) {
      return this._cache.has(key) ? KEY_NO_EXPIRY : KEY_NOT_EXISTS
    }
    const timestamp = this._cache.getExpiry(key)
    if (timestamp > Date.now()) {
      return timestamp
    }
    this._cache.delete(key)
    return KEY_NOT_EXISTS
  }

  /**
   * @param {any} key
   * @returns {number} TTL in milliseconds
   */
  pttl (key) {
    const timestamp = this.pexpiretime(key)
    if (timestamp === KEY_NO_EXPIRY || timestamp === KEY_NOT_EXISTS) {
      return timestamp
    }
    return timestamp - Date.now()
  }

  /**
   * @param {any} key
   * @returns {number} FALSE: 0, TRUE: 1
   */
  persist (key) {
    if (this.pttl(key) <= 0) {
      return FALSE
    }
    this._cache.deleteExpiry(key)
    this._drain.write('persist', key)
    return TRUE
  }

  // ---- strings

  /**
   * @param {any} key
   * @param {string} value
   * @param {string | undefined} [type]
   * @param {undefined} [amount]
   * @returns {string|null} 'OK' on success; null on failure
   */
  set (key, value, type, amount) {
    let timestampMs
    const _type = type && String(type).toUpperCase()

    switch (_type) {
      case 'EX': {
        assertInteger(amount)
        timestampMs = Date.now() + (toNumber(amount) * 1000)
        break
      }
      case 'PX': {
        assertInteger(amount)
        timestampMs = Date.now() + toNumber(amount)
        break
      }
      case 'NX':
        if (this.exists(key)) {
          return null
        }
        break
      case 'XX':
        if (!this.exists(key)) {
          return null
        }
        break
      default:
        if (type) {
          throw new Error(ERR_SYNTAX)
        }
    }
    if (!(isString(value) || isNumber(value))) {
      throw new Error(ERR_TYPE)
    }
    this._cache.set(key, value)
    this._drain.write(SET, key, value)
    if (!isNil(timestampMs)) {
      // @ts-ignore
      this._cache.setExpiry(key, timestampMs)
      this._drain.write(PEXPIREAT, key, timestampMs)
    }
    return OK
  }

  /**
   * @param {any} key
   * @param {any} seconds
   * @param {any} value
   * @returns {string|null} 'OK' on success; null on failure
   */
  setex (key, seconds, value) {
    return this.set(key, value, 'EX', seconds)
  }

  /**
   * @param {any} key
   * @param {any} ms
   * @param {any} value
   * @returns {string|null} 'OK' on success; null on failure
   */
  psetex (key, ms, value) {
    return this.set(key, value, 'PX', ms)
  }

  /**
   * @param {any} key
   * @param {string} value
   * @returns {number} length of string
   */
  append (key, value) {
    const current = this.get(key)
    const str = '' + (current === null ? '' : current) + value
    this.set(key, str)
    return str.length
  }

  /**
   * @param {any} key
   * @param {number} offset
   * @param {string} value
   * @returns {number} length of string
   */
  setrange (key, offset, value) {
    const current = this.get(key)
    const str = ('' + (current === null ? '' : current)).padEnd(offset, '\u0000') + value
    this.set(key, str)
    return str.length
  }

  /**
   * @param {any[]} keyValues
   * @returns {string} always 'OK'
   */
  mset (...keyValues) {
    for (let i = 0; i < keyValues.length; i += 2) {
      const key = keyValues[i]
      const value = keyValues[i + 1]
      this._cache.set(key, value)
    }
    this._drain.write('mset', ...keyValues)
    return OK
  }

  /**
   * @param {any[]} keyValues
   * @returns {number} FALSE: 0, TRUE: 1
   */
  msetnx (...keyValues) {
    for (let i = 0; i < keyValues.length; i += 2) {
      const key = keyValues[i]
      if (this.exists(key)) {
        return FALSE
      }
    }
    this.mset(...keyValues)
    return TRUE
  }

  /**
   * @param {any} key
   * @returns {string|number|null}
   */
  get (key) {
    return (this.exists(key))
      ? this._cache.get(key, TYPE_STRING)
      : null
  }

  /**
   * @param {any} key
   * @returns {string|number|null}
   */
  getdel (key) {
    const value = this.get(key)
    if (value !== null) {
      this.del(key)
    }
    return value
  }

  /**
   * @param {any} key
   * @param {any} start
   * @param {any} end
   * @returns {string}
   */
  getrange (key, start, end) {
    assertInteger(start)
    assertInteger(end)

    const value = this.get(key)
    if (isNil(value)) {
      return ''
    }
    const _value = '' + value

    const fixLen = (/** @type {number} */ n, corr = 0) => (n >= 0 ? n : n + _value.length) + corr

    const _end = fixLen(toNumber(end), 1)
    const _start = fixLen(toNumber(start))

    const str = _value.substring(_start, _end)
    return str
  }

  /**
   * @param {any} key
   * @param {any} value
   * @return {string|number|null}
   */
  getset (key, value) {
    const oldValue = this.get(key)
    this.set(key, value)
    return oldValue
  }

  /**
   * @param {any[]} keys
   * @return {(string|number|null)[]}
   */
  mget (...keys) {
    return keys.map(key => this.get(key))
  }

  /**
   * @param {any} key
   * @returns {number}
   */
  strlen (key) {
    const value = this.get(key)
    return isNil(value)
      ? 0
      : String(value).length
  }

  /**
   * @param {any} key
   * @returns {number}
   */
  decr (key) {
    return this.incrbyfloat(key, -1)
  }

  /**
   * @param {any} key
   * @param {number} decrement
   * @returns {number}
   */
  decrby (key, decrement) {
    assertInteger(decrement)
    return this.incrbyfloat(key, -decrement)
  }

  /**
   * @param {any} key
   * @returns {number}
   */
  incr (key) {
    return this.incrbyfloat(key, 1)
  }

  /**
   * @param {any} key
   * @param {any} increment
   * @returns {number}
   */
  incrby (key, increment) {
    assertInteger(increment)
    return this.incrbyfloat(key, increment)
  }

  /**
   * @param {any} key
   * @param {number} increment
   * @returns {number}
   */
  incrbyfloat (key, increment) {
    let value = Number(this.get(key))
    const inc = Number(increment)
    if (isNaN(inc) || isNaN(value)) {
      throw new Error(ERR_NOT_INTEGER)
    }
    value += inc
    this._cache.set(key, value)
    this._drain.write(SET, key, value)
    return value
  }

  // --- hashes

  /**
   * @param {any} key
   * @param {number[]} fieldVals
   * @returns {number}
   */
  hset (key, ...fieldVals) {
    const obj = this.hgetall(key)
    let cnt = 0
    for (let i = 0; i < fieldVals.length; i += 2) {
      const prop = fieldVals[i]
      const value = fieldVals[i + 1]
      if (!(prop in obj)) cnt++
      obj[prop] = value
    }
    this._cache.set(key, obj)
    this._drain.write('hset', key, ...fieldVals)
    return cnt
  }

  /**
   * @param {any} key
   * @param {any} field
   * @param {any} value
   * @returns {number}
   */
  hsetnx (key, field, value) {
    const exists = this.hexists(key, field)
    if (exists) {
      return FALSE
    }
    return this.hset(key, field, value)
  }

  /**
   * @param {any} key
   * @param {string | number} field
   * @returns {string|number|null}
   */
  hget (key, field) {
    const obj = this.hgetall(key)
    const value = obj[field]
    return isNil(value) ? null : value
  }

  /**
   * @param {any} key
   * @param {any[]} fields
   * @returns {(string|number|null)[]}
   */
  hmget (key, ...fields) {
    const obj = this.hgetall(key)
    return fields.reduce((a, field) => {
      a.push((field in obj) ? obj[field] : null)
      return a
    }, [])
  }

  /**
   *
   * @param {any} key
   * @param {any[]} fieldVals
   * @returns {string} always 'OK'
   */
  hmset (key, ...fieldVals) {
    this.hset(key, ...fieldVals)
    return OK
  }

  /**
   * @param {any} key
   * @returns {object}
   */
  hgetall (key) {
    return (this.exists(key))
      ? this._cache.get(key, TYPE_HASH)
      : {}
  }

  /**
   * @param {any} key
   * @returns {string[]}
   */
  hkeys (key) {
    const obj = this.hgetall(key)
    return Object.keys(obj)
  }

  /**
   * @param {any} key
   * @returns {any[]}
   */
  hvals (key) {
    const obj = this.hgetall(key)
    return Object.values(obj)
  }

  /**
   * @param {any} key
   * @param {number} cursor
   * @param {any[]} args
   * @returns {[string, string[]]}
   */
  hscan (key, cursor, ...args) {
    cursor = Number(cursor)
    assertInteger(cursor)

    const obj = this.hgetall(key)
    const parsed = parseScanArgs(args)
    const results = []

    for (const key of Object.keys(obj)) {
      if (parsed.matcher(key)) {
        results.push(key)
      }
    }

    return ['0', results]
  }

  /**
   * @param {any} key
   * @returns {number}
   */
  hlen (key) {
    const obj = this.hgetall(key)
    return Object.keys(obj).length
  }

  /**
   * @param {any} key
   * @param {any[]} fields
   * @returns {number}
   */
  hdel (key, ...fields) {
    const obj = this.hgetall(key)
    let cnt = 0
    fields.forEach(field => {
      if (field in obj) {
        cnt++
        delete obj[field]
      }
    })
    this._cache.set(key, obj)
    this._drain.write('hdel', key, ...fields)
    return cnt
  }

  /**
   * @param {any} key
   * @param {string} field
   * @returns {number} FALSE: 0, TRUE: 1
   */
  hexists (key, field) {
    const obj = this.hgetall(key)
    return (field in obj)
      ? TRUE
      : FALSE
  }

  /**
   * @param {any} key
   * @param {any} field
   * @param {number} increment
   * @returns {number}
   */
  hincrby (key, field, increment) {
    let value = this.hexists(key, field)
      ? Number(this.hget(key, field))
      : 0
    if (isNaN(increment)) {
      throw new Error(ERR_NOT_INTEGER)
    }
    if (isNaN(value)) {
      throw new Error(ERR_HASH_INTEGER)
    }
    value += Number(increment)
    this.hset(key, field, value)
    return value
  }

  /**
   * @param {any} key
   * @param {any} field
   * @param {number} increment
   * @returns {number}
   */
  hincrbyfloat (key, field, increment) {
    let value = this.hexists(key, field)
      ? Number(this.hget(key, field))
      : 0
    if (isNaN(increment)) {
      throw new Error(ERR_VALUE_FLOAT)
    }
    if (isNaN(value)) {
      throw new Error(ERR_HASH_FLOAT)
    }
    value += Number(increment)
    this.hset(key, field, value)
    return value
  }

  /**
   * @param {any} key
   * @param {any} field
   * @returns {number}
   */
  hstrlen (key, field) {
    const value = this.hget(key, field)
    return (isNil(value))
      ? 0
      : String(value).length
  }

  // --- pubsub

  /**
   * @param  {...string} patterns
   */
  psubscribe (...patterns) {
    this._pubsub.pSubscribe(this._client, patterns)
  }

  /**
   * @param {string} channel
   * @param {string} message
   * @returns {number}
   */
  publish (channel, message) {
    return this._pubsub.publish(channel, message)
  }

  /**
   * @throws {Error}
   * @param {string} subcmd
   * @param  {...any} args
   * @returns {number|string[]|(number|string)[]|Error}
   */
  pubsub (subcmd, ...args) {
    subcmd = (subcmd || '').toLowerCase()

    switch (subcmd) {
      case 'channels':
        return this._pubsub.getChannels(args)
      case 'numsub':
        return this._pubsub.getSubscribers(args).flat()
      case 'numpat':
        return this._pubsub.getNumpat()
      default:
        throw this.unknownSubCommand('pubsub', subcmd)
    }
  }

  /**
   * @param  {...string} patterns
   */
  punsubscribe (...patterns) {
    this._pubsub.pUnsubscribe(this._client, patterns)
  }

  /**
   * @param  {...string} channels
   */
  subscribe (...channels) {
    this._pubsub.subscribe(this._client, channels)
  }

  /**
   * @param  {...string} channels
   */
  unsubscribe (...channels) {
    this._pubsub.unsubscribe(this._client, channels)
  }

  // --- list

  /**
   * @param {string} key
   * @param {number} index
   * @returns {string|null}
   */
  lindex (key, index) {
    const _index = Number(index)
    assertInteger(_index)
    const list = this._cache.get(key, TYPE_LIST)
    if (!list) return null
    const pos = normNegativeIndex(_index, list.length)
    return list[pos] ?? null
  }

  /**
   * @param {string} key
   * @returns {number}
   */
  llen (key) {
    const list = this._cache.get(key, TYPE_LIST)
    return list ? list.length : 0
  }

  /**
   * @param {string} key
   * @param {number} [count]
   * @returns {string[]|null}
   */
  lpop (key, count) {
    const _count = Number(count || 1)
    assertInteger(_count)
    const list = this._cache.get(key, TYPE_LIST)
    if (!list) return null
    const out = []
    const size = Math.min(list.length, _count)
    for (let i = 0; i < size; i++) {
      out.push(list.shift() ?? null)
    }
    list.length ? this._cache.set(key, list) : this._cache.delete(key)
    return _count === 1 ? out[0] : out
  }

  lpos (key, element, ...args) {
    const transform = (v) => {
      assertInteger(v)
      return Number(v)
    }
    let { rank = 1, count = 1, maxlen } = subarguments(args, transform)

    if (count < 0) throw new Error("ERR COUNT can't be negative")
    if (maxlen < 0) throw new Error("ERR MAXLEN can't be negative")
    if (rank === 0) throw new Error("ERR RANK can't be zero: use 1 to start from the first match, 2 from the second ... or use negative to start from the end of the list")

    const list = this._cache.get(key, TYPE_LIST)
    if (!list) return null

    count = Math.min(list.length, count || list.length)
    maxlen = Math.min(list.length, maxlen || list.length)
    let rankCount = Math.abs(rank)
    const isCountOne = count === 1

    const pos = []

    if (rank < 0) {
      let i = maxlen
      while (i > 0 && count > 0) {
        i -= 1
        const el = list[i]
        if (el === element) {
          rankCount -= 1
          if (rankCount <= 0) {
            pos.push(i)
            count -= 1
          }
        }
      }
    } else {
      let i = 0
      while (i < maxlen && count > 0) {
        const el = list[i]
        if (el === element) {
          rankCount -= 1
          if (rankCount <= 0) {
            pos.push(i)
            count -= 1
          }
        }
        i += 1
      }
    }

    return isCountOne ? pos[0] ?? null : pos
  }

  /**
   * @param {string} key
   * @param {string[]} elements
   * @returns {number}
   */
  lpush (key, ...elements) {
    const list = this._cache.get(key, TYPE_LIST) || new Array(0)
    for (const element of elements) {
      list.unshift(element)
    }
    this._cache.set(key, list)
    return list.length
  }

  /**
   * @param {string} key
   * @param {string[]} elements
   * @returns {number}
   */
  lpushx (key, ...elements) {
    const list = this._cache.get(key, TYPE_LIST)
    return list ? this.lpush(key, ...elements) : 0
  }

  /**
   * @param {string} key
   * @param {number} start
   * @param {number} stop
   */
  lrange (key, start, stop) {
    const list = this._cache.get(key, TYPE_LIST)
    const [_start, _stop] = lrangeStartStop(start, stop, list?.length)
    if (!list || _start === undefined) return []
    return list.slice(_start, _stop)
  }

  /**
   * @param {string} key
   * @param {number} count
   * @param {*} element
   */
  lrem (key, count, element) {
    assertInteger(count)
    const list = this._cache.get(key, TYPE_LIST)

    let newList = []
    let removed = 0
    if (count > 0) {
      // Remove elements equal to element moving from tail to head.
      let i = 0
      while (i < list.length && count > 0) {
        const el = list[i]
        if (el !== element) {
          newList.push(el)
        } else {
          removed++
          count--
        }
        i += 1
      }
      newList = newList.concat(list.slice(i))
    } else if (count < 0) {
      // Remove elements equal to element moving from tail to head.
      let i = list.length
      while (i > 0 && count < 0) {
        i -= 1
        const el = list[i]
        if (el !== element) {
          newList.unshift(el)
        } else {
          removed++
          count++
        }
      }
      newList = list.slice(0, i).concat(newList)
    } else {
      // Remove all elements equal to element
      for (let i = 0; i < list.length; i++) {
        const el = list[i]
        if (el !== element) {
          newList.push(el)
        } else {
          removed++
        }
      }
    }

    newList.length ? this._cache.set(key, newList) : this._cache.delete(key)
    return removed
  }

  /**
   * @param {string} key
   * @param {number} index
   * @param {string} element
   * @returns {string}
   */
  lset (key, index, element) {
    assertInteger(index)
    const list = this._cache.get(key, TYPE_LIST)
    index = normNegativeIndex(Number(index), list?.length)
    if (!list || index >= list.length) {
      throw new Error(ERR_RANGE)
    }
    list.splice(index, 1, element)
    list.length ? this._cache.set(key, list) : this._cache.delete(key)
    return OK
  }

  /**
   * @param {string} key
   * @param {number} start
   * @param {number} stop
   */
  ltrim (key, start, stop) {
    const list = this.lrange(key, start, stop)
    list.length ? this._cache.set(key, list) : this._cache.delete(key)
    return OK
  }

  /**
   * @param {string} key
   * @param {number} [count]
   * @returns {string[]|null}
   */
  rpop (key, count) {
    const _count = Number(count || 1)
    assertInteger(_count)
    const list = this._cache.get(key, TYPE_LIST)
    if (!list) {
      return null
    }
    const out = []
    const size = Math.min(list.length, _count)
    for (let i = 0; i < size; i++) {
      out.push(list.pop() ?? null)
    }
    list.length ? this._cache.set(key, list) : this._cache.delete(key)
    return _count === 1 ? out[0] : out
  }

  /**
   * @param {string} key
   * @param {string[]} elements
   * @returns {number}
   */
  rpush (key, ...elements) {
    const list = this._cache.get(key, TYPE_LIST) || new Array(0)
    for (const element of elements) {
      list.push(element)
    }
    this._cache.set(key, list)
    return list.length
  }

  /**
   * @param {string} key
   * @param {string[]} elements
   * @returns {number}
   */
  rpushx (key, ...elements) {
    const list = this._cache.get(key, TYPE_LIST)
    return list ? this.rpush(key, ...elements) : 0
  }
}

module.exports = {
  Commands
}
