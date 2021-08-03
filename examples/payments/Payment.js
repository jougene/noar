const Model = require('../../src/Model')

class Payment extends Model {
  static defaults = {
    status: 'new'
  }

  static fsm = {
    states: ['new', 'registered', 'charged', 'failed'],
    initial: 'new',
    events: [
      { name: 'register', from: 'new', to: 'registered' },
      { name: 'charge', from: 'registered', to: 'charged' },
      { name: 'fail', from: '*', to: 'failed' }
    ]
  }

  static scopes = {
    new: (qb) => qb.where({ status: 'new' }),
    charged: (qb) => qb.where({ status: 'charged' })
  }

  static get relations () {
    return {
      user: { belongsTo: require('./User') }
    }
  }
}

module.exports = Payment
