const assert = require('assert')
const _ = require('lodash')
const { singularize } = require('inflected')

const consts = require('./consts')

class QueryBuilder {
  constructor (model, qb) {
    this.model = model
    this.qb = qb

    // Add all scopes back to query builder for chaining works!
    Object.entries(model.scopes || {}).forEach(([key, fn]) => {
      this[key] = () => fn(new QueryBuilder(model, this.qb))
    })
  }

  async first () {
    const table = this.model.table

    const [result] = await this.where(qb => {
      const subqb = qb.clone().select(`${table}.id`).from(`${table}`).limit(1)

      qb.where(`${table}.id`, subqb)
    })

    return result
  }

  async last () {
    const table = this.model.table

    const [result] = await this.where(qb => {
      const subqb = qb.clone().select(`${table}.id`).from(`${table}`).orderBy('id', 'desc').limit(1)

      qb.where(`${table}.id`, subqb)
    })

    return result
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

        // const foreignSelects = relation.model.metadata.columns.map(c => `${relation.model.table}.${c} as ${relation.model.table}__${c}`)

        // replace with actual columns, not *
        // const selects = [`${this.model.table}.*`].concat(foreignSelects)

        return qb.leftJoin(relation.model.table, selfKey, foreignKey)
        // .select(selects)
      }

      if (relation.type === 'hasMany') {
        const foreignKey = `${relation.model.table}.${singularize(this.model.table)}_id`
        const selfKey = `${this.model.table}.id`
        // const foreignSelects = relation.model.metadata.columns.map(c => `${relation.model.table}.${c} as ${relation.model.table}__${c}`)

        // replace with actual columns, not *
        // const selects = [`${this.model.table}.*`].concat(foreignSelects)

        return qb.leftJoin(relation.model.table, selfKey, foreignKey)
        // .select(selects)
      }

      if (relation.type === 'belongsTo') {
        const foreignKey = relation.join || `${singularize(relation.model.table)}_id`
        // const foreignSelects = relation.model.metadata.columns.map(c => `${relation.model.table}.${c} as ${singularize(relation.model.table)}__${c}`)
        // replace with actual columns, not *
        // const selects = [`${this.model.table}.*`].concat(foreignSelects)

        return qb.join(relation.model.table, `${this.model.table}.${foreignKey}`, `${relation.model.table}.id`)
        // .select(selects)
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

  select (selects) {
    const selfTable = this.model.table

    // TODO Add checks for property existence
    this.qb = Object.entries(selects).reduce((qb, [name, columns]) => {
      assert(name === 'self' || this.model.hasRelation(name), `Cannot select [${name}]. Provide correct select key`)

      if (name === 'self') {
        this.model.assertProperties(...columns)

        const selfSelects = columns.map(column => `${selfTable}.${column}`)

        qb.select(selfSelects)
      } else {
        const relation = this.model.relations[name]
        const table = relation.model.table

        relation.model.assertProperties(...columns)

        const relationSelects = columns.map(c => `${table}.${c} as ${singularize(table)}__${c}`)

        qb.select(relationSelects)
      }

      return qb
    }, this.qb)

    return this
  }

  limit (num) {
    this.qb.limit(num)

    return this
  }

  offset (num) {
    this.qb.offset(num)

    return this
  }

  orderBy (by) {
    this.qb.orderBy(by)

    return this
  }

  async paginate (params = consts.PAGINATION.DEFAULT) {
    params = _.merge(consts.PAGINATION.DEFAULT, params)

    const { page, perPage, orderBy } = params

    let { total } = await this.qb.clone().clear('select').count('* as total').first()
    total = Number(total)

    const items = await this.limit(perPage).offset(page).orderBy(...orderBy)

    return { total, page, perPage, items }
  }

  // Make query builder thenable, so you can await it
  then (fn) {
    // check if not custom selects, IF NOT -> select all with all relations
    return fn(this.qb.queryContext({ model: this.model }))
  }
}

module.exports = QueryBuilder
