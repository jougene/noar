const Model = require('../../src/Model')

class User extends Model {
  static table = 'users'

  static defaults = {
    status: 'new'
  }

  static scopes = {}

  static get relations () {
    return {
      payments: { hasMany: require('./Payment') },
      personal: { hasOne: require('./UserPersonal') }
    }
  }

  get fullname () {
    return 'test'
  }
}

module.exports = User
