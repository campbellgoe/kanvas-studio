export default `
// @font-face {
//   font-family: 'GeosansLight';
//   font-display: swap;
//   src: local('GeosansLight'), url('/static/fonts/GeosansLight.ttf') format('truetype');
//   unicode-range: U+000-5FF; /* Latin glyphs */
// }
/* latin */
@font-face {
  font-family: 'Poppins';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: local('Poppins Regular'), local('Poppins-Regular'), url(https://fonts.gstatic.com/s/poppins/v8/pxiEyp8kv8JHgFVrJJfecnFHGPc.woff2) format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
/* latin */
@font-face {
  font-family: 'Poppins Light';
  font-style: normal;
  font-weight: 300;
  font-display: swap;
  src: local('Poppins Light'), local('Poppins-Light'), url(https://fonts.gstatic.com/s/poppins/v8/pxiByp8kv8JHgFVrLDz8Z1xlFd2JQEk.woff2) format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
* {
  box-sizing: border-box;
}
body {
  font-family: 'Poppins', 'Arial Light', 'Helvetica Light', Arial, Helvetica, sans-serif;
  margin: 0;
  padding: 0;
}
::-moz-selection { background: yellow; text-shadow: none; }
  ::selection { background: yellow; text-shadow: none; }
h1, h2, h3, h4, h5, h6 {
  font-family: /*'GeosansLight',*/ 'Poppins Light', 'Arial Light', 'Helvetica Light', Arial, Helvetica, sans-serif;
  font-weight: 300;
  line-height: 1;
}
h1 {
  font-size: 32px;
}
h2 {
  font-size: 24px;
  font-family: 'Poppins', 'Arial Light', 'Helvetica Light', Arial, Helvetica, sans-serif;
  font-weight: 500;
}
h3 {
  font-size: 20px;
}
h4 {
  font-size: 18px;
}
h5 {
  font-size: 16px;
}
h6 {
  font-size: 14px;
}
article {
  margin: 48px 0;
}
a {
  color: #00daff;
  text-decoration: underline;
  :hover {
    color: #8ceeff;
  }
  :visted {
    color: #ff00de;
    :hover {
      color: #ff71ed;
    }
  }
  :active {
    text-decoration: none;
    color: #ff7700;
    :hover {
      color: #ff9f4b;
      text-decoration: underline;
    }
  }
}
`;