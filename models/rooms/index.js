module.exports = function(io) {

  const mongo = require('../../db/mongo')
  const Users = mongo.models.Users
  
  let schema = new mongo.Schema({
    channel_id: {
      type: String,
      required: true,
      unique: true,
    },
    wordList: {
      type: Array,
      default: null,
    },
  })

  schema.statics.removeRoom = async (channel_id) => {

    return await Rooms.findOneAndDelete({
      channel_id,
    })

  }

  schema.statics.setWordList = async (channel_id, wordList) => {

    return await Rooms.findOneAndUpdate({
      channel_id,
    }, {
      wordList
    })

  }
  
  const Rooms = mongo.model('Rooms', schema)

  return Rooms

}