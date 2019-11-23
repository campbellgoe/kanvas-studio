const makeButtonStyles = ({
  fontFamily = "sans-serif",
  textColor = "black",
  backgroundColor = "white"
}) => {
  return `
        transition: 0.28s;
        appearance: none;
        text-decoration: none;
        color: ${textColour};
        background-color: ${backgroundColor};
        border-radius: 3px;
        font-family: ${fontFamily};
        cursor: pointer;
        min-height: 49px;
        height: 100%;
        min-width: 25%;
        :first-child {
          margin-left: 0;
        }
        :last-child {
          margin-right: 0;
        }
        :hover {
          text-decoration: underline;
          filter: brightness(1.1);
        }
      `;
};
export default makeButtonStyles;
