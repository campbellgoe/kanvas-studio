import React from "react";
import styled from "styled-components";
type ImageInputProps = {
  className: string,
  showButton: boolean
};
const ImageInput = styled(({ className = '', showButton = true }: ImageInputProps) => {
  className += ' ImageInput';
  return (
    <div className={className}>
      {showButton && (
        <>
          <label>Upload image</label>
          <input type="file" name="myImage" accept="image/*" />
        </>
      )}
    </div>
  );
})`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
`;
export default ImageInput;
