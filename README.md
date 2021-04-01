# NoAR
NodeJS ActiveRecord

## Features
- Elegant api (Inspired by Rails ActiveRecord and Laravel Eloquent)
- Uses convention over configuration
- Model validation
- Transactions (based on async hooks, so you dont need to wrap your code into callback)
- Based on knex.js (so you have all power of knex query builder)
- Declarative scopes, relations, validations
- Yaml fixtures for seeding test data and using in tests
- Cascade saving?
- Finite state machine included
- Easy polymorphic relations

## Installation

`npm install @jougene/noar`

## Interactive usage

Run repl, and work with example models - User, Payment

`npm run examples:payments:repl`

```bash
noar#> await User.find(1)
  knex:query select * from `users` where `id` = ? limit ? undefined +8s
  knex:bindings [ 1, 1 ] undefined +8s
{
  id: 1,
  name: 'Eugene',
  email: 'test@email.com',
  camel_case: null,
  created_at: '2021-04-01 15:19:28'
}
noar#> await Payment.new().with('user')
  knex:query select `payments`.*, `users`.`id` as `user__id`, `users`.`name` as `user__name`, `users`.`email` as `user__email`, `users`.`camel_case` as `user__camel_case`, `users`.`created_at` as `user__created_at` from `payments` inner join `users` on `payments`.`user_id` = `users`.`id` where `status` = ? undefined +9s
  knex:bindings [ 'new' ] undefined +9s
[
  {
    id: 1,
    status: 'new',
    amount: 10000,
    chargedAt: null,
    createdAt: '2021-04-01 15:19:28',
    userId: 1,
    user: {
      id: 1,
      name: 'Eugene',
      email: 'test@email.com',
      camelCase: null,
      createdAt: '2021-04-01 15:19:28'
    }
  },
  {
    id: 2,
    status: 'new',
    amount: 10000,
    chargedAt: null,
    createdAt: '2021-04-01 15:19:28',
    userId: 2,
    user: {
      id: 2,
      name: 'Vasya',
      email: 'vasya@email.com',
      camelCase: null,
      createdAt: '2021-04-01 15:19:28'
    }
  }
]
noar#>
```

## Basic usage

```javascript
First you need to bootstrap NoAR with config providing models directory

```
