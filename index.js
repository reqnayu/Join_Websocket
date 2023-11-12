import {createServer} from 'http';
import {createTransport, createTestAccount} from 'nodemailer';
import {Server} from 'socket.io';
// import {google} from 'googleapis';
const http = createServer();

const port = process.env.PORT;

const io = new Server(http, {
    cors: { origin: "*" },
    methods: ["GET", "POST"]
});

let users = {};

const {CLIENT_ID, CLIENT_SECRET, USER, REFRESH_TOKEN} = process.env;
// const REDIRECT_UI = "https://developers.google.com/oauthplayground";

// const oAuth2Client = new google.auth.OAuth2(
//     CLIENT_ID,
//     CLIENT_SECRET,
//     REDIRECT_UI
// )

// oAuth2Client.setCredentials({refresh_token: REFRESH_TOKEN});


async function mailSetup() {
    const testUser = await createTestAccount();
    const {user, pass} = testUser;
    console.log(`user: ${user}, pass: ${pass}`)
    // const ACCESS_TOKEN = await oAuth2Client.getAccessToken();
    const transporter = createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
            type: "login",
            user,
            pass
            // clientId: CLIENT_ID,
            // clientSecret: CLIENT_SECRET,
            // refreshToken: REFRESH_TOKEN,
            // accessToken: ACCESS_TOKEN
        },
        tls: {
            rejectUnauthorized: false
        }
    });
}
mailSetup();

async function sendEmail({to, subject, html}) {

    const mailOptions = {
        from: USER,
        to,
        subject,
        html
    }
    
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) return console.log(error);
        console.log(`Message sent, ${info.messageId}`)
    });
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