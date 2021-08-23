const assert = require('assert')
const {
  isMatch
} = require('../src/utils.js')

const { strictEqual } = assert

describe('utils', function () {
  /*
   * @see https://redis.io/commands/psubscribe
   * Supported glob-style patterns:
   * - h?llo subscribes to hello, hallo and hxllo
   * - h*llo subscribes to hllo and heeeello
   * - h[ae]llo subscribes to hello and hallo, but not hillo
   */
  describe('isMatch', function () {
    const assertMatches = (pattern, tests) => {
      const match = isMatch(pattern)
      tests.forEach(([str, exp]) => {
        it(str || 'empty', function () {
          strictEqual(match(str), !!exp)
        })
      })
    }

    describe('*', function () {
      assertMatches('*', [
        ['', 0],
        ['foo', 1],
        ['foo*bar', 1]
      ])
    })
    describe('single char h?llo', function () {
      assertMatches('h?llo', [
        ['', 0],
        ['hello', 1],
        ['hallo', 1],
        ['hxllo', 1],
        ['hllo', 0]
      ])
    })
    describe('contains h*llo', function () {
      assertMatches('h*llo', [
        ['', 0],
        ['hllo', 1],
        ['heeeello', 1],
        ['helo', 0]
      ])
    })
    describe('brackets h[ae]llo', function () {
      assertMatches('h[ae]llo', [
        ['', 0],
        ['hello', 1],
        ['hallo', 1],
        ['hillo', 0]
      ])
    })
    describe('startsWith foo*', function () {
      assertMatches('foo*', [
        ['', 0],
        ['foo', 1],
        ['foo*bar', 1],
        ['afob', 0],
        ['afoo', 0]])
    })
    describe('endsWith *foo', function () {
      assertMatches('*foo', [
        ['', 0],
        ['foo', 1],
        ['foo*bar', 0],
        ['afob', 0],
        ['afoo', 1]])
    })
    describe('contains *foo*', function () {
      assertMatches('*foo*', [
        ['', 0],
        ['foo', 1],
        ['foo*bar', 1],
        ['afob', 0],
        ['afoo', 1],
        ['afoob', 1],
        ['afOob', 0]])
    })
    describe('complex *foo*bar*', function () {
      assertMatches('*foo*bar*', [
        ['', 0],
        ['foo', 0],
        ['foo*bar', 1],
        ['la_foo*bar', 1],
        ['afob', 0],
        ['afoo', 0],
        ['afoob', 0],
        ['afOob', 0]
      ])
    })
    describe('nonegate *!(foo)*bar', function () {
      assertMatches('*!(foo)*bar', [
        ['', 0],
        ['foo', 0],
        ['foo*bar', 0],
        ['a!(foo)*bar', 1],
        ['afob', 0],
        ['afoo', 0],
        ['afoob', 0],
        ['afOob', 0]
      ])
    })
    describe('escaping', function () {
      assertMatches('h\\?llo', [
        ['', 0],
        ['h?llo', 1],
        ['hallo', 0],
        ['hxllo', 0]
      ])
      assertMatches('h\\*llo', [
        ['', 0],
        ['h*llo', 1],
        ['hallo', 0],
        ['hxllo', 0]
      ])
      assertMatches('h\\[ll\\]o', [
        ['', 0],
        ['h[ll]o', 1],
        ['hallo', 0],
        ['hxllo', 0]
      ])
    })
  })
})
