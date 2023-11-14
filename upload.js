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

async function uploadImg(file, uid, ext) {
  const folderId = "1yEznhW0rMVCmOO5oNeKCHRLz9TkFjFcp";
  const suffix = Date.now().toString().slice(-4);
  const fileName = `${uid}_${suffix}.${ext}`;

  checkImage(uid, suffix);
  return uploadFile(folderId, file, fileName);
}

async function checkImage(uid, suffix) {
  const {data: {files} = {}} = await drive.files.list({
    q: `name contains '${uid}' and not name contains '${suffix}'`,
    fields: 'files(id)',
  });
  
  const id = files.length ? files[0].id : undefined;
  return (id) ? deleteFile(id) : undefined;
}

function deleteFile(id) {
  console.log(`deleting file: '${id}'`)
  return drive.files.delete({
    fileId: id
  }, (err) => {
    if (err) return console.log('deletion failed!', err)
    console.log('deleted!')
  });
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

  await drive.permissions.create({
    fileId: id,
    requestBody: {
      type: 'anyone',
      role: 'reader'
    }
  });

  console.log(`File uploaded: ${id}, ${name}`);
  return id;
}

export { uploadImg };
