const http = require('http').createServer();

const io = require('socket.io')(http, {
    cors: { origin: "*" }
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