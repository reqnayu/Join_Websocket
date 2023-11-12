import {createServer} from 'http';
import {createTransport} from 'nodemailer';
import {Server} from 'socket.io';
import {google} from 'googleapis';
const http = createServer();

const port = process.env.PORT;

const io = new Server(http, {
    cors: { origin: "*" },
    methods: ["GET", "POST"]
});

let users = {};

const {CLIENT_ID, CLIENT_SECRET, USER, REFRESH_TOKEN} = process.env;
const REDIRECT_UI = "https://developers.google.com/oauthplayground";

const oAuth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_UI
)

oAuth2Client.setCredentials({refresh_token: REFRESH_TOKEN});

async function sendEmail({to, subject, html}) {

    const ACCESS_TOKEN = await oAuth2Client.getAccessToken();
    const transporter = createTransport({
        service: 'gmail',
        auth: {
            type: "OAuth2",
            user: USER,
            clientId: CLIENT_ID,
            clientSecret: CLIENT_SECRET,
            refreshToken: REFRESH_TOKEN,
            accessToken: ACCESS_TOKEN
        },
        tls: {
            rejectUnauthorized: true
        }
    });

    const mailOptions = {
        from: USER,
        to,
        subject,
        html
    }
    
    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) reject(error);
            resolve(info)
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
        const info = await sendEmail(mailOptions);
        console.log(info)
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