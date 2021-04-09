const { assert } = require('../src/helpers')
const User = require('./models/User')
const Payment = require('./models/Payment')

describe('Model', () => {
  describe('constructor', () => {
    it('new model', () => {
      const user = new User({ name: 'Test', email: 'test@email.com' })

      assert.ok(user)
      assert.equal(user.name, 'Test')
      assert.equal(user.email, 'test@email.com')
    })
  })

  describe('insert', () => {
    it('insert data', async () => {
      const user = await User.insert({ name: 'Test', email: 'test@test.com' })

      assert.ok(user)
      assert.equal(user.constructor.name, User.name)

      assert.ok(user.id)
      assert.equal(user.camelCase, null)
      assert.equal(user.status, 'new')
    })

    it('error when trying to insert unknown property', async () => {
      await assert.rejects(User.insert({ unknown: 'unknown' }))
    })

    it('error when trying to insert relation', async () => {
      await assert.rejects(User.insert({ payments: [new Payment({ amount: 100 })] }))
    })
  })

  describe('create', () => {
    it('create simple model', async () => {
      const user = await User.create({ name: 'Test', email: 'test@test.com' })

      assert.ok(user)
      assert.equal(user.constructor.name, User.name)

      assert.ok(user.id)
      assert.equal(user.camelCase, null)
      assert.equal(user.status, 'new')
    })

    it('create model with belongsTo related object', async () => {

    })

    it('create model with hasMany related objects', async () => {
      const payments = [new Payment({ amount: 99 }), new Payment({ amount: 101 })]

      const user = await User.create({ name: 'Test', email: 'test2@test.com', payments })

      assert.ok(user)
      assert.equal(user.constructor.name, User.name)

      assert.ok(user.payments)

      assert.count(user.payments, 2)

      assert.ok(user.id)
    })
  })
})
