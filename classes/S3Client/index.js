//TODO: refactor this file

import S3 from "aws-sdk/clients/s3";
import envConfig from "../../env.config.json";
import getDist from "../../utils/getDist";

//polyfill Promise.allSettled
const allSettled = promises => {
  let wrappedPromises = promises.map(({ promise, metadata }) =>
    Promise.resolve(promise).then(
      val => ({ status: "fulfilled", value: val, metadata }),
      err => ({ status: "rejected", reason: err, metadata })
    )
  );
  return Promise.all(wrappedPromises);
};

const accessKeyId = envConfig.AWS_CONFIG_KEY;
const secretAccessKey = envConfig.AWS_CONFIG_SECRET;

const bucketName = envConfig.S3_BUCKET_NAME;

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
function getObjectMetadata({ photoKey, src }) {
  // return new Promise((resolve, reject) => {
  //   s3.headObject({ Bucket: bucketName, Key: photoKey }, function(err, data) {
  //     const resData = JSON.stringify(this.httpResponse.headers);
  //     console.log("getObjectMetadata headers", resData);
  //     if (err) {
  //       return reject(err);
  //     }
  //     resolve({
  //       data,
  //       src
  //     });
  //   });
  // });
}
function getFolderKey(namespace) {
  return encodeURIComponent(namespace) + "/";
}
async function getMetadata(namespace) {
  const folderKey = getFolderKey(namespace);
  try {
    const data = await s3
      .getObject({ Key: folderKey + "metadata.json" })
      .promise();
    //return metadata
    return JSON.parse(data.Body.toString());
  } catch (err) {
    console.error("Error fetching metadata.json;", err);
    return null;
  }
}
function getSrcFromResponse(res) {
  const blob = new Blob([res.Body], { type: res.ContentType });
  const src = URL.createObjectURL(blob); //possibly `webkitURL` or another vendor prefix for old browsers.
  return src;
}
//get nearest files within a range
async function getNearestObjects(namespace, { x, y, range = 1000 }) {
  //first get metadata for this folder
  const metadataMap = await getMetadata(namespace);
  console.log("metadataMap:", metadataMap);
  //metadata is an array of arrays which contains [fileKey, position]
  //for every position that is within range, get that file using the fileKey
  //sort the metadata so that the closest are loaded first
  const objects = metadataMap
    .map(([key, position]) => {
      //WARN: this mapping function assumes the metadata for this key is only the x, y position.
      //get dist from the given x, y which come from the canvas offset (aka camera position).
      const distance = getDist(position, { x, y });
      return {
        key,
        position,
        distance
      };
    })
    .filter(({ distance }) => {
      //get files only within a certain range of the camera
      return distance < range;
    })
    .sort((a, b) => {
      //sort so that the closest files are loaded first
      return a.distance - b.distance;
    });

  //now have an array of { key, position, distance } within a given range
  //and want to get the actual object
  const promises = objects.map(({ key, position, distance }) => {
    return {
      promise: s3.getObject({ Key: key }).promise(),
      metadata: {
        key,
        position,
        distance
      }
    };
  });
  const settled = await allSettled(promises);
  return settled.map(({ status, value, reason, metadata }) => {
    if (status === "rejected") {
      console.warn("Couldn't load ", metadata.key, "\r\nReason:\r\n", reason);
      return Error(reason);
    }
    const src = getSrcFromResponse(value);
    return {
      src,
      metadata
    };
  });

  // return new Promise((resolve, reject) => {
  //   const folderKey = getFolderKey(namespace);

  //   s3.listObjects({ Prefix: folderKey, Delimiter: "/" }, function(
  //     err,
  //     data
  //   ) {
  //     const resData = JSON.stringify(this.httpResponse.headers);
  //     console.log("listFolders headers", resData);
  //     if (err) {
  //       console.error("There was an error viewing your album: " + err.message);
  //       return reject(err);
  //     }
  //     console.log("listObjects data:", data);
  //     // 'this' references the AWS.Response instance that represents the response
  //     const href = this.request.httpRequest.endpoint.href;
  //     const bucketUrl = href + bucketName + "/";

  //     const photos = data.Contents.map(function(photo) {
  //       let photoKey = photo.Key;
  //       const photoUrl = bucketUrl + photoKey;
  //       return {
  //         src: photoUrl,
  //         photoKey
  //       };
  //     });
  //     //if (!getMetadata) {
  //     resolve(photos);
  //     //} else {

  //     // Promise.all(photos.map(photo => getObjectMetadata(photo)))
  //     //   .then(resolve)
  //     //   .catch(reject);
  //     //}
  //   });
  // });
}

function uploadFile(bucketFolderName, files, metadata = {}) {
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
        ACL: "public-read",
        Metadata: metadata
      }
    }
  });
  s3.upload(
    {
      params: {
        Bucket: bucketName,
        Key: photoKey,
        Body: file,
        ACL: "public-read",
        Metadata: metadata
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

export { listBucketFolders, getNearestObjects, createBucketFolder, uploadFile };
