const assert = require('assert')
const User = require('./models/User')
const Payment = require('./models/Payment')

describe('Model', () => {
  describe('create', () => {
    it('create simple model', async () => {
      const user = await User.create({ name: 'Test', email: 'test@test.com' })

      assert.ok(user)

      assert.ok(user.id)
      assert.equal(user.camelCase, null)
      assert.equal(user.status, 'new')
    })

    it('create model with hasMany related objects', async () => {
      const payments = [new Payment({ amount: 99 }), new Payment({ amount: 101 })]

      const userWithPayments = await User.create({ name: 'Test', email: 'test2@test.com', payments })

      console.log(userWithPayments)
    })
  })
})
