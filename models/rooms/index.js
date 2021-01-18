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
    curentTurnColor: {
      type: String,
      default: null,
    },
    gameStatus: {
      type: String,
      default: '',
    },
    history: {
      type: Array,
      default: [],
    }
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

    const curentTurnColor = Math.round(Math.random()) ? 'red' : 'blue'
    const addRed = curentTurnColor === 'red'
    const addBlue = curentTurnColor === 'blue'
    const blackWordList = [wordList[0]]
    const redWordList = wordList.slice(1, 6 + addRed)
    const blueWordList = wordList.slice(7, 12 + addBlue)

    console.log(redWordList)

    return await Rooms.findOneAndUpdate({
      channel_id,
    }, {
      gameStatus: `Ожидание слова от каптана ${curentTurnColor === 'red' ? 'красной' : 'синей'} команды`,
      curentTurnColor,
      blackWordList,
      redWordList,
      blueWordList,
      wordList: wordList.sort(() => Math.random() - 0.5),
    })

  }
  
  const Rooms = mongo.model('Rooms', schema)

  return Rooms

}