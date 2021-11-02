/**
 * @module Persistence
 * @copyright 2021 commenthol <commenthol@gmail.com>
 * @license MIT
 */

const fs = require('fs')
const { pipeline } = require('stream/promises')
const { Transform } = require('stream')
const { Commands } = require('./Commands.js')
const { RequestParser, createArrayResp } = require('./Protocol.js')
const { logger } = require('./log.js')

/** @typedef {import('./Cache.js').Cache} Cache */

/**
 * @type {{
 *   error: (...args: any[]) => void,
 *   warn: (...args: any[]) => void,
 *   info: (...args: any[]) => void,
 *   debug: (...args: any[]) => void
 * }}
 */
let log

/**
 * Noop drain for import of keys from file
 * @private
 */
class DrainNoop {
  write () {}
}

/**
 * implements a append only filestore (AOF)
 */
class Persistence {
  /**
   * @param {{ filename: string|undefined, cache: Cache }} param0
   */
  constructor ({ filename, cache }) {
    log = logger('persistance')
    this._filename = filename
    this._cache = cache
    this._fsStream = null
    if (!this._filename) {
      this.write = () => {}
    } else {
      this._fsStream = fs.createWriteStream(this._filename, { flags: 'a+' })
    }
  }

  async load () {
    const filename = this._filename
    if (!filename) return

    const parser = new RequestParser()
    // @ts-ignore
    const commands = new Commands({ drain: new DrainNoop(), cache: this._cache })

    parser.on('request', req => {
      const [cmd, ...args] = req
      commands.handleCommand(cmd, args).catch(err => {
        log.error('%s for "%s" "%s"', err.message, cmd, args)
      })
    })

    const parseStream = new Transform({
      transform: (data, enc, done) => {
        try {
          parser.parse(data)
        } catch (/** @type {any} */err) {
          log.error('ERRPARSE %s', err.message)
        }
        done()
      },
      flush: (done) => {
        setTimeout(async () => {
          done()
        }, 10)
      }
    })

    log.info('loading file %s', filename)

    const readStream = fs.createReadStream(filename, { flags: 'a+' })
    await pipeline(readStream, parseStream)

    log.info('finished loading file %s', filename)
  }

  /**
   * @param {string} cmd
   * @param  {...any} args
   */
  write (cmd, ...args) {
    const str = createArrayResp([cmd, ...args])
    // @ts-ignore
    this._fsStream.write(str)
  }
}

module.exports = {
  Persistence
}
