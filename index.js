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

// const {CLIENT_ID, CLIENT_SECRET, USER, REFRESH_TOKEN, PASS} = process.env;
const CLIENT_ID = "470427326628-ld6u3mi3eh604ipc3g9bb7pj1h69mfku.apps.googleusercontent.com";
const CLIENT_SECRET = "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";
const USER = "noreply.info.join@gmail.com"
const REFRESH_TOKEN = "1//047DtEF64hTClCgYIARAAGAQSNwF-L9IrBX9XDIfjFmHOtmqX0BvcXKkW5qrjGya7fXgiOXbSm2WjJAJeLnN0brCrBNDnsigHJYo"
const ACCESS_TOKEN = "ya29.a0AfB_byBPuoQIMNuBQclQXfLizhie5EADJ6E8v34_TWq76xf-bgA5kffVxpFBxcy6kvTkzmA7JWITvlB0C-Nfcul7WQFUHJbS3CVAO58R95lyBKmzGgYnHJu5p4Zms-uOEU_kiaK4iJWI9y4GeTAsKmIAMRB93uJuHU2aaCgYKAcQSARESFQHGX2MimpSEkjrdbAF7HOTMcJ8pPQ0171";

console.log(`user: ${USER}`);
console.log(`client_id: ${CLIENT_ID}`);
console.log(`client_secret: ${CLIENT_SECRET}`);
console.log(`refresh_token: ${REFRESH_TOKEN}`);
console.log(`access: ${ACCESS_TOKEN}`);

const REDIRECT_UI = "https://developers.google.com/oauthplayground";

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
    // const ACCESS_TOKEN = await new Promise((resolve, reject) => {
    //     oAuth2Client.getAccessToken((error, token) => {
    //         if (error) reject(error);
    //         resolve(token);
    //     })
    // })
    // console.log(`access_token: ${ACCESS_TOKEN}`)
    transporter = createTransport({
        service: "gmail",
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            type: "OAuth2",
            user: USER,
            // PASS
            clientId: CLIENT_ID,
            clientSecret: CLIENT_SECRET,
            refreshToken: REFRESH_TOKEN,
            accessToken: ACCESS_TOKEN
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
        console.log("Message sent!")
        // const preview = getTestMessageUrl(info);
        // console.log(preview)
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