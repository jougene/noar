const load = require('./load')
const util = require('util')

const User = require('./User')
const Payment = require('./Payment')

const dump = (obj) => console.log(util.inspect(obj, false, null, true))

;(async () => {
  await load()

  dump({ newWithUser: await Payment.new().with('user') })
  // dump({ withUserAndNew: await Payment.with('user').new() })
  // dump({ where: await Payment.with('user').where({ amount: 9999 }) })
  // dump({ complex: await Payment.new().with('user').where({ amount: 10000 }) })
  // dump({ userWithPayments: await User.with('payments') })
  // dump({ userWithPersonal: await User.with('personal') })

  process.exit(0)
})()
