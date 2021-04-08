const _ = require('lodash')

const QueryBuilder = require('./QueryBuilder')
const { camelizeKeys, snakeizeKeys } = require('./helpers')
const { entries, keys, values } = Object

class Model {
  static db

  constructor (props = {}) {
    entries(props).forEach(([name, value]) => {
      if (this.constructor.hasRelation(name)) {
        const RelationClass = this.constructor.relations[name].model
        const relationType = this.constructor.relations[name].type

        if (relationType === 'belongsTo') {
          this[name] = new RelationClass(value)
        }

        if (relationType === 'hasMany') {
          // check that value is array
          this[name] = value.map(v => new RelationClass(v))
        }
      } else {
        this[name] = value
      }
    })

    entries(this.constructor.defaults || {}).forEach(([name, value]) => {
      this[name] = value
    })
  }

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
    return new QueryBuilder(this, this.qb).where(...args)
  }

  static async create (properties) {
    const entity = new this(properties)

    return entity.save()
  }

  /**
   * Insert single row
   */
  static async insert (data) {
    if (keys(data).some(k => !this.hasProperty(k))) {
      // throw new Error(`Unknown property`)
    }

    const rawData = { ...this.defaults, ...snakeizeKeys(data) }

    const [id] = await this.qb.insert(rawData)

    return new QueryBuilder(this, this.qb).find(id)
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

  async reload () {}

  async save () {
    // check if related object is present in database
    // save main entity
    // save related objects
    // careful about depth
    return this

    // const keys = Object.keys(this)

    // const relationsNames = this.constructor.relationsNames
    // const plain = keys.filter(k => !relationsNames.includes(k))
    // const relationProps = keys.filter(k => relationsNames.includes(k))

    // const plainData = _.pick(this, plain)
    // const relationsData = relationProps.reduce((acc, v) => {
    // // handle if relation does not have an ID
    // const relation = this[v]
    // const key = `${v}_id` // or defined in relation

    // return { ...acc, ...{ [key]: relation.id } }
    // }, {})

    // const data = { ...defaults, ...plainData, ...relationsData }
    // const snakeCased = Object.keys(data).reduce((acc, key) => {
    // const snakeCasedKey = _.snakeCase(key)
    // acc[snakeCasedKey] = data[key]

    // return acc
    // }, {})

    // const [id] = await this.qb.insert(snakeCased)
    // const row = await new QueryBuilder(this, this.qb).find(id)

    // Object.assign(entity, row)

    // return entity
  }
}

module.exports = Model
