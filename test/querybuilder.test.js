const { assert } = require('../src/helpers')
const User = require('../examples/blog/models/User')
const Post = require('../examples/blog/models/Post')

describe('QueryBuilder', () => {
  describe('with', () => {
    let user

    it('has many', async () => {
      const { id } = await User.create({
        name: 'Test',
        email: 'test2@test.com',
        age: 27,
        posts: [
          new Post({ title: 'raz', text: 'dva' }),
          new Post({ title: 'raz', text: 'dva' })
        ]
      })

      user = await User.with('posts').find(id)

      assert.ok(user)
      assert.count(user.posts, 2)
    })
  })

  it('first', async () => {
    const user = await User.with('posts').first()

    assert.ok(user)
    assert.ok(user.id)
  })

  it('where by relations without loading it', async () => {

  })

  describe('select', () => {
    it('select only own model fields', async () => {})
  })
})
