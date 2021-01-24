const mongo = require('./mongo')

const clearDB = async function() {
  
  try {
    await mongo.connection.on("open", () => {
      mongo.connection.db.dropDatabase(() => {
        console.log(`clear DB`)
        mongo.disconnect()
      })
    }
  )} catch(err) {
    await mongo.disconnect()
    process.exit(err ? 255 : 0)
  }
}

clearDB()
