const { assert } = require('../src/helpers')
const User = require('../examples/blog/models/User')
const Post = require('../examples/blog/models/Post')

describe('Model', () => {
  describe('constructor', () => {
    it('new model', () => {
      const user = new User({ name: 'Test', email: 'test@email.com', age: 27 })

      assert.ok(user)
      assert.equal(user.name, 'Test')
      assert.equal(user.email, 'test@email.com')
    })
  })

  describe('insert', () => {
    it('insert data', async () => {
      const user = await User.insert({ name: 'Test', email: 'test@test.com', age: 27 })

      assert.ok(user)
      assert.equal(user.constructor.name, User.name)

      assert.ok(user.id)
      assert.equal(user.name, 'Test')
      assert.equal(user.email, 'test@test.com')
      assert.equal(user.age, 27)
    })

    it('insert data for model that has defaults', async () => {
      const post = await Post.insert({ title: 'Supertitle', text: 'Super post text' })

      assert.ok(post)
      assert.instanceOf(post, Post)

      assert.equal(post.title, 'Supertitle')
      assert.equal(post.text, 'Super post text')
      assert.equal(post.status, 'draft')
    })

    it('error when trying to insert unknown property', async () => {
      await assert.rejects(User.insert({ unknown: 'unknown' }))
    })

    it('error when trying to insert relation', async () => {
      await assert.rejects(User.insert({ posts: [new Post({ text: 'text' })] }))
    })
  })

  describe('save', () => {
    it('new', async () => {
      const user = new User({ name: 'Test', email: 'test@email.com', age: 27 })

      await user.save()

      assert.ok(user.id)
    })

    it('new with related has many entities', async () => {
      const posts = [
        new Post({ title: 'title', text: 'text' }),
        new Post({ title: 'title2', text: 'text2' })
      ]

      let user = new User({ name: 'Test', email: 'test@email.com', age: 27, posts })

      await user.save()

      user = await User.with('posts').find(user.id)

      assert.ok(user)
      assert.ok(user.id)
      assert.ok(user.posts)

      assert.count(user.posts, 2)
    })

    it('new with related belongsTo entity', async () => {
      const user = new User({ name: 'Test', email: 'test@email.com', age: 27 })

      let post = new Post({ title: 'raz', text: 'dva', user })

      await post.save()

      post = await Post.with('user').find(post.id)

      assert.ok(post)
      assert.ok(post.id)
      assert.ok(post.userId)
      assert.ok(post.user)
      assert.ok(post.user.id)
    })

    it('can not save already persisted entity', async () => {
      const user = await User.create({ name: 'Test', email: 'test@email.com', age: 27 })

      user.status = 'abracadabra'

      await assert.rejects(user.save())
    })
  })

  describe('update', () => {
    it('update', async () => {
      const user = await new User({ name: 'Test', email: 'test@email.com', age: 27 }).save()

      await user.update({ name: 'Newname' })

      assert.equal(user.name, 'Newname')
    })
  })

  describe('create', () => {
    it('create simple model', async () => {
      const user = await User.create({ name: 'Test', email: 'test@test.com', age: 27 })

      assert.ok(user)
      assert.instanceOf(user, User)

      assert.ok(user.id)
    })

    it('create model with belongsTo related object', async () => {
      const user = await User.create({ name: 'Test', email: 'test2@test.com', age: 27 })

      const post = await Post.create({ title: 'title', text: 'text', user })

      assert.ok(post)
      assert.ok(post.id)

      assert.ok(post.user)
      assert.equal(post.user.id, user.id)
    })

    it('create model with hasMany related objects', async () => {
      const post1 = await Post.create({ title: 'title', text: 'text' })
      const post2 = await Post.create({ title: 'title', text: 'text' })

      const posts = [post1, post2]

      const user = await User.create({ name: 'Test', email: 'test2@test.com', age: 27, posts })

      assert.ok(user)
      assert.ok(user.id)
      assert.instanceOf(user, User)

      assert.ok(user.posts)
      assert.count(user.posts, 2)
    })
  })
})
