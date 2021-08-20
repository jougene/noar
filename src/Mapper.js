const _ = require('lodash')
const { camelizeKeys } = require('./helpers')
const { pluralize } = require('inflected')

class Mapper {
  constructor (model) {
    this.model = model
  }

  mapDbResult (result) {
    if (!Array.isArray(result)) {
      return this.mapOne(result)
    }

    return this.mapMany(result)
  }

  mapMany (rows) {
    const camelCased = rows.map(item => {
      return this.mapOne(item)
    })

    const merged = camelCased.reduce((acc, item) => {
      const existed = acc.find(a => a.id && a.id === item.id)

      if (!existed) {
        return acc.concat(item)
      }

      this.model.relationNames.forEach(name => {
        if (existed[name]) {
          existed[name] = existed[name].concat(item[name])
        }
      })

      return acc
    }, [])

    return merged
  }

  mapOne (item) {
    if (!_.isObject(item)) {
      return item
    }

    const plainKeys = Object.keys(item).filter(k => !k.includes('__'))
    const relationsKeys = Object.keys(item).filter(k => k.includes('__'))

    const grouped = _.groupBy(relationsKeys, k => {
      const [name] = k.split('__')

      return name
    })

    const relations = Object.entries(grouped).reduce((acc, [name, keys]) => {
      const values = keys.reduce((acc, key) => {
        const [, cleanedKey] = key.split('__')

        return { ...acc, [cleanedKey]: item[key] }
      }, {})

      const relation = Object.values(this.model.relations).find(r => r.model.table === pluralize(name))
      const relationType = relation.type

      if (relationType === 'hasOne' && values.id === null) {
        return acc
      }

      // TODO move to Relation class
      const relationValues = {
        hasOne: camelizeKeys(values),
        hasMany: values.id === null ? [] : [camelizeKeys(values)],
        belongsTo: camelizeKeys(values)
      }[relationType]

      return { ...acc, ...{ [relation.name]: relationValues } }
    }, {})

    const Model = this.model

    return new Model({ ...camelizeKeys(_.pick(item, plainKeys)), ...relations })
  }

  /**
   * Prepare Model object to be ready for insert in database
   */
  prepareForInsert (object) {

  }
}

module.exports = Mapper
