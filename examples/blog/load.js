console.dump = (value) => {
  console.log(require('util').inspect(value, false, 5, true))
}

// const _ = require('lodash')
const path = require('path')

const { bootstrap } = require('../../src/bootstrap')

module.exports = async () => {
  const config = {
    client: 'pg',
    connection: {
      host: 'localhost',
      port: 55432,
      user: 'noar',
      password: 'noar',
      database: 'noar'
    },
    models: path.resolve(__dirname, './models')
  }

  const { models } = await bootstrap(config)
  // const { User, Post, Comment } = models

  // const [user1, user2] = await Promise.all([
  // User.insert({ name: 'Eugene', age: 27 }),
  // User.insert({ name: 'Vasya', age: 13 })
  // ])

  // const post = await Post.create({ status: 'draft', title: 'Post title', text: 'Post text', userId: user1.id })
  // await Comment.create({ text: 'Comment text ', userId: user1.id, postId: post.id })

  return models

  // const [user, user2] = users

  // await Promise.all([
  // UserPersonalData.create({ firstname: 'Ivan', lastname: 'Ivanov', userId: user.id })
  // ])

  // await Promise.all([
  // Payment.create({ amount: 10000, userId: user.id }),
  // Payment.create({ amount: 10000, userId: user.id }),
  // Payment.create({ amount: 10000 }),
  // Payment.create({ amount: 10000, userId: user2.id }),
  // Payment.create({
  // amount: 9999,
  // userId: user2.id,
  // status: 'charged',
  // chargedAt: db.fn.now()
  // })
  // ])
}
