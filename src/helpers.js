const _ = require('lodash')

const camelizeKeys = (obj) => {
  return Object.entries(obj).reduce((acc, [k, v]) => {
    acc[_.camelCase(k)] = v

    return acc
  }, {})
}

const mapSingleFromSnakeCase = (item, model) => {
  const Model = model

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

  return new Model({ ...camelizeKeys(_.pick(item, plainKeys)), ...relations })
}

const mapper = (result, { model }) => {
  if (!Array.isArray(result)) {
    return mapSingleFromSnakeCase(result, model)
  } else {
    const camelCased = result.map(item => {
      return mapSingleFromSnakeCase(item, model)
    })

    const merged = camelCased.reduce((acc, item) => {
      const existed = acc.find(a => a.id === item.id)
      if (existed) {
        model.relationNames.forEach(name => {
          if (existed[name]) {
            existed[name] = [].concat(existed[name], item[name])
          }
        })
      } else {
        acc.push(item)
      }

      return acc
    }, [])

    return merged
  }
}

const processors = [
  mapper
  // mergeToOne,
  // mapToModel
]

const postProcessResponse = (result, queryContext) => {
  if (queryContext?.system || !queryContext?.model) {
    return result
  }

  return processors.reduce((result, processor) => processor(result, queryContext), result)
}

module.exports = { camelizeKeys, postProcessResponse }
