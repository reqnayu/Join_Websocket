const http = require('http').createServer();

const options = {
    requestCert: false,
    rejectUnauthorized: false
}
// const http = require('https').createServer(options);

const port = process.env.PORT;

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

http.listen(port, ()=>{
    console.log(`started on port ${port}`)
});