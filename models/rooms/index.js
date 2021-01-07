module.exports = function(io) {

  const mongo = require('../../db/mongo')
  
  let schema = new mongo.Schema({
    channel_id: {
      type: String,
      required: true,
      unique: true,
    },
  })

  const Rooms = mongo.model('Rooms', schema)

  return Rooms

}