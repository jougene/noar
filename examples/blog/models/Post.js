const Model = require('../../../src/Model')

class Post extends Model {
  static get relations () {
    return {
      user: { belongsTo: require('./User') },
      comments: { hasMany: require('./Comment') }
    }
  }
}

module.exports = Post
