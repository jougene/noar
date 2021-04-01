const repl = require('repl')
const load = require('./load')

const User = require('./User')
const Payment = require('./Payment')

;(async () => {
  await load()

  const server = repl.start({ prompt: 'noar#> ' })
  server.context.User = User
  server.context.Payment = Payment
})()
