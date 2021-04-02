// const _ = require('lodash')
const knex = require('knex')
const { postProcessResponse } = require('./helpers')
const BaseModel = require('./Model')
const QueryBuilder = require('./QueryBuilder')

let connection

const connect = async (config) => {
  connection = knex({
    client: 'sqlite',
    connection: ':memory:',
    useNullAsDefault: true,
    postProcessResponse
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

    // relations (restructure relation key to object)
    const { relations = {} } = model
    const normalizedRelations = Object.entries(relations).reduce((acc, [key, rel]) => {
      const type = Object.keys(rel)[0]
      const normalizedRelation = { type, model: rel[type] }

      return { ...acc, ...{ [key]: normalizedRelation } }
    }, {})

    Object.defineProperty(model, 'relations', {
      get: function () {
        return normalizedRelations
      }
    })
  })
}

module.exports = { connect, bootstrap }
