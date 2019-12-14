import React, { useRef, useEffect, useState, useCallback } from "react";
import styled from "styled-components";
import { ToastContainer } from "../components/ToastNotifications";
import { window } from 'ssr-window';
//import useEventListener from '@toolia/use-event-listener';
import { throttle } from 'throttle-debounce';

const useEventListener = (target, eventName, eventHandler, {initialiseOnAttach = false, logAttachChange = false } = {}, listenerOpts) => {
  const [listening, setListening] = useState(true);

  const memoizedCallback = useCallback(eventHandler,
    [eventHandler],
  );
  
  useEffect(()=>{
    if(listening){
      if(logAttachChange) console.warn('Adding event listener. Event:', event);
      target.addEventListener(eventName, memoizedCallback, listenerOpts);
      if(initialiseOnAttach) {
        const eventObject = new Event(eventName);
        target.dispatchEvent(eventObject);
      }
    }
    return () => {
      if(logAttachChange) console.warn('Removing event listener. Event:', event);
      target.removeEventListener(eventName, memoizedCallback, listenerOpts);
    }
  }, [listening, initialiseOnAttach, logAttachChange]);
  return setListening;
}
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
  const [{ width, height}, setSize] = useState(initialSize);
  const elGrid = useRef(null);
  const throttledGetWindowSize = useCallback(throttle(300, e => {
    const target = e.target;
    console.log('resizing with', target.innerWidth);
    setSize({
      width: target.innerWidth,
      height: target.innerHeight
    });
  }), [ throttle ]);
  const setListenToSize = useEventListener(window, 'resize', throttledGetWindowSize,
    {
      initialiseOnAttach: true,
      logAttachChange: true
    }
  );
  
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
    console.log('setting ctx');
    const canvas = elCanvas.current;
    setCtx(canvas.getContext("2d"));
  }, []);
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
