import path from 'path';
import fs from 'fs';
import { google } from 'googleapis';

function getDrive() {
    const keyFile = path.join(__dirname, 'service.json');
    const scopes = ['https://www.googleapis.com/auth/drive'];

    const auth = new google.auth.GoogleAuth({ keyFile, scopes });

    const driveService = google.drive({ version: 'v3', auth });
    return driveService;
}

const drive = getDrive();

async function uploadImg(filePath, fileName) {
    const folderId = "1yEznhW0rMVCmOO5oNeKCHRLz9TkFjFcp";
    const { data: { id, name } = {} } = await drive.files.create({
        resource: {
          name: fileName,
          parents: [folderId],
        },
        media: {
          mimeType: `image/${fileExtension}`,
          body: fs.createReadStream(filePath),
        },
        fields: 'id,name',
      });
      console.log(`File uploaded: ${id}, ${name}`);
}

export { uploadImg };