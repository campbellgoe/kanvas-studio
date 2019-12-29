const mapOfFormatsToMediaTypes = {
  ".svg": "image/svg+xml",
  ".txt": "text/plain",
  ".log": "text/plain",
  ".html": "text/html",
  ".xml": "text/xml",
  ".csv": "text/csv",
  ".css": "text/css",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".json": "application/json"
};

export const filenameToMediaType = key => {
  //first try with a 3 letter format
  const freakey = key.slice(key.length - 4);
  //console.log("freakey", freakey);
  let mediaType = mapOfFormatsToMediaTypes[freakey];
  if (!mediaType) {
    //else try with a 4 letter format
    const forkey = key.slice(key.length - 5);
    //console.log("forkey", forkey);
    mediaType = mapOfFormatsToMediaTypes[forkey];
  }
  //console.log("mediaType from key", key, mediaType);
  return mediaType || "";
};

export const mediaTypes = Object.values(mapOfFormatsToMediaTypes);

export const formats = Object.keys(mapOfFormatsToMediaTypes);

export default mapOfFormatsToMediaTypes;
