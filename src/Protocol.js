/*!
 * @copyright 2014 Justin Freitag <justin.freitag@gmail.com>
 * @copyright 2021 commenthol <commenthol@gmail.com>
 * @credits https://github.com/justinfreitag-zz/node-redis-protocol
 * @license MIT
 */
/**
 * Implements the Redis RESP2 Protocol
 * @see https://redis.io/topics/protocol
 */

const EventEmitter = require('events')
const {
  isNil,
  isInteger,
  isString,
  isArray,
  isObject
} = require('./utils.js')

const CRLF = '\r\n'

const NIL = '$-1' + CRLF

// This is not valid for simpleStrings
function copyString (buffer, length, offsetBegin, offsetEnd) {
  if (length > 2048) {
    return buffer.toString('utf-8', offsetBegin, offsetEnd)
  }

  let string = ''
  while (offsetBegin < offsetEnd) {
    string += String.fromCharCode(buffer[offsetBegin++])
  }
  return string
}

// This is not UTF-8 compliant
function parseSimpleString (parser) {
  let offset = parser.offset
  const length = parser.buffer.length
  let string = ''

  while (offset < length) {
    const c1 = parser.buffer[offset++]
    if (c1 === 13) {
      const c2 = parser.buffer[offset++]
      if (c2 === 10) {
        parser.offset = offset
        return string
      }
      string += String.fromCharCode(c1) + String.fromCharCode(c2)
      continue
    }
    string += String.fromCharCode(c1)
  }
  return undefined
}

function parseLength (parser) {
  const string = parseSimpleString(parser)
  if (string !== undefined) {
    const length = parseInt(string, 10)
    if (length === -1) {
      return null
    }
    return length
  }
}

function parseBulkString (parser) {
  const length = parseLength(parser)
  /* jshint eqnull: true */
  if (length == null) {
    return length
  }
  const offsetEnd = parser.offset + length
  if ((offsetEnd + 2) > parser.buffer.length) {
    return
  }

  const offsetBegin = parser.offset
  parser.offset = offsetEnd + 2

  return copyString(parser.buffer, length, offsetBegin, offsetEnd)
}

function parseArray (parser) {
  const length = parseLength(parser)
  /* jshint eqnull: true */
  if (length == null) {
    return length
  }

  const responses = new Array(length)
  const bufferLength = parser.buffer.length
  for (let i = 0; i < length; i++) {
    if (parser.offset >= bufferLength) {
      return
    }
    const response = parseType(parser, parser.buffer[parser.offset++])
    if (response === undefined) {
      return
    }
    responses[i] = response
  }

  return responses
}

function parseInteger (parser) {
  const string = parseSimpleString(parser)
  if (string !== undefined) {
    return parseInt(string, 10)
  }
}

function parseError (parser) {
  const string = parseSimpleString(parser)
  if (string !== undefined) {
    return new Error(string)
  }
}

function handleError (parser, error) {
  /* c8 ignore next 3 */
  if (!parser.emit('error', error)) {
    throw error
  }
}

function parseType (parser, type) {
  switch (type) {
    case 43: // +
      return parseSimpleString(parser)
    case 36: // $
      return parseBulkString(parser)
    case 42: // *
      return parseArray(parser)
    case 58: // :
      return parseInteger(parser)
    case 45: // -
      return parseError(parser)
    default:
      return handleError(parser, new Error('Unexpected type: ' + type))
  }
}

function appendBuffer (parser, buffer) {
  const oldLength = parser.buffer.length
  const remainingLength = oldLength - parser.offset
  const newLength = remainingLength + buffer.length
  if (newLength > parser.options.maxBufferLength) {
    handleError(parser, new Error('Maximum buffer length exceeded'))
    return
  }
  const newBuffer = Buffer.alloc(newLength)
  parser.buffer.copy(newBuffer, 0, parser.offset, oldLength)
  buffer.copy(newBuffer, remainingLength, 0, buffer.length)
  parser.buffer = newBuffer
  parser.offset = 0
}

function createSimpleStringResp (str) {
  if (isNil(str) || ('' + str).indexOf(CRLF) !== -1) {
    throw new Error(`not a simple string "${str}"`)
  }
  const data = '+' + str + CRLF
  return data
}

function createErrorResp (err) {
  if (!err.message) {
    throw new Error('not an error')
  }
  const data = '-' + err.message + CRLF
  return data
}

function createIntegerResp (num) {
  if (isNaN(num) || num !== Math.floor(num)) {
    throw new Error(`not an integer "${num}"`)
  }
  const data = ':' + num + CRLF
  return data
}

function createBulkStringResp (args) {
  const str = args.join(CRLF)
  const data = '$' + str.length + CRLF + str + CRLF
  return data
}

function createArrayResp (args) {
  const data = ['*' + args.length + CRLF]

  args.forEach(arg => {
    if (arg === null) {
      data.push(NIL)
    } else if (isString(arg)) {
      data.push('$' + arg.length + CRLF + arg + CRLF)
    } else if (isInteger(arg)) {
      data.push(createIntegerResp(arg))
    } else if (isArray(arg)) {
      data.push(createArrayResp(arg))
    } else {
      const string = '' + arg
      data.push('$' + string.length + CRLF + string + CRLF)
    }
  })

  return data.join('')
}

function createSimpleArrayResp (args) {
  return ['*' + args.length + CRLF].concat(args).join('')
}

function createObjectResp (obj) {
  return createArrayResp(Object.entries(obj).flat())
}

class ResponseData {
  constructor (data, fn) {
    this.data = data
    this.fn = fn
  }

  toString () {
    return this.fn
      ? this.fn(this.data)
      : this.data
  }
}

function writeResponse (data) {
  if (data instanceof ResponseData) {
    return data.toString()
  } else if (data === null) {
    return NIL
  } else if (isInteger(data)) {
    return createIntegerResp(data)
  } else if (isArray(data)) {
    return createArrayResp(data)
  } else if (data instanceof Error) {
    return createErrorResp(data)
  } else if (isObject(data)) {
    return createObjectResp(data)
  } else {
    return createSimpleStringResp(data)
  }
}

const DEFAULT_OPTIONS = {
  maxBufferLength: 16777216
}

class RequestParser extends EventEmitter {
  constructor (options) {
    super()
    this.options = Object.assign(DEFAULT_OPTIONS, options)

    this.buffer = null
    this.offset = 0
  }

  parse (buffer) {
    if (this.buffer === null) {
      this.buffer = buffer
      this.offset = 0
    } else {
      appendBuffer(this, buffer)
    }

    const length = this.buffer.length
    while (this.offset < length) {
      const offset = this.offset
      const request = parseType(this, this.buffer[this.offset++])
      if (request === undefined) {
        this.offset = offset
        return
      }

      this.emit('request', request)
    }

    this.buffer = null
  }
}
RequestParser.DEFAULT_OPTIONS = DEFAULT_OPTIONS

module.exports = {
  NIL,
  createSimpleStringResp,
  createErrorResp,
  createIntegerResp,
  createBulkStringResp,
  createArrayResp,
  createObjectResp,
  createSimpleArrayResp,
  ResponseData,
  writeResponse,
  RequestParser
}
