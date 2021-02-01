module.exports = function(io) {

  const mongo = require('../../db/mongo')
  
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
    },
    allowChooseCards: {
      type: Boolean,
      default: false,
    },
  })

  schema.statics.toggleTurn = async (channel_id, turnColor) => {

    return await Rooms.findOneAndUpdate({
      channel_id,
    }, {
      curentTurnColor: turnColor,
      gameStatus: `Ожидание слова от каптана ${turnColor === 'red' ? 'красной' : 'синей'} команды`,
      allowChooseCards: false,
    }, {
      new: true,
    })
   
  }

  schema.statics.addToHistory = async ({ channel_id, ...historyInfo }) => {

    return await Rooms.findOneAndUpdate({
      channel_id,
    }, {
      $push: { history: historyInfo },
      allowChooseCards: true,
      gameStatus: `Ожидается выбор карты от игроков`,
    }, {
      new: true,
    })
   
  }

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
    wordList.sort(() => Math.random() - 0.5)

    return await Rooms.findOneAndUpdate({
      channel_id,
    }, {
      gameStatus: `Ожидание слова от каптана ${curentTurnColor === 'red' ? 'красной' : 'синей'} команды`,
      curentTurnColor,
      blackWordList,
      redWordList,
      blueWordList,
      wordList,
    }, {
      new: true,
    })

  }
  
  const Rooms = mongo.model('Rooms', schema)

  return Rooms

}