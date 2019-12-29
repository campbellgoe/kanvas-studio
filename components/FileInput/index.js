// @flow

import React, { type ComponentType } from "react";
import styled from "styled-components";
import { formats } from "../../config/mediaTypes";
import parseFileForRendering from "../../utils/parseFileForRendering";
type FileInputProps = {
  className?: string,
  showButton?: boolean,
  onChange: function
};
function processFiles(files) {
  const outputFiles = [];
  for (let file of files) {
    const blobSrc = URL.createObjectURL(file);
    // //skip non image files
    // if (!file.type.startsWith("image/")) {
    //   console.warn("skipping file type", file.type);
    //   continue;
    // }
    console.log("handling file..", file);
    outputFiles.push({
      originalFile: file,
      blobSrc
    });
  }
  return outputFiles;
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
            onChange={e => {
              const files = e.target.files;
              const processedFiles = processFiles(files);
              onChange(processedFiles);
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
`: ComponentType<FileInputProps>);
export default FileInputStyled;
