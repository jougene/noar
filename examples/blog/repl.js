const repl = require('repl')
const util = require('util')
const load = require('./load')

const Transaction = require('../../src/transaction/Transaction')
const Factory = require('../../src/factory')

;(async () => {
  const models = await load()
  const writer = (obj) => util.inspect(obj, { colors: true, depth: 4 })

  const server = repl.start({ prompt: 'noar#> ', writer })
  server.setupHistory('./.node_history', (err) => {
    if (err) {
      console.error(err)
      process.exit(1)
    }
  })

  Object.entries(models).forEach(([name, model]) => {
    server.context[name] = model
  })

  server.context.user = await models.User.last()

  // server.context.User = User
  server.context.Tx = Transaction
  server.context.Factory = Factory

  // server.context.cb = async () => {
  // const user = await User.insert({ name: 'Eugene', email: 'test@email.com' })
  // // await Payment.create({ amount: 10000, userId: user.id })
  // }
})()
