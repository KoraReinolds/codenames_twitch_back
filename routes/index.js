
module.exports = function(io) {
  const express = require('express')
  const jsonwebtoken = require('jsonwebtoken')
  const router = express.Router()
  const key = process.env.TWITCH_SECRET_KEY
  const secret = Buffer.from(key, 'base64')
  const request = require('request');
  const Rooms = require('../models/rooms')(io)
  const Users = require('../models/users')(io)
  const ownerId = process.env.OWNER_ID

  let user

  io.on('connection', socket => {

    extractToken(socket.request.headers.authorization)
    Users.registerUser(user)

    socket.on('disconnect', () => {
      console.log('disconect ')
    })
    
    socket.emit('user', user)

  })

  const errorHandleWrapper = function(callback) {
    return function (req, res, next) {
      callback(req, res, next)
        .catch(next)
    }
  }

  function extractToken(token) {
    const prefix = 'Bearer '
    user = jsonwebtoken.verify(
      token.substring(prefix.length),
      secret,
      { algorithms: ['HS256'] },
    )
  }

  function makeServerToken(user) {
    const payload = {
      exp: Math.floor(Date.now() / 1000) + 3000,
      channel_id: user.channel_id,
      user_id: ownerId,
      role: 'external',
      pubsub_perms: {
        send: [ "*" ],
      },
    };
    return jsonwebtoken.sign(payload, secret, { algorithm: 'HS256' });
  }

  router.use(errorHandleWrapper(async (req, res, next) => {

    if (req.headers.authorization) {
      extractToken(req.headers.authorization)
    }
    next()

  }))
  
  router.use((req, res, next) => {

    if (user.role === 'broadcater') res.status(401).send()
    next()

  }),

  router.post('/start-app', errorHandleWrapper(async (req, res) => {

    // define collor for each user
    const users = await Users.startApp(user.channel_id)
    users.forEach(async (user, index) => {
      const { color } = await Users.findOneAndUpdate({
        opaque_user_id: user.opaque_user_id
      }, {
        color: index % 2 ? 'red' : 'blue'
      })
      io.emit(`${user.opaque_user_id}-color`, color)
    })
    res.send(users)

  }))

  return router
}