const _ = require('lodash')
const { singularize } = require('inflected')

const QueryBuilder = require('./QueryBuilder')
const { assert, snakeizeKeys } = require('./helpers')
const { entries, keys } = Object

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

    const [id] = await this.qb.insert(rawData)

    return new QueryBuilder(this, this.qb).find(id)
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

  async reload () {}

  async save () {
    // TODO can be update, not insert
    const ctor = this.constructor

    const ownProperyKeys = keys(this).filter(k => ctor.hasProperty(k))
    const properties = _.pick(this, ownProperyKeys)
    let instance
    if (this.id) {
      // check if nothing changes
      // await ctor.update(id, properties.filter(p => p))
    } else {
      instance = await ctor.insert(properties)
    }

    const relationKeys = keys(this).filter(k => ctor.hasRelation(k))

    for (const key of relationKeys) {
      const relationType = ctor.relations[key].type

      if (relationType === 'hasMany') {
        // TODO replace hardcoded foreignKeys to some more ....
        const foreignKey = `${singularize(ctor.table)}Id`

        assert(Array.isArray(this[key]), `Property ${key} must be an array, because hasMany relation`)

        this[key].forEach((item, idx) => {
          item[foreignKey] = instance.id
          this[key][idx] = item.save()
        })
        instance[key] = await Promise.all(this[key])
      }
    }

    return instance
  }
}

module.exports = Model
