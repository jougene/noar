const _ = require('lodash')
const fs = require('fs').promises
const path = require('path')
const knex = require('knex')
const BaseModel = require('./Model')
const QueryBuilder = require('./QueryBuilder')
const Mapper = require('./Mapper')

let connection

const connect = async (config) => {
  config = _.merge(config, {
    useNullAsDefault: true,
    postProcessResponse: (result, queryContext) => {
      if (queryContext?.system || !queryContext?.model) {
        return result
      }

      return new Mapper(queryContext.model).mapDbResult(result)
    }

  })

  connection = knex(config)

  return connection
}

const bootstrap = async (config) => {
  if (!connection) {
    await connect(config)
  }

  let models = config.models

  if (_.isString(models)) {
    const modelsDir = models
    try {
      const modelFiles = await fs.readdir(models)

      models = modelFiles.map(file => require(path.resolve(modelsDir, file)))
    } catch (e) {
      console.error(e)
    }
  }

  BaseModel.db = connection

  await Promise.all(models.map(async model => {
    model.metadata = {}
    const columnInfo = await connection(model.table).queryContext({ system: true }).columnInfo()
    model.metadata.columns = Object.keys(columnInfo)

    // scopes
    const { scopes = {} } = model

    Object.entries(scopes).forEach(([key, fn]) => {
      model[key] = () => fn(new QueryBuilder(model, model.qb))
    })

    // relations (restructure relation key to object)
    const { relations = {} } = model
    const normalizedRelations = Object.entries(relations).reduce((acc, [key, rel]) => {
      const type = Object.keys(rel)[0]
      const normalizedRelation = { type, name: key, model: rel[type], join: rel.join }

      return { ...acc, ...{ [key]: normalizedRelation } }
    }, {})

    Object.defineProperty(model, 'relations', {
      get: function () {
        return normalizedRelations
      }
    })
  }))

  return { models }
}

module.exports = { connect, bootstrap }
