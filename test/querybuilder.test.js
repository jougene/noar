const { assert } = require('../src/helpers')
const User = require('./models/User')
const Payment = require('./models/Payment')

describe('QueryBuilder', () => {
  describe('with', () => {
    it('has many', async () => {
      const { id } = await User.create({
        name: 'Test',
        email: 'test2@test.com',
        payments: [
          new Payment({ amount: 99 }),
          new Payment({ amount: 101 })
        ]
      })

      const user = await User.with('payments').find(id)

      assert.ok(user)
      assert.count(user.payments, 2)
    })
  })

  it('first', async () => {
    // const user = await User.with('payments').first()
  })
})
