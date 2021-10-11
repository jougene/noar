<div align="center">
  <img width="400" src="https://user-images.githubusercontent.com/13833179/120039872-46830980-c00e-11eb-9f2d-0949276cf6d1.jpg" alt="John Doe">
</div>

# NodeJS ActiveRecord

[![build](https://travis-ci.com/jougene/noar.svg?branch=main)](https://travis-ci.com/github/jougene/noar)
[![codebeat badge](https://codebeat.co/badges/f31ede91-0de7-4f12-92f2-523ce5c1aee7)](https://codebeat.co/projects/github-com-jougene-noar-main)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com)

## Demo
TBD asciinema

## Features
- Elegant api (Inspired by Rails ActiveRecord and Laravel Eloquent)
- Uses convention over configuration
- Declarative model definition (scopes, relations, validations etc.)
- Model validation
- Transactions (based on async hooks, so you dont need to wrap your code into callback)
- Based on knex.js (so you have all power of knex query builder)
- Yaml fixtures for seeding test data and using it in tests
- Cascade saving?
- Finite state machine included
- Easy polymorphic relations

## Installation

`npm install @jougene/noar`

## Interactive usage

You dont need to create some example for your own.
Clone repository, run `npm install`
And use on of existing examples from directory `./examples`

For example run:

`npm run examples:payments:repl`

And work with example models:
- User, UserPersonal, Payment

```javascript
noar#> await User.find(1)
noar#> await User.all()
noar#> await User.first()
noar#> user = await User.create({ name: 'test', email: 'ivan@gmail.com' })
noar#> await Payment.new().with('user')
noar#> await Payment.with('user').charged()
```

## Model definition
### Super simple model
```javascript
const Model = require('@jougene/noar')

class User extends Model {
  static table = 'users' // dont really need, by default it is pluralized form of model name.
}
```

### With some default values
```javascript
const Model = require('@jougene/noar')

class User extends Model {
  static table = 'users'

  static defaults = { status: 'new' }
}
```

## Relations definition
For now there is 3 types of relations:
- hasOne
- hasMany
- belongsTo (inverted of hasMany)

Imagine you develop some system handling payments.  
So you have at least two models: `User` and `Payment`  
User has many payments and one payment belongs only to one user  
So your models should look like this  

```javascript
class User extends Model {
  static table = 'users'

  static get relations () {
    return {
      payments: { hasMany: Payment },
    }
  }
}

class Payment extends Model {
  static table = 'payments'

  static get relations () {
    return {
      user: { belongsTo: User }
    }
  }
}

```

## Creating models
- With constructor and `save()` method
```javascript
const user = new User({ name: 'Ivan', email: 'ivansuper@gmail.com' })

await user.save()
```
- With static `create`
```javascript
await User.create({ name: 'Ivan', email: 'ivansuper@gmail.com' })
```

## Queries
```javascript
await User.all()

await User.first()

await User.find(42)

await User.where({ status: new })
```

## Queries with relations
If you want to get some model with related objects you can use static `with` method of model

```javascript
const userWithPayments = await User.with('payments').first()
```

## Scopes
Very often you want to have some predefined queries, for example for statuses  
- `await User.where({ status: 'registered' })`
- `await User.where({ status: 'wait_for_email' })`  

For this case you can use model scopes:
```javascript
class User extends Model {
  static table = 'users'

  static scopes = {
    registered: (qb) => qb.where({ status: 'registered' }),
    waitForEmail: (qb) => qb.where({ status: 'wait_for_email' }),
  }
}
```
And instead of always writing `await User.where({ status: 'registered' })`  
Do this with scopes `await User.registered()` caused the same result

## Transactions
TBD
```javascript
await Transaction.start()

... code
```

## Enhancements
TBD
Add all models to your custom repl
```javascript
Noar.augmentRepl(repl.Context)
```
