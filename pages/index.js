import React from "react";
import styled from "styled-components";
import { ToastContainer } from "../components/ToastNotifications";
//import React, { useState, useEffect, useRef } from "react";
//import styled, { withTheme } from "styled-components";
//import { useMedia, useOnScreen } from "../utils/customHooks";
//import { useLocalStorage } from "react-use";
//import { useStateValue } from "../utils/state";
//import makeButtonStyles from "../utils/makeButtonStyles";
//import ExternalLink from "../components/ExternalLink";
//const uuid = require("uuid/v4");

const Canvas = styled(({ className = "" }) => {
  className += " Canvas";
  return <canvas className={className}>I'm a canvas</canvas>;
})`
  width: 100%;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
  margin: 0;
  padding: 0;
  background-color: #eeeeee;
`;

const KanvasStudio = ({ className = "" }) => {
  className += " KanvasStudio";
  return (
    <div className={className}>
      <ToastContainer className="ToastContainer" />
      <Canvas />
    </div>
  );
};
export default KanvasStudio;
