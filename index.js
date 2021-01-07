const express = require('express')
const bodyParser = require("body-parser")
const cors = require('cors')
const app = express()
const server = require('http').createServer(app)
const io = require('socket.io')(server, {
  cors: {
    origin: "http://localhost:8080",
    methods: ["GET", "POST"],
    allowedHeaders: ["Authorization"],
    credentials: true
  }
});
const routes = require('./routes')(io)

const port = process.env.PORT || 4000

app.use(cors({}))

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

server.listen(port, function() {
})

app.use('/', routes)
