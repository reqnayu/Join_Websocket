import { createServer } from 'http';
import { Server } from 'socket.io';
import { sendEmail } from './mail.js';
import { uploadImg } from './upload.js'

const http = createServer();

const io = new Server(http, {
    cors: { origin: "*" },
    methods: ["GET", "POST"]
});

let users = {};

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

    socket.on('mail', async (mailOptions) => {
        try {
            await sendEmail(mailOptions);
            users[uid].emit('mailSent');
        } catch(e) {
            users[uid].emit('mailFailed');
        }
        
    });

    socket.on('disconnect', () => {
        console.log('client disconnected!')
        delete users[uid];
        console.log(Object.keys(users))
    });

    socket.on('uploadImg', (img) => {
        uploadImg(img, users[uid]);
    });
});

const {PORT} = process.env;

http.listen(PORT, ()=>{
    console.log(`started on port ${PORT}`)
});