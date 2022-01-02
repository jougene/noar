const assert = require('assert')
const _ = require('lodash')
const { singularize } = require('inflected')
const { entries } = Object

const consts = require('./consts')

class QueryBuilder {
  #loadedRelations = []

  constructor (model, qb) {
    this.model = model
    this.qb = qb
    this.db = model.db

    // Add all scopes back to query builder for chaining works!
    entries(model.scopes || {}).forEach(([key, fn]) => {
      this[key] = (...params) => fn(new QueryBuilder(model, this.qb), ...params)
    })
  }

  first () {
    return this.limit(1)
  }

  // TODO add default order by
  last () {
    return this.orderBy(['id', 'desc']).limit(1)
  }

  async find (id) {
    const [found] = await this.where({ id })

    return found
  }

  with (...relationsNames) {
    const selfTable = this.model.table

    this.qb = relationsNames.reduce((qb, name) => {
      if (!this.model.hasRelation(name)) {
        throw new Error(`Unknown relation "${name}". Available relations for this model: [${this.model.relationNames.join(', ')}]`)
      }

      this.#loadedRelations.push(name)

      const relation = this.model.relations[name]

      if (relation.type === 'hasOne') {
        const foreignKey = `${relation.model.table}.id`
        const selfKey = `${selfTable}.${relation.name}_id`

        return qb.leftJoin(relation.model.table, selfKey, foreignKey)
      }

      if (relation.type === 'hasMany') {
        const foreignKey = `${relation.model.table}.${singularize(selfTable)}_id`
        const selfKey = `${selfTable}.id`

        return qb.leftJoin(relation.model.table, selfKey, foreignKey)
      }

      if (relation.type === 'hasManyThrough') {
        const pivotTable = relation.through.table || relation.through
        const relationTable = relation.model.table
        const selfKey = `${selfTable}.id`

        const foreignKey = `${pivotTable}.${singularize(selfTable)}_id`

        return qb
          .leftJoin(pivotTable, selfKey, foreignKey)
          .join(relationTable, `${pivotTable}.id`, `${relationTable}.${singularize(pivotTable)}_id`)
      }

      if (relation.type === 'belongsTo') {
        const foreignKey = relation.join || `${singularize(relation.model.table)}_id`

        return qb.join(relation.model.table, `${selfTable}.${foreignKey}`, `${relation.model.table}.id`)
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
        const column = `${this.model.table}.${_.snakeCase(key)}`

        const operator = Array.isArray(value) ? value[0] : '='
        value = Array.isArray(value) ? value[1] : value

        acc.push([column, operator, value])

        return acc
      }

      if (this.model.hasRelation(key)) {
        const relation = this.model.relations[key]

        entries(value).forEach(([key, value]) => {
          const column = `${relation.model.table}.${_.snakeCase(key)}`

          const operator = Array.isArray(value) ? value[0] : '='
          value = Array.isArray(value) ? value[1] : value

          acc.push([column, operator, value])
        })

        return acc
      }

      throw new Error(`Unknown property or relation [ ${key} ] of model ${this.model.name}`)
    }, [])

    wheres
      .filter(w => !_.isNil(w[2]))
      .forEach(where => this.qb.where(...where))

    return this
  }

  whereIn (args) {
    this.qb = entries(args).reduce((qb, [key, value]) => {
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

        const pairs = columns.map(c => [`'${c}'`, `${table}.${c}`]).flat()

        if (relation.type === 'belongsTo' || relation.type === 'hasOne') {
          const relationSelects = `to_jsonb(json_build_object(${pairs.join(', ')})) as ${relation.name}`

          return qb.select(this.db.raw(relationSelects))
        }

        const relationSelects = `jsonb_agg(json_build_object(${pairs.join(', ')})) as ${relation.name}`

        return qb.select(this.db.raw(relationSelects)).groupBy(`${this.model.table}.id`)
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
    if (!Array.isArray(by)) {
      by = [by, 'asc']
    }

    const [column, order] = by

    this.qb.orderBy(`${this.model.table}.${_.snakeCase(column)}`, order)

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
        const alias = `${this.model.table}__${relation.name}`
        const foreignSelects = `to_jsonb(${relation.model.table}.*) as ${alias}`

        return qb.select(this.db.raw(foreignSelects))
      }

      if (relation.type === 'hasMany' || relation.type === 'hasManyThrough') {
        const alias = `${this.model.table}__${relation.name}`

        const foreignSelects = `jsonb_agg(${relation.model.table}.*) as ${alias}`

        return qb.select(this.db.raw(foreignSelects)).groupBy('users.id')
      }

      if (relation.type === 'belongsTo') {
        const alias = `${this.model.table}__${relation.name}`
        const foreignSelects = `to_jsonb(${relation.model.table}.*) as ${alias}`

        return qb.select(this.db.raw(foreignSelects))
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
