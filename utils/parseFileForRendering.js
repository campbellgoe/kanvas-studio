import { filenameToMediaType } from "../config/mediaTypes";

export function blobUriFromResponse(data, contentType) {
  const blob =
    data instanceof File ? data : new Blob([data], { type: contentType });
  const src = URL.createObjectURL(blob); //possibly `webkitURL` or another vendor prefix for old browsers.
  return src;
}
export function rawStringFromResponse(data) {
  return new Promise((resolve, reject) => {
    if (data instanceof File || data instanceof Blob) {
      //use file reader to read the file as text
      const reader = new FileReader();

      reader.addEventListener(
        "load",
        function() {
          const fileText = reader.result;
          console.log("file text:", fileText);
          resolve(fileText);
        },
        false
      );

      reader.readAsText(data);
    } else {
      resolve(data.toString());
    }
  });
}

async function parseFileForRendering(
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
    output.dangerousInnerHTML = await rawStringFromResponse(data);
  } else if (mediaType.startsWith("image")) {
    //if no media type, assume its an image.
    output.src = blobUriFromResponse(data, mediaType || contentType);
    output.isImage = true;
  } else if (mediaType === "application/json") {
    output.json = JSON.parse(await rawStringFromResponse(data));
  } else if (mediaType.startsWith("text/")) {
    output.text = await rawStringFromResponse(data);
    output.textType = mediaType.split("/")[1];
  }
  return output;
}
export default parseFileForRendering;
