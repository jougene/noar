const _ = require('lodash')
const { singularize } = require('inflected')

class QueryBuilder {
  constructor (model, qb) {
    this.model = model
    this.qb = qb

    // Add all scopes back to query builder for chaining works!
    Object.entries(model.scopes || {}).forEach(([key, fn]) => {
      this[key] = () => fn(new QueryBuilder(model, this.qb))
    })
  }

  first () {
    this.qb = this.qb.first()

    return this
  }

  async find (id) {
    const [found] = await this.where({ id })

    return found
  }

  with (...relationsNames) {
    this.qb = relationsNames.reduce((qb, name) => {
      if (!this.model.hasRelation(name)) {
        throw new Error(`Unknown relation "${name}". Available relations for this model: [${this.model.relationNames.join(', ')}]`)
      }

      const relation = this.model.relations[name]

      if (relation.type === 'hasOne') {
        let foreignKey = relation.join || `${singularize(this.model.table)}_id`
        foreignKey = `${relation.model.table}.${foreignKey}`

        const selfKey = `${this.model.table}.id`

        const foreignSelects = relation.model.metadata.columns.map(c => `${relation.model.table}.${c} as ${relation.model.table}__${c}`)

        // replace with actual columns, not *
        const selects = [`${this.model.table}.*`].concat(foreignSelects)

        return qb.leftJoin(relation.model.table, selfKey, foreignKey).select(selects)
      }

      if (relation.type === 'hasMany') {
        const foreignKey = `${relation.model.table}.${singularize(this.model.table)}_id`
        const selfKey = `${this.model.table}.id`
        const foreignSelects = relation.model.metadata.columns.map(c => `${relation.model.table}.${c} as ${relation.model.table}__${c}`)

        // replace with actual columns, not *
        const selects = [`${this.model.table}.*`].concat(foreignSelects)

        return qb.leftJoin(relation.model.table, selfKey, foreignKey).select(selects)
      }

      if (relation.type === 'belongsTo') {
        const foreignKey = relation.join || `${singularize(relation.model.table)}_id`
        const foreignSelects = relation.model.metadata.columns.map(c => `${relation.model.table}.${c} as ${singularize(relation.model.table)}__${c}`)
        // replace with actual columns, not *
        const selects = [`${this.model.table}.*`].concat(foreignSelects)

        return qb.join(relation.model.table, `${this.model.table}.${foreignKey}`, `${relation.model.table}.id`).select(selects)
      }

      return qb
    }, this.qb)

    return this
  }

  where (...args) {
    const normalizedArgs = args.reduce((acc, arg) => {
      if (_.isObject(arg)) {
        return Object.entries(arg).reduce((acc, [k, v]) => {
          // TODO handle find by relation
          if (this.model.hasRelation(k)) {
            const relation = this.model.relations[k]
            acc[`${relation.model.table}.id`] = v.id
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
