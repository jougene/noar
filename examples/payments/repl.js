const repl = require('repl')
const load = require('./load')

const User = require('./User')
const Payment = require('./Payment')

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
})()
