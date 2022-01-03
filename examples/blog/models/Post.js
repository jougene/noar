const Model = require('../../../src/Model')

class Post extends Model {
  static defaults = {
    status: 'draft'
  }

  static scopes = {
    draft: (qb) => qb.where({ status: 'draft' }),
    published: (qb) => qb.where({ status: 'published' })
  }

  static get relations () {
    return {
      user: { belongsTo: require('./User') },
      comments: { hasMany: require('./Comment') }
    }
  }
}

module.exports = Post
