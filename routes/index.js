
module.exports = function(io) {
  const express = require('express')
  const jsonwebtoken = require('jsonwebtoken')
  const router = express.Router()
  const key = process.env.TWITCH_SECRET_KEY
  const secret = Buffer.from(key, 'base64')
  const request = require('request');
  const Rooms = require('../models/rooms')(io)
  const Users = require('../models/users')(io)
  const Game = require('../models/game')(io)
  const ownerId = process.env.OWNER_ID

  async function init() {
    const listEmpty = !(await Game.countWords())
    if (listEmpty) {
      Game.insertWords([ 'дверка', 'темница', 'латы', 'холст', 'лиска', 'кариатида', 'лента', 'барыш', 'мускулатура', 'алкоголь', 'клюшка', 'земляника', 'коррозия', 'патефон', 'мост', 'сталь', 'ванна', 'луна', 'увал', 'автомодель', 'айва', 'тюльпан', 'шампунь', 'седло', 'тир' ])
    }
  }

  init()

  io.on('connection', async socket => {

    const userInfo = extractToken(socket.request.headers.authorization)
    const registredUser = await Users.registerUser(userInfo)
    console.log('conect ', registredUser.role, registredUser.color)

    socket.on('disconnect', () => {
      console.log('disconect')
      if (userInfo.role === 'broadcaster') {
        Rooms.removeRoom(userInfo.channel_id)
        Users.removeUsersFromRoom(userInfo.channel_id)
      } else {
        Users.disableUserFromRoom(userInfo)
      }
    })
    
    socket.emit('user', registredUser)

  })

  const errorHandleWrapper = function(callback) {
    return function (req, res, next) {
      callback(req, res, next)
        .catch(next)
    }
  }

  function extractToken(token) {
    const prefix = 'Bearer '
    return jsonwebtoken.verify(
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
      req.user = extractToken(req.headers.authorization)
    }
    next()

  }))

  router.use((req, res, next) => {

    if (req.user.role === 'broadcater') res.status(401).send()
    next()

  }),

  router.post('/start-app', errorHandleWrapper(async (req, res) => {

    // define collor for each user
    const users = await Users.getActiveUsers(req.user.channel_id)

    const usersColor = users.map(async (user, index) => {

      const color = index % 2 ? 'red' : 'blue'
      const updatedUser = await Users.findOneAndUpdate({
        opaque_user_id: user.opaque_user_id
      }, {
        color
      })
      io.emit(`${updatedUser.opaque_user_id}-color`, color)

    })

    await Promise.all(usersColor)

    // send random word list
    const wordList = await Game.generateWordList()
    await Rooms.setWordList(req.user.channel_id, wordList)
    io.emit(`${req.user.channel_id}-list`, wordList)

    res.send({ type: 'ok' })

  }))

  return router
}