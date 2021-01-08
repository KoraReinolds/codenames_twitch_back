module.exports = function(io) {

  const mongo = require('../../db/mongo')
  
  let schema = new mongo.Schema({
    word: {
      type: String,
      required: true,
      unique: true,
    },
  })

  schema.statics.countWords = async () => {

    return await Game.find().count()

  }
  schema.statics.insertWords = async (word_array) => {

    return await Game.insertMany(
      word_array.map(word => ({ word }))
    )

  }

  schema.statics.generateWordList = async () => {

    return await Game.aggregate(
      [ { $sample: { size: 20 } } ]
    )
   
  }
  
  const Game = mongo.model('Game', schema)

  return Game

}