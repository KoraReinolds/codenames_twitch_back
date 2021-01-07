const { Schema } = require('../../db/mongo')

module.exports = function(io) {

  const mongo = require('../../db/mongo')
  const Rooms = mongo.models.Rooms
  
  let schema = new mongo.Schema({
    opaque_user_id: {
      unique: true,
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    channel_ref: {
      type: Schema.Types.ObjectId,
      ref: "Rooms",
    },
    channel_id: {
      type: String,
      required: true,
    },
    pubsub_perms: {
      type: Object,
      required: true,
    },
  })
  

  schema.statics.getUsersInChannel = async function(channel_id) {

    const rooms = await Rooms.find({
      channel_id,
    })
    console.log(rooms)
    return rooms

  },

  schema.statics.registerUser = async function({
    opaque_user_id,
    role,
    channel_id,
    pubsub_perms,
  }) {
    
    let room = await Rooms.findOne({
      channel_id,
    })
    
    if (!room) {
      
      room = await Rooms.create({
        channel_id,
      })
      
    }
     
    let newUser = await Users.findOne({
      channel_id,
      opaque_user_id,
    })

    if (!newUser) {

      newUser = await Users.create({
        opaque_user_id,
        role,
        channel_id,
        pubsub_perms,
        channel_ref: room._id,
      })

    } else {

      console.log('user exist')

    }
    
  }

  const Users = mongo.model('Users', schema)

  return Users

}