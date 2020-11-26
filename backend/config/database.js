const low = require('lowdb')
const MemorySync = require('lowdb/adapters/Memory')
const fs = require('fs')

let db = null
try {
  const dbBuf = fs.readFileSync('db.json')
  const jsonData = JSON.parse(dbBuf.toString('utf8'))
  const memAdapter = new MemorySync()
  db = low(memAdapter)
  db.defaults({
    accounts: jsonData.accounts,
    sessions: jsonData.sessions
  })
    .write()

} catch (err) {
  console.error('Could not load database')
  console.error(err)
}
module.exports = db;