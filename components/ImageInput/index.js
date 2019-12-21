// @flow

import React, { type ComponentType } from "react";
import styled from "styled-components";
type ImageInputProps = {
  className?: string,
  showButton?: boolean,
  onChange: function,
};
function handleFiles(files) {
  const outputFiles = [];
  for(let file of files){
    //skip non image files
    if (!file.type.startsWith('image/')){ continue; }
    console.log('handling file..', file);
    outputFiles.push({
      src: URL.createObjectURL(file),
      filename: file.name,
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
const ImageInput = (({ className = '', showButton = true, onChange }) => {
  className += ' ImageInput';
  return (
    <div className={className}>
      {showButton && (
        <>
          <label>Upload image</label>
          <input type="file" name="myImage" accept="image/*" onChange={e=>{
            const files = e.target.files;
            const filesAsImgProps = handleFiles(files);
            onChange({ filesAsImgProps, files});
          }}/>
        </>
      )}
    </div>
  );
})

const ImageInputStyled = (styled(ImageInput)`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
`: ComponentType<ImageInputProps>);
export default ImageInputStyled;
