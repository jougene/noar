const _ = require('lodash')
const { assert } = require('../src/helpers')
const User = require('../examples/blog/models/User')
const Post = require('../examples/blog/models/Post')

describe('Scopes', () => {
  let posts

  before(async () => {
    const user = await User.create({ name: 'test', email: 'test@mail.com', age: 27 })

    posts = await Promise.all([
      Post.create({ title: 'raz', text: 'dva', user }),
      Post.create({ title: 'raz', text: 'dva', user }),
      Post.create({ title: 'raz', text: 'dva', status: 'published', user }),
      Post.create({ title: 'raz', text: 'dva', status: 'published', user })
    ])
  })

  it('simple', async () => {
    const posts = await Post.published()

    const statuses = posts.map(p => p.status)

    assert(statuses.every(s => s === 'published'))
  })

  // it('combined with "with"', async () => {
  // const chargedWithUser = await Payment.with('user').charged()

  // const expectedCharged = payments.filter(p => p.status === 'charged')

  // assert(_.isEqual(chargedWithUser, expectedCharged), 'Objects are not equal')

  // chargedWithUser.map(payment => assert.instanceOf(payment.user, User))
  // })

  // it('combined with "with" but after scope function', async () => {
  // const chargedWithUser = await Payment.charged().with('user')

  // const expectedCharged = payments.filter(p => p.status === 'charged')

  // assert(_.isEqual(chargedWithUser, expectedCharged), 'Objects are not equal')
  // chargedWithUser.map(payment => assert.instanceOf(payment.user, User))
  // })

  it('scopy by relation', async () => {})
})
