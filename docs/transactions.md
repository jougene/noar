## Transactions

Transactions uses NodeJS feature https://nodejs.org/api/async_context.html#async_context_class_asynclocalstorage
So, you dont need to pass transaction object to all underlying code, because it will be taken from async context

### Usage
```javascript
const payment = await Transaction.run(async () => {
  const user = await User.insert({ name: 'Eugene', email: 'test@email.com' })
  return Payment.create({ amount: 10000, userId: user.id })
})
```
If some error happens during running callback, passing into `Transaction.run` method,
transaction will be rollbacked
