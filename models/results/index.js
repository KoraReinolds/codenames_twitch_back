const { Schema } = require('../../db/mongo')

module.exports = function(io) {

  const mongo = require('../../db/mongo')
  
  let schema = new mongo.Schema({
    channel_id: {
      type: String,
      required: true,
    },
    word: {
      type: String,
      required: true,
    },
    count: {
      type: Number,
      default: 0,
      required: true,
    },
    time: {
      type: Date,
      required: true,
    }
  })

  schema.statics.clearResults = async (channel_id) => {

    return await Results.deleteMany({
      channel_id
    })

  }

  schema.statics.getResults = async (channel_id) => {

    return await Results
      .find({ channel_id })
      .sort({ count: -1, time: 1 })
      .select('-_id -__v -channel_id -time')
      
  }

  schema.statics.registerAnswer = async ({channel_id, opaque_user_id, word}) => {

    return await Results.updateOne({
      channel_id,
      word,
    },
    {
      $inc: {
        count: 1,
      },
      $set: {
        time: +new Date,
      }
    },
    {
      upsert: true,
      new: true,
    })

  }
  
  const Results = mongo.model('Results', schema)

  return Results

}