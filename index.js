// const app = require('express')();

// const http = require('http').createServer();

const options = {
    requestCert: false,
    rejectUnauthorized: false
}
const http = require('https').createServer(options);


// app.use(function(req, res, next) {
//     // console.log(req.header("Access-Control-Allow-Origin"));
//     res.setHeader("Access-Control-Allow-Origin", "*:*");
//     res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
//     next();
// });

const io = require('socket.io')(http, {
    cors: { origin: "*:*" },
    methods: ["GET", "POST"]
});

io.engine.on('initial_headers', (headers, req) => {
    headers["Access-Control-Allow-Origin"] = "*:*"
});

io.engine.on("connection_error", (err) => {
    console.log(err.req);      // the request object
    console.log(err.code);     // the error code, for example 1
    console.log(err.message);  // the error message, for example "Session ID unknown"
    console.log(err.context);  // some additional error context
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