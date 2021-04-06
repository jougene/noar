const assert = require('assert')
const User = require('./models/User')

describe('Model', () => {
  describe('create', () => {
    it('create simple model', async () => {
      console.log(require.cache)
      // console.log({ db: User.db })
      // const user = await User.create({ name: 'Test', email: 'test@test.com' })

      // assert.ok(user)
    })
  })
})
