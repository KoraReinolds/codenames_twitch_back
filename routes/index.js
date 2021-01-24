
module.exports = function(io) {
  const express = require('express')
  const jsonwebtoken = require('jsonwebtoken')
  const router = express.Router()
  const key = process.env.TWITCH_SECRET_KEY
  const secret = Buffer.from(key, 'base64')
  const Rooms = require('../models/rooms')(io)
  const Users = require('../models/users')(io)
  const Game = require('../models/game')(io)
  const TwitchAPI = require('../api')

  async function init() {
    const listEmpty = !(await Game.countWords())
    if (listEmpty) {
      Game.insertWords([ 'дверка', 'темница', 'латы', 'холст', 'лиска', 'кариатида', 'лента', 'барыш', 'мускулатура', 'алкоголь', 'клюшка', 'земляника', 'коррозия', 'патефон', 'мост', 'сталь', 'ванна', 'луна', 'увал', 'автомодель', 'айва', 'тюльпан', 'шампунь', 'седло', 'тир' ])
    }
  }

  async function sendUserInformation({ opaque_user_id }) {

    const data = {}

    await Users.
      findOne({ opaque_user_id }).
      populate('channel_ref').
      exec(function (err, user) {

        const room = user.channel_ref

        if (room.wordList) {
          data.wordList = room.wordList
        }
        if (user.team_leader) {
          data.wordColorList = {
            blackWordList: room.blackWordList,
            redWordList: room.redWordList,
            blueWordList: room.blueWordList,
          }
        }
        data.user = user

        io.emit(`${opaque_user_id}`, data)

      })
  

  }

  init()

  io.on('connection', async socket => {

    const userInfo = extractToken(socket.request.headers.authorization)
    const registredUser = await Users.registerUser(userInfo)
    sendUserInformation(registredUser)

    // console.log('conect ', userInfo)

    socket.on('disconnect', () => {
      console.log('disconect')
      if (userInfo.role === 'broadcaster') {
        Rooms.removeRoom(userInfo.channel_id)
        Users.removeUsersFromRoom(userInfo.channel_id)
      } else {
        Users.disableUserFromRoom(userInfo)
      }
    })
    
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

  router.use(errorHandleWrapper(async (req, res, next) => {

    if (req.headers.authorization) {
      req.user = extractToken(req.headers.authorization)
    }
    next()

  }))

  router.use((req, res, next) => {

    if (req.user && req.user.role === 'broadcater') res.status(401).send()
    next()

  }),
  
  router.get('/test', errorHandleWrapper(async (req, res) => {

    res.send(await TwitchAPI.getUserById(req.user))

  })),

  router.post('/send-word', errorHandleWrapper(async (req, res) => {

    const newRoom = await Rooms.addToHistory({
      channel_id: req.user.channel_id,
      ...req.body
    })

    io.emit(`${req.user.channel_id}`, {
      history: newRoom.history,
      curentTurnColor: newRoom.curentTurnColor,
      gameInfo: newRoom.gameStatus,
      allowChooseCards: newRoom.allowChooseCards,
    })

    setTimeout(async () => {
      const turnColor = req.body.color === 'red' ? 'blue' : 'red'
      const room = await Rooms.toggleTurn(req.user.channel_id, turnColor)
      console.log(room)

      io.emit(`${req.user.channel_id}`, {
        curentTurnColor: room.curentTurnColor,
        gameInfo: room.gameStatus,
        allowChooseCards: room.allowChooseCards,
      })

    }, 1000)

    res.send()

  })),

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
      io.emit(`${updatedUser.opaque_user_id}`, { teamColor: color })

    })

    await Promise.all(usersColor)

    // define team leaders
    const [firstLeader, secondLeader] = await Users.getTeamLeaders(req.user.channel_id)
    
    // send random word list
    const wordList = await Game.generateWordList()
    await Rooms.setWordList(req.user.channel_id, wordList)
    const room = await Rooms.getRoomById(req.user.channel_id)

    io.emit(`${req.user.channel_id}`, {
      curentTurnColor: room.curentTurnColor,
      gameInfo: room.gameStatus,
      wordList,
    })
    sendUserInformation(firstLeader)
    sendUserInformation(secondLeader)

    res.send({ type: 'ok' })

  }))

  return router
}