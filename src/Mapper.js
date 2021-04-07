const _ = require('lodash')
const { camelizeKeys } = require('./helpers')

class Mapper {
  constructor (model) {
    this.Model = model
  }

  mapDbResult (result) {
    console.log(result)
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
      const existed = acc.find(a => a.id === item.id)
      if (existed) {
        this.Model.relationNames.forEach(name => {
          if (existed[name]) {
            existed[name] = [].concat(existed[name], item[name])
          }
        })
      } else {
        acc.push(item)
      }

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

      return { [name]: camelizeKeys(values) }
    }, {})

    return new this.Model({ ...camelizeKeys(_.pick(item, plainKeys)), ...relations })
  }
}

module.exports = Mapper
