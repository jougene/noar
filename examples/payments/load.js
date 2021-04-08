const User = require('./User')
const UserPersonal = require('./UserPersonal')
const Payment = require('./Payment')

const { connect, bootstrap } = require('../../src/bootstrap')

module.exports = async () => {
  const db = await connect()

  await db.schema.createTable('users', t => {
    t.increments()
    t.string('name').notNullable()
    t.string('email')
    t.string('camel_case')

    t.timestamp('created_at').notNullable().defaultTo(db.fn.now())
  })

  await db.schema.createTable('user_personal_data', t => {
    t.increments()
    t.string('firstname').notNullable()
    t.string('lastname').notNullable()

    t.integer('user_id').notNullable()
    t.foreign('user_id').references('id').inTable('users')
  })

  await db.schema.createTable('payments', t => {
    t.increments()
    t.string('status').notNullable()
    t.integer('amount')
    t.timestamp('charged_at')
    t.timestamp('created_at').notNullable().defaultTo(db.fn.now())

    t.integer('user_id')
    t.foreign('user_id').references('id').inTable('users')
  })

  await bootstrap(({ models: [User, UserPersonal, Payment] }))

  const users = await Promise.all([
    User.insert({ name: 'Eugene', email: 'test@email.com', unkonow: 1412 }),
    User.insert({ name: 'Vasya', email: 'vasya@email.com' })
  ])

  const [user, user2] = users

  await Promise.all([
    Payment.insert({ amount: 10000, userId: user.id }),
    Payment.insert({ amount: 10000, userId: user2.id }),
    Payment.insert({ amount: 10000 })
    // Payment.create({ amount: 10000, user: user2 }),
    // Payment.create({ amount: 9999, user: user2, status: 'charged', chargedAt: db.fn.now() })
  ])
}
