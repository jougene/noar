const { assert } = require('../src/helpers')
const User = require('./models/User')
const Payment = require('./models/Payment')

describe('QueryBuilder', () => {
  describe('with', () => {
    let user

    it('has many', async () => {
      const { id } = await User.create({
        name: 'Test',
        email: 'test2@test.com',
        payments: [
          new Payment({ amount: 99 }),
          new Payment({ amount: 101 })
        ]
      })

      user = await User.with('payments').find(id)

      assert.ok(user)
      assert.count(user.payments, 2)
    })
  })

  it('first', async () => {
    const user = await User.with('payments').first()

    console.log(user)
  })

  it('where by relations without loading it', async () => {

  })

  describe('select', () => {
    it('select only own model fields', async () => {})
  })
})
