const assert = require('assert')
const _ = require('lodash')
const { singularize } = require('inflected')
const { entries, keys, assign } = Object

const consts = require('./consts')

class QueryBuilder {
  #loadedRelations = []

  constructor (model, qb) {
    this.model = model
    this.qb = qb

    // Add all scopes back to query builder for chaining works!
    entries(model.scopes || {}).forEach(([key, fn]) => {
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

      this.#loadedRelations.push(name)

      const relation = this.model.relations[name]

      if (relation.type === 'hasOne') {
        let foreignKey = relation.join || `${singularize(this.model.table)}_id`
        foreignKey = `${relation.model.table}.${foreignKey}`

        const selfKey = `${this.model.table}.id`

        return qb.leftJoin(relation.model.table, selfKey, foreignKey)
      }

      if (relation.type === 'hasMany') {
        const foreignKey = `${relation.model.table}.${singularize(this.model.table)}_id`
        const selfKey = `${this.model.table}.id`

        return qb.leftJoin(relation.model.table, selfKey, foreignKey)
      }

      if (relation.type === 'belongsTo') {
        const foreignKey = relation.join || `${singularize(relation.model.table)}_id`

        return qb.join(relation.model.table, `${this.model.table}.${foreignKey}`, `${relation.model.table}.id`)
      }

      return qb
    }, this.qb)

    return this
  }

  /**
   * @param Object args
   */
  where (args) {
    if (_.isFunction(args)) {
      this.qb.where(args)

      return this
    }

    const wheres = entries(args).reduce((acc, [key, value]) => {
      if (this.model.hasProperty(key)) {
        acc[`${this.model.table}.${_.snakeCase(key)}`] = value

        return acc
      }

      if (this.model.hasRelation(key)) {
        const relation = this.model.relations[key]

        entries(value).forEach(([key, value]) => {
          acc[`${relation.model.table}.${_.snakeCase(key)}`] = value
        })

        return acc
      }

      throw new Error(`Unknown property or relation [ ${key} ] of model ${this.model.name}`)
    }, [])

    this.qb.where(wheres)

    return this
  }

  whereIn (args) {
    this.qb = entries(args).reduce((qb, [key, value]) => {
      console.log({ key, value })

      if (this.model.hasProperty(key)) {
        return qb.whereIn(`${this.model.table}.${_.snakeCase(key)}`, value)
      }

      if (this.model.hasRelation(key)) {
        const relation = this.model.relations[key]

        return entries(value).reduce((qb, [k, v]) => {
          return qb.whereIn(`${relation.model.table}.${_.snakeCase(k)}`, v)
        }, qb)
      }

      throw new Error(`Unknown property or relation [ ${key} ] of model ${this.model.name}`)
    }, this.qb)

    return this
  }

  /**
   * selects can bet array of strings
   * OR object
   */
  select (...selects) {
    const selfTable = this.model.table

    if (selects.every(s => _.isString(s)) && Array.isArray(selects)) {
      this.model.assertProperties(selects)
      const selfSelects = selects.map(column => `${selfTable}.${_.snakeCase(column)}`)

      return this.qb.select(selfSelects)
    }

    [selects] = selects

    this.qb = entries(selects).reduce((qb, [name, columns]) => {
      assert(name === 'self' || this.model.hasRelation(name), `Cannot select [${name}]. Provide correct select key`)

      if (name === 'self') {
        this.model.assertProperties(columns)

        const selfSelects = columns.map(column => `${selfTable}.${_.snakeCase(column)}`)

        return qb.select(selfSelects)
      } else {
        assert(this.#loadedRelations.includes(name), `Cannot select by relation [${name}] that not loaded. Include it in WITH method`)

        const relation = this.model.relations[name]
        const table = relation.model.table

        relation.model.assertProperties(columns)

        const relationSelects = columns.map(c => `${table}.${_.snakeCase(c)} as ${singularize(table)}__${c}`)

        return qb.select(relationSelects)
      }
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
    const [column, order] = by

    this.qb.orderBy(`${this.model.table}.${column}`, order)

    return this
  }

  async paginate (params = consts.PAGINATION.DEFAULT) {
    params = _.merge(consts.PAGINATION.DEFAULT, params)

    const { page, perPage, orderBy } = params

    const primary = `${this.model.table}.id`

    let { total } = await this.qb.clone().clear('select').count(`${primary} as total`).first()
    total = Number(total)

    const items = await this.limit(perPage).offset(page).orderBy(orderBy)

    return { total, page, perPage, items }
  }

  addDefaultSelects () {
    this.qb = this.qb.select(`${this.model.table}.*`)

    this.qb = this.#loadedRelations.reduce((qb, relationName) => {
      const relation = this.model.relations[relationName]

      if (relation.type === 'hasOne') {
        const foreignSelects = relation.model.metadata.columns.map(c => `${relation.model.table}.${c} as ${relation.model.table}__${c}`)

        return qb.select(foreignSelects)
      }

      if (relation.type === 'hasMany') {
        const foreignSelects = relation.model.metadata.columns.map(c => `${relation.model.table}.${c} as ${relation.model.table}__${c}`)

        return qb.select(foreignSelects)
      }

      if (relation.type === 'belongsTo') {
        const foreignSelects = relation.model.metadata.columns.map(c => `${relation.model.table}.${c} as ${singularize(relation.model.table)}__${c}`)

        return qb.select(foreignSelects)
      }

      return qb
    }, this.qb)
  }

  // Make query builder thenable, so you can await it
  then (fn) {
    const hasSelects = this.qb._statements.some(s => s.grouping === 'columns')

    if (!hasSelects) {
      this.addDefaultSelects()
    }

    return fn(this.qb.queryContext({ model: this.model }))
  }
}

module.exports = QueryBuilder
