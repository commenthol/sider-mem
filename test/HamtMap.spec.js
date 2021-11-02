const assert = require('assert')
const { HamtMap } = require('../src/index.js')
const { strictEqual, deepStrictEqual } = assert

describe('HamtMap', function () {
  let hash

  it('set', function () {
    hash = new HamtMap()
    for (let i = 0; i < 10; i++) {
      hash.set(i, 'v' + i)
    }
  })
  it('get', function () {
    const arr = []
    for (let i = 0; i < 10; i++) {
      arr.push(hash.get(i))
    }
    deepStrictEqual(arr, ['v0', 'v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7', 'v8', 'v9'])
  })
  it('has', function () {
    strictEqual(hash.has(5), true)
    strictEqual(hash.has('a'), false)
  })
  it('size', function () {
    strictEqual(hash.size, 10)
  })
  it('keys', function () {
    deepStrictEqual([...hash.keys()], [0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  })
  it('keys iterator', function () {
    const arr = []
    const iterator = hash.keys()
    while (true) {
      const { done, value } = iterator.next()
      if (done) break
      arr.push(value)
    }
    deepStrictEqual(arr, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  })
  it('values', function () {
    deepStrictEqual([...hash.values()], ['v0', 'v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7', 'v8', 'v9'])
  })
  it('values iterator', function () {
    const arr = []
    const iterator = hash.values()
    while (true) {
      const { done, value } = iterator.next()
      if (done) break
      arr.push(value)
    }
    deepStrictEqual(arr, ['v0', 'v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7', 'v8', 'v9'])
  })
  it('delete', function () {
    strictEqual(hash.delete(5), true)
    strictEqual(hash.has(5), false)
    strictEqual(hash.delete('a'), false)
  })
  it('forEach iterator', function () {
    const arr = []
    for (const kv of hash) {
      arr.push(kv)
    }
    deepStrictEqual(arr, [
      [0, 'v0'],
      [1, 'v1'],
      [2, 'v2'],
      [3, 'v3'],
      [4, 'v4'],
      [6, 'v6'],
      [7, 'v7'],
      [8, 'v8'],
      [9, 'v9']
    ])
  })
  it('iterator.next', function () {
    const arr = []
    const iterator = hash[Symbol.iterator]()
    while (true) {
      const { done, value } = iterator.next()
      if (done) break
      arr.push(value)
    }
    deepStrictEqual(arr, [
      [0, 'v0'],
      [1, 'v1'],
      [2, 'v2'],
      [3, 'v3'],
      [4, 'v4'],
      [6, 'v6'],
      [7, 'v7'],
      [8, 'v8'],
      [9, 'v9']
    ])
  })
})
