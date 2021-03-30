const knex = require('knex')
const baseModel = require('./Model')

let connection

const bootstrap = (config) => {
  const { models } = config

  connection = knex({
    client: 'sqlite',
    connection: ':memory:',
    useNullAsDefault: true
  })

  baseModel.db = connection

  baseModel.where = function (args) {
    return this.db(this.table).where(args)
  }

  models.forEach(model => {
    // scopes
    const { scopes } = model

    Object.entries(scopes).forEach(([key, fn]) => {
      model[key] = () => fn(model.db(model.table))
    })
  })

  return connection
}

module.exports = bootstrap
