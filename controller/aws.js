const aws = require("aws-sdk")

aws.config.update({
    accessKeyId: "AKIAQJAOIC75Q2FDGCOY",
    secretAccessKey: "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",
    region: "ap-south-1"
})

const removeFile = async (file) => {
    return new Promise(function (resolve, reject) {
        // this function will upload file to aws and return the link
        let s3 = new aws.S3({ apiVersion: '2006-03-01' });

        var removeParams = {
            
            Bucket: "sourav-ekart",
            Key: "abc/" + file.originalname,
            
        }
        s3.deleteObject(removeParams, function (err, data) {
            if (err) {
                console.log("Error during image removed")
                return reject({ "error": err })
            } else {
                console.log('Successfully deleted the object from S3.');
                
            }


        })

    })
}


const uploadFile = async (file) => {
    return new Promise(function (resolve, reject) {
        // this function will upload file to aws and return the link
        let s3 = new aws.S3({ apiVersion: '2006-03-01' });

        var uploadParams = {
            ACL: "public-read",
            Bucket: "sourav-ekart",
            Key: "abc/" + file.originalname,
            Body: file.buffer
        }
        s3.upload(uploadParams, function (err, data) {
            if (err) {
                return reject({ "error": err })
            }
            console.log("File uploaded succesfully")
            return resolve(data.Location)
        })

    })
}



module.exports.uploadFile = uploadFile
module.exports.removeFile = removeFile



