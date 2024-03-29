import { v2 as cloudinary } from 'cloudinary'

const { cloud_name, api_key, api_secret } = JSON.parse(process.env.CLOUDINARY)

cloudinary.config({ secure: true, cloud_name, api_key, api_secret })

export async function uploadImg(imgBuffer, uid) {
    const uploadOptions = { 
        public_id: uid,
        folder: "Join_userImg"
    }

    const uploadResult = await new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(uploadOptions, (error, uploadResult) => {
        if (error) return reject(error)
        return resolve(uploadResult)
    }).end(imgBuffer)
});
    console.log(uploadResult)
    return uploadResult?.url
}

export async function deleteImg(uid) {
    const deleteResult = await new Promise((resolve, reject) => {
        cloudinary.api.delete_resources(`Join_userImg/${uid}`, (error, deleteResult) => {
            if (error) return reject(error)
            return resolve(deleteResult)
        })
    })
    return deleteResult?.deleted
}