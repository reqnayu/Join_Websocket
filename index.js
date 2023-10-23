const http = require('http').createServer();
const {Resend} = require('resend');
const resend = new Resend('re_jYP2dkzR_9d1n6z7SEHRz5fgeZkE5bGiq');

const port = process.env.PORT;

const io = require('socket.io')(http, {
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

    socket.on('mail', async (mail) => {
        try {
            await resend.emails.send(mail);
            socket.emit('mail-sent', true);
        } catch (e) {
            socket.emit('mail-sent', false);
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