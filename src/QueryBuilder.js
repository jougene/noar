const _ = require('lodash')
const { singularize, pluralize } = require('inflected')

const RELATIONS = ['belongsTo', 'hasMany', 'hasOne']

class QueryBuilder {
  constructor (model, qb) {
    this.model = model
    this.qb = qb

    // Add all scopes back to query builder for chaining works!
    Object.entries(model.scopes || {}).forEach(([key, fn]) => {
      this[key] = () => new QueryBuilder(model, fn(this.qb))
    })
  }

  first () {
    this.qb = this.qb.first()

    return this
  }

  find (id) {
    const [found] = this.where({ id })

    return found
  }

  with (...relationsNames) {
    this.qb = relationsNames.reduce((qb, name) => {
      if (!this.model.hasRelation(name)) {
        throw new Error(`Unknown relation "${name}". Available relations for this model: [${this.model.relationNames.join(', ')}]`)
      }

      const { model: relation, type: relationType } = this.model.relations[name]

      if (relationType === 'hasOne') {
        const foreignKey = `${relation.table}.${singularize(this.model.table)}_id`
        const selfKey = `${this.model.table}.id`

        const foreignSelects = relation.metadata.columns.map(c => `${relation.model.table}.${c} as ${name}__${c}`)

        // replace with actual columns, not *
        const selects = [`${this.model.table}.*`].concat(foreignSelects)

        return qb.leftJoin(relation.table, selfKey, foreignKey).select(selects)
      }

      if (relationType === 'hasMany') {
        const foreignKey = `${relation.table}.${singularize(this.model.table)}_id`
        const selfKey = `${this.model.table}.id`
        const foreignSelects = relation.metadata.columns.map(c => `${relation.table}.${c} as ${relation.table}__${c}`)

        // replace with actual columns, not *
        const selects = [`${this.model.table}.*`].concat(foreignSelects)

        return qb.leftJoin(relation.table, selfKey, foreignKey).select(selects)
      }

      if (relationType === 'belongsTo') {
        const foreignKey = `${singularize(relation.table)}_id`
        const foreignSelects = relation.metadata.columns.map(c => `${relation.table}.${c} as ${singularize(relation.table)}__${c}`)
        // replace with actual columns, not *
        const selects = [`${this.model.table}.*`].concat(foreignSelects)

        return qb.join(relation.table, `${this.model.table}.${foreignKey}`, `${relation.table}.id`).select(selects)
      }

      return qb
    }, this.qb)

    return this
  }

  where (...args) {
    const normalizedArgs = args.reduce((acc, arg) => {
      if (_.isObject(arg)) {
        return Object.entries(arg).reduce((acc, [k, v]) => {
          if (this.model.hasRelation(pluralize(k))) {
            const relation = this.model.relations[pluralize(k)]
            console.log(relation)
          } else {
            acc[`${this.model.table}.${k}`] = v
          }

          return acc
        }, {})
      }
      return args
    }, [])

    // normalize objects with relations
    this.qb = this.qb.where(normalizedArgs)

    return this
  }

  // Make query builder thenable, so you can await it
  then (fn) {
    return fn(this.qb.queryContext({ model: this.model }))
  }
}

module.exports = QueryBuilder
