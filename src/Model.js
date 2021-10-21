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
          // check that value is array
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

    let id

    if (this.db.client.driverName === 'pg') {
      id = await this.qb.insert(rawData).returning('id')
    } else {
      id = await this.qb.insert(rawData)
    }

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

  async reload () {}

  async save () {
    this.validate()

    // TODO can be update, not insert
    const ctor = this.constructor

    const ownProperyKeys = keys(this).filter(k => ctor.hasProperty(k))
    const relationKeys = keys(this).filter(k => ctor.hasRelation(k))
    const relations = relationKeys.map(k => ({ name: k, ...ctor.relations[k] }))

    const relationsByType = _.groupBy(relations, ({ type }) => type)

    // TODO add handling hasOne relations

    // Handle belongsTo relations
    const foreignProperties = relationsByType.belongsTo?.reduce((acc, relation) => {
      const key = `${singularize(relation.model.table)}Id`
      const value = this[relation.name].id

      return { ...acc, ...{ [key]: value } }
    }, {})

    const ownProperties = _.pick(this, ownProperyKeys)
    const properties = { ...ownProperties, ...foreignProperties }
    let instance
    if (this.id) {
      // TODO check if we need update (Diff objects)
      // update only changed fields - ??? How can do this?
      // for now it is not necessary
      instance = await ctor.update({ id: this.id }, ownProperties)
    } else {
      instance = await ctor.insert(properties)
    }

    Object.assign(this, { ...instance, ...properties })

    // Handle hasMany relations
    for (const relation of relationsByType.hasMany || []) {
      const foreignKey = `${singularize(ctor.table)}Id`

      assert(Array.isArray(this[relation.name]), `Property ${relation.name} must be an array, because hasMany relation`)

      this[relation.name].forEach((item, idx) => {
        item[foreignKey] = instance.id
        this[relation.name][idx] = item.save()
      })
      this[relation.name] = await Promise.all(this[relation.name])
    }

    return this
  }

  async update (properties) {
    const ctor = this.constructor

    const ownProperyKeys = keys(this).filter(k => ctor.hasProperty(k))
    properties = _.pick(properties, ownProperyKeys)

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
