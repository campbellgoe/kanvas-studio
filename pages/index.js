import React, { useRef, useEffect, useState, useCallback } from "react";
import styled from "styled-components";
import { ToastContainer } from "../components/ToastNotifications";
import { window } from 'ssr-window';
import useEventListener from '@toolia/use-event-listener';
//import { useLocalStorage } from "react-use";
//import React, { useState, useEffect, useRef } from "react";
//import styled, { withTheme } from "styled-components";
//import { useMedia, useOnScreen } from "../utils/customHooks";
//import { useStateValue } from "../utils/state";
//import makeButtonStyles from "../utils/makeButtonStyles";
//import ExternalLink from "../components/ExternalLink";
//const uuid = require("uuid/v4");

const origin = {
  x: 0,
  y: 0,
  z: 0
};

const initialSize = { width: 300, height: 150 };
const Grid = ({ className = ""}) => {
  className += " Grid";
  const elGrid = useRef(null);
  const [size, setListenToSize] = useEventListener(window, 'resize', () => {
    return {
      width: window.innerWidth,
      height: window.innerHeight
    }
  }, true);
  const { width, height } = size || initialSize;
  
  return (
    <div className={className} ref={elGrid}>
      <Canvas className="GridCanvas" width={width} height={height}/>
      <p>width: {width}</p>
      <p>height: {height}</p>
      <button onClick={()=>setListenToSize(false)}>Un-listen</button>
      <button onClick={()=>setListenToSize(true)}>Listen</button>
    </div>
  );
};
const Canvas = styled(({ className = "", width = 300, height = 150 }) => {
  className += " Canvas";
  const elCanvas = useRef(null);
  const [ctx, setCtx] = useState(null);
  useEffect(()=>{
    setCtx(elCanvas.current.getContext("2d"));
    console.log('set ctx');
  }, elCanvas.current)
  useEffect(() => {
    console.log("setting canvas size", width, height);
    //on Canvas mount, get canvas context, set canvas width and height, and make first paint.
    const canvas = elCanvas.current;
    canvas.width = width;
    canvas.height = height;
    
  }, [width, height]);
  useEffect(() => {
    console.log("on render, ctx:", ctx);
  });
  return <canvas className={className} ref={elCanvas} />;
})`
  background-color: red;
`;
const Plane = styled(({ className = "", displayGrid = true }) => {
  className += " Plane";
  const [coords, setCoords] = useState(origin);
  return (
    <div className={className}>
      {displayGrid && <Grid coords={coords} className="PlaneGrid" />}
    </div>
  );
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
      <Plane />
    </div>
  );
};
export default KanvasStudio;
