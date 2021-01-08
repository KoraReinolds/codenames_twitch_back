module.exports = function(io) {

  const mongo = require('../../db/mongo')
  const Users = mongo.models.Users
  
  let schema = new mongo.Schema({
    channel_id: {
      type: String,
      required: true,
      unique: true,
    },
  })

  schema.statics.removeRoom = async (channel_id) => {

    return await Rooms.findOneAndDelete({
      channel_id: channel_id,
    })

  }
  
  const Rooms = mongo.model('Rooms', schema)

  return Rooms

}