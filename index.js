import {createServer} from 'http';
import {createTransport} from 'nodemailer';
import {Server} from 'socket.io';
const http = createServer();

const {USER, PASS, port} = process.env;

const io = new Server(http, {
    cors: { origin: "*" },
    methods: ["GET", "POST"]
});

let users = {};

const transporter = createTransport({
    service: "gmail",
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: USER,
        pass: PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

async function sendEmail({to, subject, html}) {
    
    const mailOptions = {
        from: `Join <${USER}>`,
        to,
        subject,
        html
    }
    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                reject(error);
            }
            resolve()
        });

    })
    
}


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
    })
});

http.listen(port, ()=>{
    console.log(`started on port ${port}`)
});