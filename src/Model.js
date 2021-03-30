const _ = require('lodash')
const { singularize } = require('inflected')

const RELATIONS = ['belongsTo', 'hasMany', 'hasOne']

class Model {
  static db

  static all () {
    return this.db(this.table)
  }

  static first () {
    return this.db(this.table).first()
  }

  static async create (properties) {
    const entity = new this()
    const { table, relations, defaults } = this

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

    const [id] = await this.db(table).insert(snakeCased)
    const row = await this.db(table).where({ id }).first()

    Object.assign(entity, row)

    return entity
  }

  static with (...relationsNames) {
    const qb = relationsNames.reduce((qb, name) => {
      if (!this.hasRelation(name)) {
        throw new Error(`Unknown relation ${name}`)
      }

      let relation = this.relations[name]
      const relationType = Object.keys(relation).filter(r => RELATIONS.includes(r))[0]
      if (!relationType) {
        throw new Error(`Unknown relation type for relation [${name}]`)
      }

      if (relationType === 'belongsTo') {
        relation = relation[relationType]
        const foreignKey = `${singularize(relation.table)}_id`
        const foreignSelects = relation.metadata.columns.map(c => `${relation.table}.${c} as ${singularize(relation.table)}__${c}`)
        // replace with actual columns, not *
        const selects = [`${this.table}.*`].concat(foreignSelects)

        return qb.join(relation.table, `${this.table}.${foreignKey}`, `${relation.table}.id`).select(selects)
      }

      return qb
    }, this.db(this.table))

    return qb
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
