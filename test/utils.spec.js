const assert = require('assert')
const {
  isMatch
} = require('../src/utils.js')

const { strictEqual } = assert

describe('utils', function () {
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
      assertMatches('*', [['', 0], ['foo', 1], ['foo*bar', 1]])
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
    describe('contains *foo*', function () {
      assertMatches('*foo*', [
        ['', 0],
        ['foo', 1],
        ['.foo', 1],
        ['foo*bar', 1],
        ['afob', 0],
        ['afoo', 1],
        ['afoob', 1],
        ['afOob', 0]
      ])
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
    describe('brackets [af]o*', function () {
      assertMatches('[af]o*', [
        ['', 0],
        ['foo', 1],
        ['foo*bar', 1],
        ['a!(foo)*bar', 0],
        ['aob', 1],
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
  })
})
