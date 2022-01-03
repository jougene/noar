console.dump = (value) => {
  console.log(require('util').inspect(value, false, 5, true))
}

const path = require('path')
const { bootstrap } = require('../src/bootstrap')

before(async () => {
  const config = {
    client: 'pg',
    connection: {
      host: 'localhost',
      port: 55432,
      user: 'noar',
      password: 'noar',
      database: 'noar'
    },
    models: path.resolve(__dirname, '../examples/blog/models')
  }

  const { models } = await bootstrap(config)

  return models
})
