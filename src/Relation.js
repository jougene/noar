// const TYPES = {
// HAS_ONE: 'hasOne',
// BELONGS_TO: 'belongsTo',
// HAS_MANY: 'hasMany',
// HAS_MANY_THROUGH: 'hasManyThrough'
// }

class Relation {
  constructor (type, name, model, options = {}) {
    this.type = type
    this.name = name
    this.model = model

    this.options = options
  }

  assertType (type) {}
}

module.exports = Relation
