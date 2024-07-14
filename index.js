import { createServer } from 'http';
import { Server } from 'socket.io';
import { sendEmail } from './mail.js';
import { uploadImg, deleteImg } from './cloudinary.js';

const http = createServer();

const io = new Server(http, {
    cors: { origin: "*" },
    methods: ["GET", "POST"],
    maxHttpBufferSize: 1e7
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
                if(!users.hasOwnProperty(recipientId)) return;
                console.log(`sending notification to ${recipientId}!`);
                users[recipientId].emit('notification');
            }   
        });
    });

    socket.on('mail', async (mailOptions) => {
        try {
            const response = await sendEmail(mailOptions);
            console.log(response)
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

    socket.on('uploadImg', async (imgBuffer) => {
        console.log('uploading img')
        const imgUrl = await uploadImg(imgBuffer, uid);
        users[uid].emit('imgURL', imgUrl);
    });

    socket.on('deleteImg', async () => {
        console.log('checking img')
        deleteImg(uid);
    })
});

const PORT = process.env.PORT || 10000;

http.listen(PORT, ()=>{
    console.log(`started on port ${PORT}`); 
});