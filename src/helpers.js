const _ = require('lodash')

const camelizeKeys = (obj) => {
  return Object.entries(obj).reduce((acc, [k, v]) => {
    acc[_.camelCase(k)] = v

    return acc
  }, {})
}

const mapSingleFromSnakeCase = (item, model) => {
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

    console.log(model.relations[name])

    return { [name]: camelizeKeys(values) }
  }, {})

  return { ...camelizeKeys(_.pick(item, plainKeys)), ...relations }
}

const mapFromSnakeCase = (result, { model }) => {
  if (!Array.isArray(result)) {
    return mapSingleFromSnakeCase(result, model)
  } else {
    return result.map(item => {
      return mapSingleFromSnakeCase(item, model)
    })
  }
}

const mergeToOne = (result, { model }) => {
  if (!Array.isArray(result)) {
    return result
  } else {
    return result.reduce((acc, item) => {
      const primaryKey = 'id'

      // merge the same models and arraify its has many relations
      if (acc.find(a => a[primaryKey] === item[primaryKey])) {
        console.log(item)
      }

      acc.push(item)

      return acc
    }, [])
  }
}

const mapToModel = (result, { model }) => {
  return result
}

const processors = [
  mapFromSnakeCase
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
