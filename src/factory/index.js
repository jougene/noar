const assert = require('assert')

const _ = require('lodash')

class Factory {
  static factories = new Map()

  static define (...params) {
    assert.equal(params.length, 2, 'Factory.define requires 2 params')

    const [, last] = params

    if (_.isFunction(last)) {
      return this.defineCustom(...params)
    }

    return this.defineForModel(...params)
  }

  static defineForModel (Model, defaultAttributes) {
    const key = Model.name.toLowerCase()

    if (this.factories.has(key)) {
      throw new Error(`Duplicate factory [ ${key} ]. Use different name for factory`)
    }

    this.factories.set(key, { defaultAttributes })
  }

  static defineCustom (name, fn) {
    if (this.factories.has(name)) {
      throw new Error(`Duplicate factory [ ${name} ]. Use different name for factory`)
    }

    this.factories.set(name, fn)
  }

  static async create (...params) {
    const [modelOrName, args = {}] = params

    if (_.isString(modelOrName)) {
      const name = modelOrName
      const factory = this.factories.get(name)

      return factory(args)
    }

    const Model = modelOrName
    const factory = this.factories.get(Model.name.toLowerCase())

    const raz = _.merge(factory.defaultAttributes, args)

    return Model.create(raz)
  }
}

module.exports = Factory
