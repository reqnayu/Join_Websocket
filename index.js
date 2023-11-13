import {createServer} from 'http';
import {createTransport, createTestAccount, getTestMessageUrl} from 'nodemailer';
import {Server} from 'socket.io';
// import {google} from 'googleapis';
const http = createServer();

const port = process.env.PORT;

const io = new Server(http, {
    cors: { origin: "*" },
    methods: ["GET", "POST"]
});

let users = {};

const {CLIENT_ID, CLIENT_SECRET, USER, REFRESH_TOKEN, PASS} = process.env;
// console.log(USER, PASS)
// const REDIRECT_UI = "https://developers.google.com/oauthplayground";

// const oAuth2Client = new google.auth.OAuth2(
//     CLIENT_ID,
//     CLIENT_SECRET,
//     REDIRECT_UI
// )

// oAuth2Client.setCredentials({refresh_token: REFRESH_TOKEN});

let transporter;
async function mailSetup() {
    // const testUser = await createTestAccount();
    // const {user, pass} = testUser;
    console.log(`user: ${USER}, pass: ${PASS}`)
    // const ACCESS_TOKEN = await oAuth2Client.getAccessToken();
    transporter = createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            // type: "login",
            USER,
            PASS
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
        from: `Join <${USER}>`,
        to,
        subject,
        html
    }
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) return console.log(error);
        const preview = getTestMessageUrl(info);
        console.log(preview)
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