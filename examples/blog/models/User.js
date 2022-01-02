const Model = require('../../../src/Model')

class User extends Model {
  static settings = {
    orderBy: ['createdAt', 'desc']
  }

  static scopes = {}

  static get relations () {
    return {
      posts: { hasMany: require('./Post') },
      comments: { hasMany: require('./Comment') }
    }
  }
}

module.exports = User
