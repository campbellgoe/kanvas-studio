//TODO: refactor this file

import S3 from "aws-sdk/clients/s3";
import envConfig from "../../env.config.json";

const accessKeyId = envConfig.AWS_CONFIG_KEY;
const secretAccessKey = envConfig.AWS_CONFIG_SECRET;

const bucketName = "massless.solutions";
const s3config = {
  credentials: {
    accessKeyId,
    secretAccessKey
  },
  params: { Bucket: bucketName },
  region: "eu-west-2",
  apiVersion: "2006-03-01"
};
console.log("s3 config", s3config);
const s3 = new S3(s3config);
// function getHtml(template) {
//   return template.join("\n");
// }
// function viewBucketFolder(bucketFolderName) {
//   var bucketFolderPhotosKey = encodeURIComponent(bucketFolderName) + "//";
//   s3.listObjects({ Prefix: bucketFolderPhotosKey }, function(err, data) {
//     if (err) {
//       return console.warn("There was an error viewing your bucketFolder: " + err.message);
//     }
//     // 'this' references the AWS.Response instance that represents the response
//     var href = this.request.httpRequest.endpoint.href;
//     var bucketUrl = href + bucketName + "/";

//     var photos = data.Contents.map(function(photo) {
//       var photoKey = photo.Key;
//       var photoUrl = bucketUrl + encodeURIComponent(photoKey);
//       return getHtml([
//         "<span>",
//         "<div>",
//         '<img style="width:128px;height:128px;" src="' + photoUrl + '"/>',
//         "</div>",
//         "<div>",
//         "<span onclick=\"deletePhoto('" +
//           bucketFolderName +
//           "','" +
//           photoKey +
//           "')\">",
//         "X",
//         "</span>",
//         "<span>",
//         photoKey.replace(bucketFolderPhotosKey, ""),
//         "</span>",
//         "</div>",
//         "</span>"
//       ]);
//     });
//     var message = photos.length
//       ? "<p>Click on the X to delete the photo</p>"
//       : "<p>You do not have any photos in this bucketFolder. Please add photos.</p>";
//     var htmlTemplate = [
//       "<h2>",
//       "BucketFolder: " + bucketFolderName,
//       "</h2>",
//       message,
//       "<div>",
//       getHtml(photos),
//       "</div>",
//       '<input id="photoupload" type="file" accept="image/*">',
//       '<button id="uploadFile" onclick="uploadFile(\'' + bucketFolderName + "')\">",
//       "Add Photo",
//       "</button>",
//       '<button onclick="listBucketFolders()">',
//       "Back To BucketFolders",
//       "</button>"
//     ];
//     document.getElementById("app").innerHTML = getHtml(htmlTemplate);
//   });
// }
// function deletePhoto(bucketFolderName, photoKey) {
//   s3.deleteObject({ Key: photoKey }, function(err, data) {
//     if (err) {
//       return console.warn("There was an error deleting your photo: ", err.message);
//     }
//     console.warn("Successfully deleted photo.");
//     viewBucketFolder(bucketFolderName);
//   });
// }
function getBucketFolderNamesFromResponse(data) {
  const bucketFolders = data.CommonPrefixes.map(function(commonPrefix) {
    var prefix = commonPrefix.Prefix;
    var bucketFolderName = decodeURIComponent(prefix.replace("/", ""));
    return bucketFolderName;
  });
  return bucketFolders;
}
function listBucketFolders(cb) {
  s3.listObjects({ Delimiter: "/" }, function(err, data) {
    if (err) {
      return console.warn(
        "There was an error listing your bucketFolders: " + err.message
      );
    } else {
      const bucketFolders = getBucketFolderNamesFromResponse(data);
      cb(bucketFolders);
    }
  });
}

function uploadFile(bucketFolderName, files) {
  if (!files.length) {
    return console.warn("Please choose a file to upload first.");
  }
  if (files.length > 1) {
    console.warn("Can only upload 1 image at a time.");
  }
  var file = files[0].originalFile;

  var bucketFolderPhotosKey = encodeURIComponent(bucketFolderName) + "/";

  var photoKey = bucketFolderPhotosKey + file.name;
  console.log("file to send:", file);
  // Use S3 ManagedUpload class as it supports multipart uploads
  const s3 = new S3({
    ...s3config,
    ...{
      params: {
        Bucket: bucketName,
        Key: photoKey,
        Body: file,
        ACL: "public-read"
      }
    }
  });
  s3.upload(
    {
      params: {
        Bucket: bucketName,
        Key: photoKey,
        Body: file,
        ACL: "public-read"
      }
    },
    (err, data) => {
      if (!err && data) {
        console.warn("Successfully uploaded photo.");
      } else {
        console.warn("Error:" + err);
      }
    }
  );
}

function createBucketFolder(bucketFolderName, cb) {
  bucketFolderName = bucketFolderName.trim();
  if (!bucketFolderName) {
    return console.warn(
      "BucketFolder names must contain at least one non-space character."
    );
  }
  if (bucketFolderName.indexOf("/") !== -1) {
    return console.warn("BucketFolder names cannot contain slashes.");
  }
  var bucketFolderKey = encodeURIComponent(bucketFolderName) + "/";
  s3.headObject({ Key: bucketFolderKey }, function(err, data) {
    if (!err) {
      return console.warn("BucketFolder already exists.");
    }
    if (err.code !== "NotFound") {
      return console.warn(
        "There was an error creating your bucketFolder: " + err.message
      );
    }
    s3.putObject({ Key: bucketFolderKey }, function(err, data) {
      if (err) {
        return console.warn(
          "There was an error creating your bucketFolder: " + err.message
        );
      }
      console.warn("Successfully created bucketFolder.");
      cb(data);
    });
  });
}

export { listBucketFolders, createBucketFolder, uploadFile };
