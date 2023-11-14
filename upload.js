import { google } from 'googleapis';
import { Duplex } from 'stream';
import fs from 'fs';

function getDrive() {
    const keyFile = 'apiKey.json';
    const scopes = ['https://www.googleapis.com/auth/drive'];

    const auth = new google.auth.GoogleAuth({ keyFile, scopes });

    const driveService = google.drive({ version: 'v3', auth });
    return driveService;
}

const drive = getDrive();

async function uploadImg(file, fileName = "1234567890") {
    const folderId = "1yEznhW0rMVCmOO5oNeKCHRLz9TkFjFcp";
    // const readableStream = new Duplex();
    // readableStream.push(file);
    // readableStream.push(null);

    const readableStream = fs.createReadStream("1689153888103_5954.jpg");
    const { data: { id, name }} = await drive.files.create({
        resource: {
          name: fileName,
          parents: [folderId],
        },
        media: {
          mimeType: `image/jpg`,
          body: readableStream,
        },
        fields: 'id,name',
      });
      console.log(`File uploaded: ${id}, ${name}`);
}

export { uploadImg };