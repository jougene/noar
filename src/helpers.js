const _ = require('lodash')

const camelizeKeys = (obj) => {
  return Object.entries(obj).reduce((acc, [k, v]) => {
    acc[_.camelCase(k)] = v

    return acc
  }, {})
}

const mapFromSnakeCase = (item) => {
  if (!_.isObject(item)) {
    return item
  }
  const plainKeys = Object.keys(item).filter(k => !k.includes('__'))
  const relationsKeys = Object.keys(item).filter(k => k.includes('__'))

  const grouped = _.groupBy(relationsKeys, k => {
    const [name] = k.split('__')

    return name
  })

  const relations = Object.entries(grouped).reduce((acc, [name, keys]) => {
    const values = keys.reduce((acc, key) => {
      const [, cleanedKey] = key.split('__')
      return { ...acc, [cleanedKey]: item[key] }
    }, {})
    return { [name]: camelizeKeys(values) }
  }, {})

  return { ...camelizeKeys(_.pick(item, plainKeys)), ...relations }
}

const postProcessResponse = (result, queryContext) => {
  if (queryContext?.system) {
    return result
  }

  if (!Array.isArray(result)) {
    return mapFromSnakeCase(result)
  } else {
    return result.map(item => {
      return mapFromSnakeCase(item)
    })
  }
}

module.exports = { camelizeKeys, postProcessResponse }
