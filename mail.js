import {createTransport} from 'nodemailer';

const {USER, PASS} = process.env;

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

export { sendEmail };