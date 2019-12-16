// @flow

import React, { useRef, useEffect, useState, useCallback } from "react";
import styled from "styled-components";
import { ToastContainer } from "../components/ToastNotifications";
import { window } from "ssr-window";
//import useEventListener from '@toolia/use-event-listener';
import { throttle } from "throttle-debounce";

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
const useEventListener = (
  target,
  eventName,
  eventHandler,
  { initialiseOnAttach = false, logAttachChange = false } = {},
  listenerOpts
) => {
  const [listening, setListening] = useState(true);
  const memoizedCallback = useCallback(eventHandler, [eventHandler]);
  useEffect(() => {
    if (listening) {
      if (logAttachChange)
        console.warn("Adding event listener. Event:", eventName);
      target.addEventListener(eventName, memoizedCallback, listenerOpts);
      if (initialiseOnAttach) {
        const eventObject = new Event(eventName);
        target.dispatchEvent(eventObject);
      }
    }
    return () => {
      if (logAttachChange)
        console.warn("Removing event listener. Event:", eventName);
      target.removeEventListener(eventName, memoizedCallback, listenerOpts);
    };
  }, [target, listening, initialiseOnAttach, logAttachChange]);
  return setListening;
};

const initialSize = { width: 300, height: 150 };
const Grid = ({ className = "" }) => {
  className += " Grid";
  const [{ width, height }, setSize] = useState(initialSize);
  const elGrid = useRef(null);
  const throttledGetWindowSize = useCallback(
    throttle(300, e => {
      const target = e.target;
      setSize({
        width: target.innerWidth,
        height: target.innerHeight
      });
    }),
    [throttle]
  );
  const setListenToSize = useEventListener(
    window,
    "resize",
    throttledGetWindowSize,
    {
      initialiseOnAttach: true,
      logAttachChange: true
    }
  );

  return (
    <div className={className} ref={elGrid}>
      <Canvas
        className="GridCanvas"
        width={width}
        height={height}
        setup={ctx => {
          ctx.strokeStyle = "blue";
        }}
        draw={ctx => {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(width / 2, height / 2);
          ctx.stroke();
          ctx.closePath();
        }}
      />
      <p>width: {width}</p>
      <p>height: {height}</p>
      <button onClick={() => setListenToSize(false)}>Un-listen</button>
      <button onClick={() => setListenToSize(true)}>Listen</button>
    </div>
  );
};
type CanvasProps = {
  className: string,
  width: number,
  height: number,
  setup: function,
  draw: function
};
const Canvas = styled(
  ({
    className = "",
    width = 300,
    height = 150,
    setup = Function.prototype,
    draw = Function.prototype
  }: CanvasProps) => {
    className += " Canvas";
    const elCanvas = useRef(null);
    const [ctx, setCtx] = useState(null);
    useEffect(() => {
      const canvas = elCanvas.current;
      if (canvas) {
        const context = canvas.getContext("2d");
        setCtx(context);
      }
    }, [elCanvas.current]);
    useEffect(()=>{
      if(ctx) setup(ctx);
    }, [ctx, setup])
    useEffect(() => {
      //on Canvas mount, get canvas context, set canvas width and height, and make first paint.
      const canvas = elCanvas.current;
      if (canvas && (canvas.width !== width || canvas.height !== height)) {
        canvas.width = width;
        canvas.height = height;
        if(ctx){
          setup(ctx);
        }
      }
        
      if (ctx) {
        draw(ctx);
      }
    }, [width, height, ctx, draw]);
    return <canvas className={className} ref={elCanvas} />;
  }
)`
  background-color: white;
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

type KanvasStudioProps = {
  className: string
};
const KanvasStudio = ({ className = "" }: KanvasStudioProps) => {
  className += " KanvasStudio";
  return (
    <div className={className}>
      <ToastContainer className="ToastContainer" />
      <Plane />
    </div>
  );
};
export default KanvasStudio;
