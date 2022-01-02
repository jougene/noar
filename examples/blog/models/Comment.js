const Model = require('../../../src/Model')

class Comment extends Model {
  static get relations () {
    const User = require('./User')

    return {
      post: { belongsTo: require('./Post') },
      user: { belongsTo: User }
    }
  }
}

module.exports = Comment
