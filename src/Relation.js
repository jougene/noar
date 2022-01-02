// add subclass for all type of relations
// class BelongsTo {}

class Relation {
  constructor (type, name, model, options = {}) {
    this.type = type
    this.name = name
    this.model = model

    this.options = options
  }

  // resolve()

  resolveJoins () {

  }

  resolveSelects () {}

  assertType (type) {}
}

module.exports = Relation
