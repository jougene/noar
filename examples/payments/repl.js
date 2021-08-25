const repl = require('repl')
const load = require('./load')

const User = require('./User')
const Payment = require('./Payment')

const Transaction = require('../../src/transaction/Transaction')
const Factory = require('../../src/factory')

;(async () => {
  await load()

  const server = repl.start({ prompt: 'noar#> ' })
  server.setupHistory('./.node_history', (err) => {
    if (err) {
      console.error(err)
      process.exit(1)
    }
  })

  server.context.User = User
  server.context.Payment = Payment
  server.context.Tx = Transaction
  server.context.Factory = Factory

  server.context.cb = async () => {
    const user = await User.insert({ name: 'Eugene', email: 'test@email.com' })
    await Payment.create({ amount: 10000, userId: user.id })
  }
})()
