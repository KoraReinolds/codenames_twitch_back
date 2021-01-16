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
    redWordList: {
      type: Array,
      default: null,
    },
    blueWordList: {
      type: Array,
      default: null,
    },
    blackWordList: {
      type: Array,
      default: null,
    },
  })

  schema.statics.getRoomById = async (channel_id) => {

    return await Rooms.findOne({
      channel_id,
    })

  }

  schema.statics.removeRoom = async (channel_id) => {

    return await Rooms.findOneAndDelete({
      channel_id,
    })

  }

  schema.statics.setWordList = async (channel_id, wordList) => {

    return await Rooms.findOneAndUpdate({
      channel_id,
    }, {
      blackWordList: [wordList[0]],
      redWordList: wordList.slice(1, 6),
      blueWordList: wordList.slice(6, 11),
      wordList: wordList.sort(() => Math.random() - 0.5),
    })

  }
  
  const Rooms = mongo.model('Rooms', schema)

  return Rooms

}