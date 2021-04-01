const User = require('./User')
const Payment = require('./Payment')

const { connect, bootstrap } = require('../../src/bootstrap')

;(async () => {
  const db = await connect(({ models: [User, Payment] }))

  await db.schema.createTable('users', t => {
    t.increments()
    t.string('name').notNullable()
    t.string('email')
    t.string('camel_case')

    t.timestamp('created_at').notNullable().defaultTo(db.fn.now())
  })

  await db.schema.createTable('payments', t => {
    t.increments()
    t.string('status').notNullable()
    t.integer('amount')
    t.timestamp('charged_at')
    t.timestamp('created_at').notNullable().defaultTo(db.fn.now())

    t.integer('user_id').notNullable()
    t.foreign('user_id').references('id').inTable('users')
  })

  await bootstrap(({ models: [User, Payment] }))

  const users = await Promise.all([
    User.create({ name: 'Eugene', email: 'test@email.com' }),
    User.create({ name: 'Vasya', email: 'vasya@email.com' })
  ])

  const [user, user2] = users

  await Promise.all([
    Payment.create({ amount: 10000, user }),
    Payment.create({ amount: 10000, user: user2 }),
    Payment.create({ amount: 9999, user: user2, status: 'charged', chargedAt: new Date() })
  ])

  // console.log({ newWithUser: await Payment.new().with('user') })
  // console.log({ withUserAndNew: await Payment.with('user').new() })
  // console.log({ where: await Payment.with('user').where({ amount: 9999 }) })
  console.log({ complex: await Payment.new().with('user').where({ amount: 10000 }) })

  process.exit(0)
})()
