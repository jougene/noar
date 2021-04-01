const _ = require('lodash')

const QueryBuilder = require('./QueryBuilder')

class Model {
  static db

  static get qb () {
    return this.db(this.table)
  }

  static all () {
    return this.qb
  }

  static first () {
    return new QueryBuilder(this, this.qb).first()
  }

  static find (id) {
    return new QueryBuilder(this, this.qb).find(id)
  }

  static where (...args) {
    // add correct relations
    return new QueryBuilder(this, this.db(this.table)).where(...args)
  }

  static async create (properties) {
    const entity = new this()
    const { relations, defaults } = this

    const keys = Object.keys(properties)

    const relationsNames = Object.keys(relations)
    const plain = keys.filter(k => !relationsNames.includes(k))
    const relationProps = keys.filter(k => relationsNames.includes(k))

    const plainData = _.pick(properties, plain)
    const relationsData = relationProps.reduce((acc, v) => {
      // handle if relation does not have an ID
      const relation = properties[v]
      const key = `${v}_id` // or defined in relation

      return { ...acc, ...{ [key]: relation.id } }
    }, {})

    const data = { ...defaults, ...plainData, ...relationsData }
    const snakeCased = Object.keys(data).reduce((acc, key) => {
      const snakeCasedKey = _.snakeCase(key)
      acc[snakeCasedKey] = data[key]

      return acc
    }, {})

    const [id] = await this.qb.insert(snakeCased)
    const row = await this.qb.where({ id }).first()

    Object.assign(entity, row)

    return entity
  }

  static with (...relationsNames) {
    return new QueryBuilder(this, this.db(this.table)).with(...relationsNames)
  }

  static get relationNames () {
    return Object.keys(this.relations || {})
  }

  static hasRelation (name) {
    return this.relationNames.includes(name)
  }

  async reload () {}
  async save () {}
}

module.exports = Model
