/**
 * @credits https://github.com/justinfreitag-zz/node-redis-protocol
 * @license MIT
 */

// @ts-nocheck

const assert = require('assert/strict')
const {
  NIL,
  RequestParser,
  createArrayResp,
  createSimpleArrayResp,
  createSimpleStringResp,
  createErrorResp,
  createIntegerResp,
  createBulkStringResp,
  createObjectResp
} = require('../src/index.js')

describe('Protocol', function () {
  describe('createArrayResp', function () {
    it('should toString() non-string args', function () {
      assert.strictEqual(
        createArrayResp(['FOO', 42]),
        '*2\r\n$3\r\nFOO\r\n:42\r\n')
      assert.strictEqual(
        createArrayResp(['FOO', '42']),
        '*2\r\n$3\r\nFOO\r\n$2\r\n42\r\n')
      assert.strictEqual(
        createArrayResp(['FOO', {}]),
        createArrayResp(['FOO', '[object Object]']))
      assert.strictEqual(
        createArrayResp(['FOO', []]),
        '*2\r\n$3\r\nFOO\r\n*0\r\n')
      assert.strictEqual(
        createArrayResp(['FOO', '']),
        '*2\r\n$3\r\nFOO\r\n$0\r\n\r\n')
    })
    it('shall create string from values', function () {
      assert.strictEqual(
        createArrayResp(['str', 10000, true]),
        '*3\r\n$3\r\nstr\r\n:10000\r\n$4\r\ntrue\r\n'
      )
    })
  })

  describe('createObjectResp', function () {
    it('shall convert object', function () {
      const obj = {
        server: 'redis',
        version: '6.2.6',
        proto: 2,
        id: 19,
        mode: 'standalone',
        role: 'master',
        modules: []
      }
      assert.strictEqual(
        createObjectResp(obj),
        '*14\r\n$6\r\nserver\r\n$5\r\nredis\r\n$7\r\nversion\r\n$5\r\n6.2.6\r\n$5\r\nproto\r\n:2\r\n$2\r\nid\r\n:19\r\n$4\r\nmode\r\n$10\r\nstandalone\r\n$4\r\nrole\r\n$6\r\nmaster\r\n$7\r\nmodules\r\n*0\r\n'
      )
    })
  })

  describe('createSimpleStringResp', function () {
    it('a string', function () {
      assert.strictEqual(
        createSimpleStringResp('foobar'),
        '+foobar\r\n'
      )
    })
    it('shall throw if contains CRLF', function () {
      assert.throws(() => {
        createSimpleStringResp('foo\r\nbar')
      }, /not a simple string "foo\r\nbar"/)
    })
  })

  describe('createErrorResp', function () {
    it('with error', function () {
      assert.strictEqual(
        createErrorResp(new Error('ERR foobar')),
        '-ERR foobar\r\n'
      )
    })
    it('with type error', function () {
      assert.strictEqual(
        createErrorResp(new TypeError('WRONGTYPE foobar')),
        '-WRONGTYPE foobar\r\n'
      )
    })
    it('shall throw if not an error', function () {
      assert.throws(() => {
        createErrorResp('foo\r\nbar')
      }, /not an error/)
    })
  })

  describe('createIntegerResp', function () {
    it('a string', function () {
      assert.strictEqual(
        createIntegerResp(1704),
        ':1704\r\n'
      )
    })
    it('shall throw if not string', function () {
      assert.throws(() => {
        createIntegerResp('foo\r\nbar')
      }, /not an integer "foo\r\nbar"/)
    })
    it('shall throw if float', function () {
      assert.throws(() => {
        createIntegerResp(3.1415)
      }, /not an integer "3.1415"/)
    })
  })

  describe('createBulkStringResp', function () {
    it('a string', function () {
      assert.strictEqual(
        createBulkStringResp(['one', 'two', 'three']),
        '$15\r\none\r\ntwo\r\nthree\r\n'
      )
    })
  })

  describe('createSimpleArrayResp', function () {
    it('shall create a simple array', function () {
      const arr = [
        NIL,
        createIntegerResp(12),
        createSimpleStringResp('OK')
      ]
      assert.strictEqual(
        createSimpleArrayResp(arr),
        '*3\r\n$-1\r\n:12\r\n+OK\r\n'
      )
    })
  })

  describe('RequestParser', function () {
    /**
     * @type {RequestParser}
     */
    let parser

    beforeEach(function () {
      parser = new RequestParser()
    })

    it('should respond with error', function (done) {
      parser.once('request', function (request) {
        assert(request instanceof Error)
        done()
      })
      parser.parse(Buffer.from('-Error message\r\n'))
    })

    it('should handle internal error', function (done) {
      parser.once('error', function (request) {
        assert(request instanceof Error)
        done()
      })
      parser.parse(Buffer.from('Bad message\r\n'))
    })

    it('should respond with number', function (done) {
      parser.once('request', function (request) {
        assert.equal(request, 42)
        done()
      })
      parser.parse(Buffer.from(':42\r\n'))
    })

    it('should dereference parser buffer', function (done) {
      parser.once('request', function () {
        done()
      })
      parser.parse(Buffer.from('+FOO\r\n'))
      assert.equal(parser.buffer, null)
    })

    it('should handle chunked data', function (done) {
      parser.once('request', function (request) {
        assert.equal(request[0], 'OK')
        assert.equal(request[1], 'FOO')
        assert.equal(request[2], 42)
        assert.equal(request[3], 'BAR')
        assert.equal(request[4].message, 'OH')
        done()
      })
      parser.parse(Buffer.from('*5\r\n+O'))
      parser.parse(Buffer.from('K\r\n$3\r\n'))
      parser.parse(Buffer.from('FOO\r\n:4'))
      parser.parse(Buffer.from('2\r\n$'))
      parser.parse(Buffer.from('3\r\nBAR\r\n-'))
      parser.parse(Buffer.from('OH\r\n'))
    })

    it('should handle chunked array elements', function (done) {
      parser.once('request', function (request) {
        assert.equal(request[0], 'OK')
        assert.equal(request[1], 'FOO')
        assert.equal(request[2], 42)
        done()
      })
      parser.parse(Buffer.from('*3\r\n+OK\r\n'))
      parser.parse(Buffer.from('$3\r\nFOO\r\n:42\r\n'))
    })

    it('should handle termination characters', function (done) {
      parser.once('request', function (request) {
        assert.equal(request[0], '\rFOO')
        assert.equal(request[1], '\r')
        done()
      })
      parser.parse(Buffer.from('*2\r\n+\rFOO\r\n$1\r\n\r\r\n'))
    })

    it('should respond with array', function (done) {
      parser.once('request', function (request) {
        assert.equal(request[0], 'OK')
        assert.equal(request[1], 'FOO')
        done()
      })
      parser.parse(Buffer.from('*2\r\n+OK\r\n$3\r\nFOO\r\n'))
    })

    it('should handle null array', function (done) {
      parser.once('request', function (request) {
        assert.equal(request, null)
        done()
      })
      parser.parse(Buffer.from('*-1\r\n'))
    })

    it('should handle null bulk string', function (done) {
      parser.once('request', function (request) {
        assert.equal(request, null)
        done()
      })
      parser.parse(Buffer.from('$-1\r\n'))
    })

    it('should handle large bulk string', function (done) {
      const string = new Array(2048).join('FOO')
      parser.once('request', function (request) {
        assert.equal(request, string)
        done()
      })
      parser.parse(Buffer.from('$' + string.length + '\r\n' + string + '\r\n'))
    })

    it('should throw unexpected type error', function () {
      parser.once('request', function () {
        assert.fail()
      })
      assert.throws(function () {
        parser.parse(Buffer.from('FOO\r\n'))
      })
    })

    it('should emit unexpected type error', function (done) {
      parser.once('request', function () {
        assert.fail()
      })
      parser.once('error', function (error) {
        assert(error instanceof Error)
        done()
      })
      parser.parse(Buffer.from('*2\r\nFOO\r\n$3\r\nBAR\r\n'))
    })

    it('should throw buffer length error', function () {
      parser = new RequestParser({ maxBufferLength: 5 })
      parser.once('request', function () {
        assert.fail()
      })
      assert.throws(function () {
        parser.parse(Buffer.from('+FOO'))
        parser.parse(Buffer.from('BAR\r\n'))
      })
    })

    it('should emit buffer length error', function (done) {
      parser = new RequestParser({ maxBufferLength: 5 })
      parser.once('request', function () {
        assert.fail()
      })
      parser.once('error', function (error) {
        assert(error instanceof Error)
        done()
      })
      parser.parse(Buffer.from('+FOO'))
      parser.parse(Buffer.from('BAR\r\n'))
    })
  })
})
