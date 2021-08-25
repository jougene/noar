const Model = require('../../src/Model')

class User extends Model {
  static defaults = {
    status: 'new'
  }

  static scopes = {}

  static get relations () {
    return {
      payments: { hasMany: require('./Payment') },
      personalData: { hasOne: require('./UserPersonalData') }
    }
  }

  // static validations = {}

  static withPersonalData () {
    return this.with('personalData')
  }

  get fullname () {
    return 'test'
  }
}

module.exports = User
