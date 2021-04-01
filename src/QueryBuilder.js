const { singularize } = require('inflected')

const RELATIONS = ['belongsTo', 'hasMany', 'hasOne']

class QueryBuilder {
  constructor (model, qb) {
    this.model = model
    this.qb = qb

    // Add all scopes back to query builder for chaining works!
    Object.entries(model.scopes).forEach(([key, fn]) => {
      this[key] = () => new QueryBuilder(model, fn(this.qb))
    })
  }

  with (...relationsNames) {
    this.qb = relationsNames.reduce((qb, name) => {
      if (!this.model.hasRelation(name)) {
        throw new Error(`Unknown relation ${name}`)
      }

      let relation = this.model.relations[name]
      const relationType = Object.keys(relation).filter(r => RELATIONS.includes(r))[0]
      if (!relationType) {
        throw new Error(`Unknown relation type for relation [${name}]`)
      }

      if (relationType === 'belongsTo') {
        relation = relation[relationType]
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
    this.qb = this.qb.where(...args)

    return this
  }

  // Make query builder thenable, so you can await it
  then (fn) {
    return fn(this.qb)
  }
}

module.exports = QueryBuilder
