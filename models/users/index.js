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
    user_id: {
      type: String,
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
    active: {
      type: Boolean,
      default: true,
    },
    team_leader: {
      type: Boolean,
      default: false,
    },
    color: {
      type: String,
    },
  })
  

  schema.statics.getUsersInChannel = async (channel_id) => {

    const rooms = await Rooms.find({
      channel_id,
    })
    console.log(rooms)
    return rooms

  },

  schema.statics.registerUser = async ({
    opaque_user_id,
    role,
    channel_id,
    pubsub_perms,
  }) => {
    
    let room = await Rooms.findOne({
      channel_id,
    })
    
    if (!room) {
      
      room = await Rooms.create({
        channel_id,
      })
      
    }
     
    let newUser = await Users.findOneAndUpdate({
      channel_id,
      opaque_user_id,
    }, {
      active: true,
    })

    if (!newUser) {

      newUser = await Users.create({
        opaque_user_id,
        role,
        channel_id,
        pubsub_perms,
        channel_ref: room._id,
      })

    }

    return newUser
    
  }

  schema.statics.getActiveUsers = async (channel_id) => {

    return await Users.find({
      channel_id,
      active: true,
    })

  }

  schema.statics.getTeamLeaders = async (channel_id) => {

    const broadcater = await Users.findOneAndUpdate({
      channel_id,
      role: 'broadcaster',
    }, {
      team_leader: true,
    })
    
    const enemyColor = broadcater.color === 'red' ? 'blue' : 'red'
    // console.log('broadcater ', broadcater)
    
    const secondLeader = (await Users.aggregate(
      [
        { $match: { color: enemyColor } },
        { $sample: { size: 1 } },
      ]
    ))[0]
      
    // console.log('secondLeader', secondLeader.opaque_user_id)

    return [
      broadcater,
      await Users.findOneAndUpdate({
        channel_id,
        opaque_user_id: secondLeader.opaque_user_id,
      }, {
        team_leader: true,
      })
    ]

  }

  schema.statics.disableUserFromRoom = async (user) => {

    return await Users.findOneAndUpdate({
      opaque_user_id: user.opaque_user_id,
      channel_id: user.channel_id,
    }, {
      active: false,
    })

  }

  schema.statics.removeUsersFromRoom = async (channel_id) => {

    return await Users.deleteMany({ channel_id })

  }

  const Users = mongo.model('Users', schema)

  return Users

}