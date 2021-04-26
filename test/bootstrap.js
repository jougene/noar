const path = require('path')
const { connect, bootstrap } = require('../src/bootstrap')

before(async () => {
  const config = {
    client: 'sqlite',
    connection: ':memory:'
  }

  const db = await connect(config)

  await db.schema.createTable('users', t => {
    t.increments()
    t.string('name').notNullable()
    t.string('email')
    t.string('status')
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

    t.integer('user_id').notNullable()
    t.foreign('user_id').references('id').inTable('users')
  })

  await bootstrap(({ models: path.resolve(__dirname, 'models') }))

  // load fixtures
})
