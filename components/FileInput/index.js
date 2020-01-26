//      

import React, {                    } from "react";
import styled from "styled-components";
import { formats } from "../../config/mediaTypes";
import parseFileForRendering from "../../utils/parseFileForRendering";
import allSettledWithMetadata from "../../utils/allSettledWithMetadata";
                       
                     
                       
                    
  
async function processFiles(files) {
  const promises = [];
  for (let file of files) {
    if (file.name === "metadata.json") {
      alert(
        "metadata.json is not currently an allowed filename, please rename it."
      );
      continue;
    }
    const promiseToGetDataForRender = parseFileForRendering(file, {
      mediaType: file.type,
      filename: file.name
    });
    //const blobSrc = URL.createObjectURL(file);
    // //skip non image files
    // if (!file.type.startsWith("image/")) {
    //   console.warn("skipping file type", file.type);
    //   continue;
    // }
    console.log("handling file..", file);
    promises.push({
      promise: promiseToGetDataForRender,
      metadata: {
        filename: file.name,
        originalFile: file
      }
    });
  }
  const settled = await allSettledWithMetadata(promises);
  const filesWithDataForRender = settled.map(
    ({ status, value, reason, metadata }) => {
      if (status === "rejected") {
        console.warn(
          "Couldn't parse chosen file",
          metadata.filename,
          "\r\nReason:\r\n",
          reason
        );
        return Error(reason);
      }
      return {
        dataForRender: value,
        ...metadata
      };
    }
  );
  return filesWithDataForRender;
  // for (let i = 0; i < files.length; i++) {
  //   const file = files[i];

  //   if (!file.type.startsWith('image/')){ continue }

  //   const img = document.createElement("img");
  //   img.classList.add("obj");
  //   img.file = file;
  //   preview.appendChild(img); // Assuming that "preview" is the div output where the content will be displayed.

  //   const reader = new FileReader();
  //   reader.onload = (function(aImg) { return function(e) { aImg.src = e.target.result; }; })(img);
  //   reader.readAsDataURL(file);
  // }
}
const FileInput = ({ className = "", showButton = true, onChange }) => {
  className += " FileInput";
  return (
    <div className={className}>
      {showButton && (
        <>
          <label>Upload image</label>
          <input
            type="file"
            name="myImage"
            accept={["image/*", "text/*", ...formats].join(", ")}
            onChange={async function(e) {
              const files = e.target.files;
              const processedFiles = await processFiles(files);
              if (processedFiles.length) onChange(processedFiles);
            }}
          />
        </>
      )}
    </div>
  );
};

const FileInputStyled = (styled(FileInput)`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  margin-top: 16px;
`                               );
export default FileInputStyled;
