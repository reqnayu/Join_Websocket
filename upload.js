import { google } from "googleapis";
import { Duplex } from "stream";

function getDrive() {
    const keyFile = "apiKey.json";
    const scopes = ["https://www.googleapis.com/auth/drive"];

    const auth = new google.auth.GoogleAuth({ keyFile, scopes });

    const driveService = google.drive({ version: "v3", auth });
    return driveService;
}

const drive = getDrive();

async function uploadImg(file, fileName) {
  const folderId = "1yEznhW0rMVCmOO5oNeKCHRLz9TkFjFcp";

  const {data: {files}} = await drive.files.list({
    q: `name = ${fileName}`,
    fields: 'files(id, name)',
  });
  console.dir(files);
  return;
  await uploadFile(folderId, file, fileName);
}

async function uploadFile(folderId, file, fileName) {
  const readableStream = new Duplex();
  readableStream.push(file);
  readableStream.push(null);

  const {data: { id, name }} = await drive.files.create({
    resource: {
      name: fileName,
      parents: [folderId],
    },
    media: {
      mimeType: `image/*`,
      body: readableStream,
    },
    fields: "id,name",
  });
  console.log(`File uploaded: ${id}, ${name}`);
}

export { uploadImg };
