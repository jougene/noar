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

module.exports = { camelizeKeys, snakeizeKeys }
