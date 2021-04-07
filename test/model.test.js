const assert = require('assert')
const User = require('./models/User')

describe('Model', () => {
  describe('create', () => {
    it('create simple model', async () => {
      const user = await User.create({ name: 'Test', email: 'test@test.com' })

      assert.ok(user)

      assert.ok(user.id)
      assert.equal(user.camelCase, null)
      assert.equal(user.status, 'new')
    })
  })
})
