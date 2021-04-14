const _ = require('lodash')
const { assert } = require('../src/helpers')
const User = require('./models/User')
const Payment = require('./models/Payment')

describe('Scopes', () => {
  let payments

  before(async () => {
    const user = await User.create({ name: 'test', email: 'test@mail.com' })

    payments = await Promise.all([
      Payment.create({ amount: 10, user }),
      Payment.create({ amount: 20, user }),
      Payment.create({ amount: 30, user, status: 'charged' }),
      Payment.create({ amount: 10, user, status: 'charged' })
    ])
  })

  it('simple', async () => {
    const chargedPayments = await Payment.charged()

    const expectedCharged = payments.filter(p => p.status === 'charged').map(p => {
      // remove user property for correct assertion
      const { user, ...payment } = p

      return new p.constructor(payment)
    })

    assert(_.isEqual(chargedPayments, expectedCharged), 'Objects are not equal')
  })

  it('combined with "with"', async () => {
    const chargedWithUser = await Payment.with('user').charged()

    const expectedCharged = payments.filter(p => p.status === 'charged')

    assert(_.isEqual(chargedWithUser, expectedCharged), 'Objects are not equal')

    chargedWithUser.map(payment => assert.instanceOf(payment.user, User))
  })

  it('combined with "with" but after scope function', async () => {
    const chargedWithUser = await Payment.charged().with('user')

    const expectedCharged = payments.filter(p => p.status === 'charged')

    assert(_.isEqual(chargedWithUser, expectedCharged), 'Objects are not equal')
    chargedWithUser.map(payment => assert.instanceOf(payment.user, User))
  })
})
