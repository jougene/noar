const assert = require('assert')
const _ = require('lodash')

const camelizeKeys = (obj) => {
  return Object.entries(obj).reduce((acc, [k, v]) => {
    acc[_.camelCase(k)] = v

    return acc
  }, {})
}

const snakeizeKeys = (obj) => {
  return Object.entries(obj).reduce((acc, [k, v]) => {
    acc[_.snakeCase(k)] = v

    return acc
  }, {})
}

assert.instanceOf = (actual, klass) => {
  assert.equal(actual.constructor.name, klass.name, `
    ${actual} is not instance of ${klass}
  `)
}

assert.count = (array, count) => {
  assert.equal(array.length, count)
}

module.exports = { assert, camelizeKeys, snakeizeKeys }
