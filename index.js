// const http = require('http').createServer();

const express = require("express");
const app = express();
// Set middleware of CORS 
app.use((req, res, next) => {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://tarik-uyan.developerakademie.net"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS,CONNECT,TRACE"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Content-Type-Options, Accept, X-Requested-With, Origin, Access-Control-Request-Method, Access-Control-Request-Headers, Access-Control-Allow-Origin"
  );
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Private-Network", true);
  //  Firefox caps this at 24 hours (86400 seconds). Chromium (starting in v76) caps at 2 hours (7200 seconds). The default value is 5 seconds.
  res.setHeader("Access-Control-Max-Age", 7200);

  next();
});

const options = {
    requestCert: false,
    rejectUnauthorized: false
}
const http = require('https').createServer(options);

const io = require('socket.io')(http, {
    cors: { origin: "*" },
    methods: ["GET", "POST"]
});

let users = {};

io.on('connection', (socket) => {
    const uid = socket.handshake.query.uid;
    if (!uid) return;
    console.log(`new client with id '${uid}' connected!`)
    users[uid] = socket;
    console.log(Object.keys(users))

    socket.on('message', (message) => {
        console.log(`message received!`);
        const {recipient} = message;
        console.log(message);
        if (users[recipient]) {
            console.log(`sending message to ${uid}!`);
            users[recipient].emit('message', message);
        }
    });

    socket.on('disconnect', () => {
        console.log('client disconnected!')
        delete users[uid];
        console.log(Object.keys(users))
    })
});

http.listen(8080);