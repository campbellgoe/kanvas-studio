//TODO: refactor this file

import S3 from "aws-sdk/clients/s3";
import envConfig from "../../env.config.json";
import getDist from "../../utils/getDist";
import allSettledWithMetadata from "../../utils/allSettledWithMetadata";
import parseFileForRendering from "../../utils/parseFileForRendering";
//polyfill Promise.allSettledWithMetadata + custom data

const accessKeyId = envConfig.AWS_CONFIG_KEY;
const secretAccessKey = envConfig.AWS_CONFIG_SECRET;

const bucketName = envConfig.S3_BUCKET_NAME;

const maxCacheAgeSeconds = 60 * 60; //max age of 1 hour

const s3config = {
  credentials: {
    accessKeyId,
    secretAccessKey
  },
  params: { Bucket: bucketName },
  region: "eu-west-2",
  apiVersion: "2006-03-01"
};
const s3 = new S3(s3config);

function getBucketFolderNamesFromResponse(data) {
  const bucketFolders = data.CommonPrefixes.map(function(commonPrefix) {
    var prefix = commonPrefix.Prefix;
    var bucketFolderName = decodeURIComponent(prefix.replace("/", ""));
    return bucketFolderName;
  });
  return bucketFolders;
}
const dummyBucketFolders = [
  "ahey",
  "dummy namespace 0",
  "dummy namespace 1",
  "dummy namespace 2"
];
function listBucketFolders(cb, bypass = true) {
  if (bypass) return cb(dummyBucketFolders);
  s3.listObjects({ Delimiter: "/" }, function(err, data) {
    if (err) {
      cb(err, ['']);
      return console.warn(
        "There was an error listing your bucketFolders:", err
      );
    } else {
      const bucketFolders = getBucketFolderNamesFromResponse(data);
      cb(err, bucketFolders);
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
async function getMetadata(namespace, bypass = true) {
  if (bypass) {
    return [
      [
        "dummyfile.json",
        { position: { x: 0, y: 0, z: -1, }, mediaType: "application/json" }
      ]
    ];
  }
  const folderKey = getFolderKey(namespace);
  try {
    const data = await s3
      .getObject({ Key: folderKey + "metadata.json" })
      .promise();
    //return metadata
    return JSON.parse(data.Body.toString());
  } catch (err) {
    console.warn("Error fetching metadata.json;", err);
  }
}
const promiseToGetDummyS3Object = key => {
  return {
    Body: JSON.stringify({ hello: "world" }),
    ContentType: "application/json"
  };
};
//get nearest files within a range
async function getNearestObjects(
  namespace,
  { x, y, range = Infinity },
  bypass = true
) {
  //WARN: metadata can be out of sync with files in the folder, e.g. a file may be uploaded, but not stored in metadata.json
  //... this function only gets all files specified in metadata.json
  //first get metadata for this folder
  const metadataMap = (await getMetadata(namespace, bypass)) || [];
  console.log("metadataMap:", metadataMap);
  //metadataMap is an array of arrays which contains [fileKey, {metadata}] where metadata contains { position: { x, y } }
  //for every position that is within range, get that file using the fileKey
  //sort the metadata so that the closest are loaded first
  const objects = metadataMap
    .map(([key, { position, mediaType }]) => {
      //WARN: this mapping function assumes the metadata for this key is only the x, y position.
      //get dist from the given x, y which come from the canvas offset (aka camera position).
      const distance = getDist(position, { x, y });
      return {
        key,
        position,
        distance,
        mediaType
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
  let promises = objects.map(({ key, position, distance, mediaType }) => {
    return {
      promise: bypass
        ? promiseToGetDummyS3Object(key)
        : s3.getObject({ Key: namespace + "/" + key }).promise(),
      metadata: {
        key,
        position,
        distance,
        mediaType
      }
    };
  });
  let settled = await allSettledWithMetadata(promises);
  promises = settled.map(({ status, value, reason, metadata }) => {
    if (status === "rejected") {
      console.warn("Couldn't load ", metadata.key, "\r\nReason:\r\n", reason);
      return Error(reason);
    }
    return {
      promise: parseFileForRendering(value.Body, {
        contentType: value.ContentType,
        mediaType: metadata.mediaType,
        filename: metadata.key
      }),
      metadata
    };
  });
  settled = await allSettledWithMetadata(promises);
  return settled.map(({ status, value, reason, metadata }) => {
    if (status === "rejected") {
      console.warn(
        "Couldn't parse file data of",
        metadata.key,
        "\r\nReason:\r\n",
        reason
      );
      return Error(reason);
    }
    const dataForRender = value;
    return {
      dataForRender,
      ...metadata
      // key: metadata.key,
      // position: metadata.position,
      // mediaType: metadata.mediaType
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

function uploadFile(bucketFolderName, files, metadata, bypass = true) {
  if (bypass)
    return console.warn(
      "bypassing upload file to S3 (take care of unecessary costs)",
      files
    );
  if (!files.length) {
    return console.warn("Please choose a file to upload first.");
  }
  if (files.length > 1) {
    console.warn("Can only upload 1 image at a time.");
  }
  var file = files[0];

  var bucketFolderPhotosKey = encodeURIComponent(bucketFolderName) + "/";

  var photoKey = bucketFolderPhotosKey + file.name;
  console.log("file to send:", file);
  const Metadata = metadata;
  console.log("Metadata:", Metadata);
  // Use S3 ManagedUpload class as it supports multipart uploads
  const s3 = new S3({
    ...s3config,
    ...{
      params: {
        Bucket: bucketName,
        Key: photoKey,
        Body: file,
        ACL: "public-read",
        Metadata
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
        Metadata
      }
    },
    (err, data) => {
      if (!err && data) {
        console.warn("Successfully uploaded file.", data);
      } else {
        console.warn("Error:", err);
      }
    }
  );
}

function createBucketFolder(bucketFolderName, cb, bypass = true) {
  if (bypass) {
    console.warn("bypassing createBucketFolder for", bucketFolderName);
    return cb(null);
  }
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
    s3.putObject(
      {
        Key: bucketFolderKey,
        CacheControl: "public, max-age=" + maxCacheAgeSeconds
      },
      function(err, data) {
        if (err) {
          return console.warn(
            "There was an error creating your bucketFolder: " + err.message
          );
        }
        console.warn("Successfully created bucketFolder.");
        cb(data);
      }
    );
  });
}

export const deleteObject = (namespace, key) => {
  const Key = getFolderKey(namespace) + key;
  return s3.deleteObject({ Key }).promise();
};

export { listBucketFolders, getNearestObjects, createBucketFolder, uploadFile };
