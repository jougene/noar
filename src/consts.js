const RELATION = {
  TYPE: {
    HAS_ONE: 'hasOne',
    BELONGS_TO: 'belongsTo',
    HAS_MANY: 'hasMany',
    HAS_MANY_THROUGH: 'hasManyThrough'
  }
}

RELATION.TYPES = Object.values(RELATION.TYPE)

module.exports = {
  RELATION,
  PAGINATION: {
    DEFAULT: {
      page: 0,
      perPage: 50,
      orderBy: ['id', 'desc']
    }
  }
}
