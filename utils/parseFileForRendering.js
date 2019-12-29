import { filenameToMediaType } from "../config/mediaTypes";

export function blobUriFromResponse(data, contentType) {
  const blob =
    data instanceof File ? data : new Blob([data], { type: contentType });
  const src = URL.createObjectURL(blob); //possibly `webkitURL` or another vendor prefix for old browsers.
  return src;
}
export function rawStringFromResponse(data) {
  return data.toString();
}

function parseResponse(
  data,
  { contentType, mediaType = "", filename = "" } = {}
) {
  const output = {};
  if (!mediaType) {
    //if no mediaType, attempt to assume it from the filename (filename)
    mediaType = filenameToMediaType(filename);
  }
  if (mediaType === "image/svg+xml") {
    //dangerously set inner html...
    output.dangerousInnerHTML = rawStringFromResponse(data);
  } else if (mediaType.startsWith("image")) {
    //if no media type, assume its an image.
    output.src = blobUriFromResponse(data, mediaType || contentType);
    output.isImage = true;
  } else if (mediaType === "application/json") {
    output.json = JSON.parse(rawStringFromResponse(data));
  } else if (mediaType.startsWith("text/")) {
    output.text = rawStringFromResponse(data);
    output.textType = mediaType.split("/")[1];
  }
  return output;
}
export default parseResponse;
