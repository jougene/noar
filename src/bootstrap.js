const _ = require('lodash')
const knex = require('knex')
const BaseModel = require('./Model')
const QueryBuilder = require('./QueryBuilder')

let connection

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

const connect = async (config) => {
  connection = knex({
    client: 'sqlite',
    connection: ':memory:',
    useNullAsDefault: true,
    postProcessResponse: (result, context) => {
      if (context?.system) {
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
  })

  return connection
}

const bootstrap = async (config) => {
  const { models } = config

  BaseModel.db = connection

  models.forEach(async model => {
    // metadata (to know what columns we have)
    model.metadata = {}
    const columnInfo = await connection(model.table).queryContext({ system: true }).columnInfo()
    model.metadata.columns = Object.keys(columnInfo)

    // scopes
    const { scopes = {} } = model

    Object.entries(scopes).forEach(([key, fn]) => {
      model[key] = () => new QueryBuilder(model, fn(model.db(model.table)))
    })
  })
}

module.exports = { connect, bootstrap }
