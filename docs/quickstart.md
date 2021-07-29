## QuickStart

To start using Noar in your project you need to bootstrap it.

```javascript
const Noar = require('@jougene/noar')

const config = {
  client: 'sqlite',
  connection: ':memory:'
}

// in some async function when your application should be loaded
await bootstrap(({ models: [User, UserPersonal, Payment] }))

```
