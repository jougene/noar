const assert = require('assert')
const User = require('./models/User')
const Payment = require('./models/Payment')

describe('QueryBuilder', () => {
  describe('with', () => {
    it('has many', async () => {
      const userWithPayments = await User.with('payments').first()

      // console.log(userWithPayments)
    })
  })
})
