const _ = require('lodash')

class Mapper {
  constructor (model) {
    this.model = model
  }

  mapRelations () {}

  mapWhereArgs (args) {
    const normalizedArgs = args.reduce((acc, arg) => {
      if (_.isObject(arg)) {
        return Object.entries(arg).reduce((acc, [k, v]) => {
          acc[`${this.model.table}.${k}`] = v

          return acc
        }, {})
      }
      return args
    }, [])

    return normalizedArgs
  }
}

module.exports = Mapper
