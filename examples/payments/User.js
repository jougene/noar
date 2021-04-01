const Model = require('../../src/Model')

class User extends Model {
  static table = 'users'

  static scopes = {}

  static get relations () {
    return {
      payments: { hasMany: require('./Payment') },
      personal: { hasOne: require('./UserPersonal') }
    }
  }

  static validations = {}
}

module.exports = User
