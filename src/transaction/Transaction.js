const als = require('./LocalStorage')

class Transaction {
  static db

  static async run (cb) {
    const store = await this.db.transaction()

    return als.run(store, async () => {
      const trx = als.getStore()

      try {
        const result = await cb()
        await trx.commit()

        return result
      } catch (e) {
        await trx.rollback()
        throw e
      }
    })
  }
}

module.exports = Transaction
