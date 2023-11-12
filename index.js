import {createServer} from 'http';
import {createTransport} from 'nodemailer';
import {Server} from 'socket.io';
const http = createServer();

const port = process.env.PORT;

const io = new Server(http, {
    cors: { origin: "*" },
    methods: ["GET", "POST"]
});

let users = {}; 

const {user, clientId, clientSecret, pass} = process.env;
console.log(`user: ${user}, pass: ${pass}`)
const transporter = createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        // type: "OAuth2",
        user,
        pass
        // clientId,
        // clientSecret
    },
    tls: {
        rejectUnauthorized: false
    }
});

io.on('connection', (socket) => {
    const uid = socket.handshake.query.uid;
    if (!uid) return;
    console.log(`new client with id '${uid}' connected!`);
    if (users[uid]) return socket.emit('account-in-use');
    users[uid] = socket;
    console.log(Object.keys(users))

    socket.on('notification', (notification) => {
        console.log(`notification received!`);
        const {to} = notification;
        if (!to) return console.log('no recipients')
        to.forEach(recipientId => {
            if (users[recipientId]) {
                console.log(`sending notification to ${recipientId}!`);
                if (users.hasOwnProperty(recipientId)) users[recipientId].emit('notification');
            }   
        });
    });

    socket.on('mail', async (mail) => {
        transporter.sendMail(mail, (error, info) => {
            if (error) return console.log(error);
            console.log(`Message sent: %s`)
        })
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