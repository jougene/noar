const _ = require('lodash')
const { singularize } = require('inflected')
const joi = require('joi')

const QueryBuilder = require('./QueryBuilder')
const als = require('./transaction/LocalStorage')
const { assert, snakeizeKeys } = require('./helpers')
const { entries, keys, assign } = Object

class Model {
  static db

  constructor (props = {}) {
    entries(this.constructor.defaults || {}).forEach(([name, value]) => {
      this[name] = value
    })

    entries(props).forEach(([name, value]) => {
      if (this.constructor.hasRelation(name)) {
        const RelationClass = this.constructor.relations[name].model
        const relationType = this.constructor.relations[name].type

        if (relationType === 'hasOne') {
          this[name] = new RelationClass(value)
        }

        if (relationType === 'belongsTo') {
          this[name] = new RelationClass(value)
        }

        if (relationType === 'hasManyThrough' || relationType === 'hasMany') {
          assert(Array.isArray(value))
          this[name] = value.map(v => new RelationClass(v))
        }
      } else {
        this[name] = value
      }
    })
  }

  static get qb () {
    const trx = als.getStore()

    return trx ? trx(this.table) : this.db(this.table)
  }

  static all () {
    return new QueryBuilder(this, this.qb)
  }

  static first () {
    return new QueryBuilder(this, this.qb).first()
  }

  static last () {
    return new QueryBuilder(this, this.qb).last()
  }

  static find (id) {
    return new QueryBuilder(this, this.qb).find(id)
  }

  static select (...selects) {
    return new QueryBuilder(this, this.qb).select(...selects)
  }

  static where (...args) {
    // add correct relations
    return new QueryBuilder(this, this.qb).where(...args)
  }

  /**
   * Insert single row with only own properties.
   */
  static async insert (data) {
    keys(data).forEach(key => {
      assert(!this.hasRelation(key), `Trying to insert relation [${key}]. Use ".create" function for this purpose`)
      assert(this.hasProperty(key), `
        Unknown property [${key}].
        Available properties: [${this.properties.join(' ')}]`)
    })

    const rawData = { ...this.defaults, ...snakeizeKeys(data) }

    const [id] = await this.qb.insert(rawData).returning('id')

    return new QueryBuilder(this, this.qb).find(id)
  }

  static async update (where, data) {
    await this.qb.where(where).update(snakeizeKeys(data))

    // TODO fix where.id
    return new QueryBuilder(this, this.qb).find(where.id)
  }

  /**
   * Create model with related objects if need
   */
  static async create (properties) {
    const entity = new this(properties)

    return entity.save()
  }

  async remove () {
    const ctor = this.constructor

    return ctor.qb.where({ id: this.id }).del()
  }

  static with (...relationsNames) {
    return new QueryBuilder(this, this.qb).with(...relationsNames)
  }

  static get relationNames () {
    return keys(this.relations || {})
  }

  static get properties () {
    return this.metadata.columns.map(_.camelCase)
  }

  static hasRelation (name) {
    return this.relationNames.includes(name)
  }

  static hasProperty (name) {
    return this.properties.includes(name)
  }

  static assertProperties (names) {
    return names.forEach(name => {
      assert(this.hasProperty(name), `${this.name} model does not have propery "${name}"`)
    })
  }

  // async getPersisted

  async reload () {}

  // Only for new entities
  async save () {
    // Just to not have change map of track for differences between changed entity
    // and persisted one
    assert(!this.id, new Error('Cannot save persisted entity. Use update method'))

    this.validate()

    const ctor = this.constructor

    const ownProperyKeys = keys(this).filter(k => ctor.hasProperty(k))
    const relationKeys = keys(this).filter(k => ctor.hasRelation(k))
    const relations = relationKeys.map(k => ({ name: k, ...ctor.relations[k] }))
    const relationsByType = _.groupBy(relations, 'type')

    const foreignProperties = {}

    // Firstly need to save related entites to get foreignKey
    for (const rel of relationsByType?.belongsTo ?? []) {
      const related = this[rel.name]
      const isPersisted = Boolean(related.id)

      if (!isPersisted) {
        await related.save()
      }

      const foreignKey = `${rel.name}Id`
      foreignProperties[foreignKey] = related.id
    }

    const ownProperties = _.pick(this, ownProperyKeys)
    const properties = { ...ownProperties, ...foreignProperties }

    const instance = await ctor.insert(properties)

    Object.assign(this, { ...instance, ...properties })

    // Handle hasMany relations
    for (const rel of relationsByType.hasMany ?? []) {
      const foreignKey = `${singularize(ctor.table)}Id`

      assert(Array.isArray(this[rel.name]), `Property ${rel.name} must be an array, because hasMany relation`)

      this[rel.name].forEach(async (item, idx) => {
        const updating = { [foreignKey]: instance.id }

        if (!item.id) {
          item[foreignKey] = instance.id
          this[rel.name][idx] = item.save()
        } else {
          this[rel.name][idx] = item.update(updating)
        }
      })

      this[rel.name] = await Promise.all(this[rel.name])
    }

    return this
  }

  async update (properties) {
    const ctor = this.constructor

    properties = entries(properties).reduce((acc, [k, v]) => {
      if (ctor.hasRelation(k)) {
        // now only for belongsTo
        acc[`${k}_id`] = v?.id ?? null

        return acc
      }

      acc[k] = v

      return acc
    }, {})

    assign(this, properties)

    this.validate()

    const updated = await ctor.update({ id: this.id }, properties)

    assign(this, updated)

    return this
  }

  validate () {
    if (!this.constructor.validations) {
      return
    }

    const schema = joi.object(this.constructor.validations())

    const { error } = schema.validate(this)

    if (error) {
      throw error
    }
  }
}

module.exports = Model
