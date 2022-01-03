const _ = require('lodash')
const { camelizeKeys } = require('./helpers')

class Mapper {
  constructor (model) {
    this.model = model
  }

  mapDbResult (result) {
    if (!Array.isArray(result)) {
      return this.mapOne(result)
    }

    return result.map(item => this.mapOne(item))
  }

  mapOne (item) {
    if (!_.isObject(item)) {
      return item
    }

    const Model = this.model
    const table = Model.table

    const fields = Object.keys(item)
    const relationFields = fields.filter(f => f.startsWith(`${table}__`))
    const selfFields = _.difference(fields, relationFields)

    const relations = relationFields.reduce((acc, f) => {
      const [, name] = f.split('__')

      acc[name] = item[f]

      return acc
    }, {})

    const selfProps = camelizeKeys(_.pick(item, selfFields))

    const relationProps = Object.entries(relations).reduce((acc, [name, value]) => {
      const { type } = this.model.relations[name]

      if (value === null) {
        return acc
      }

      const relationValues = {
        hasOne: () => camelizeKeys(value),
        hasMany: () => value.filter(v => v !== null).map(camelizeKeys),
        hasManyThrough: () => value.filter(v => v !== null).map(camelizeKeys),
        belongsTo: () => value ? camelizeKeys(value) : null
      }[type]

      acc[name] = relationValues()

      return acc
    }, {})

    const props = { ...selfProps, ...relationProps }

    return new Model(props)
  }

  /**
   * Prepare Model object to be ready for insert in database
   */
  prepareForInsert (object) {

  }
}

module.exports = Mapper
