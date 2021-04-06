const _ = require('lodash')

class Mapper {
  constructor (model) {
    this.model = model
  }

  mapRelations () {}

  mapWhereArgs (args) {}
}

module.exports = Mapper
