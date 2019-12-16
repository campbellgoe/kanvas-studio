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
class Drawer {
  ctx: CanvasRenderingContext2D;
  constructor(ctx){
    this.ctx = ctx;
  }
  grid(x: number, y: number, width: number, height: number, cellSize: number){
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(10,25);
    ctx.lineTo(100,100);
    ctx.closePath();
    ctx.stroke();
  }
}

//TODO: move intialSize into Orchestrator props
const initialSize = { width: 300, height: 150 };
const Orchestrator = ({ className = "", resizeThrottleDelay = 300 }) => {
  className += " Orchestrator";
  const [{ width, height }, setSize] = useState(initialSize);
  const elOrchestrator = useRef(null);
  const throttledGetWindowSize = useCallback(
    throttle(resizeThrottleDelay, e => {
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
    <div className={className} ref={elOrchestrator}>
      <Canvas
        className="OrchestratorCanvas"
        width={width}
        height={height}
        setupFn={(ctx, draw) => {
          ctx.strokeStyle = "blue";
        }}
        drawFn={(ctx, draw) => {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(width / 2, height / 2);
          ctx.stroke();
          ctx.closePath();
          draw.grid(width, height);
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
  setupFn: function,
  drawFn: function
};
const Canvas = styled(
  ({
    className = "",
    width = 300,
    height = 150,
    setupFn = Function.prototype,
    drawFn = Function.prototype
  }: CanvasProps) => {
    className += " Canvas";
    const elCanvas = useRef(null);
    const [ctx, setCtx] = useState(null);
    const drawRef = useRef(null);
    const [draw, setDraw] = useState(null);
    function getDrawer(ctx) {
      if (drawRef.current === null) {
        drawRef.current = new Drawer(ctx);
      }
      return drawRef.current;
    }
    //initially get canvas, context, and draw.
    useEffect(() => {
      const canvas = elCanvas.current;
      if (canvas) {
        const context = canvas.getContext("2d");
        setCtx(context);
        const draw = getDrawer(context)
        setDraw(draw);
      }
    }, []);
    //initial setup fn called, used if canvas isn't resized before drawFn is called.
    useEffect(()=>{
      if(ctx && draw){
        setupFn(ctx, draw);
      } 
    }, [ctx, draw, setupFn]);
    //
    useEffect(() => {
      const canvas = elCanvas.current;
      if (canvas && (canvas.width !== width || canvas.height !== height)) {
        canvas.width = width;
        canvas.height = height;
        if(ctx){
          //because setting width/height clears the canvas, setupFn again
          setupFn(ctx, draw);
        }
      }
        
      if (ctx) {
        drawFn(ctx, draw);
      }
    }, [width, height, ctx, draw, setupFn, drawFn]);
    return <canvas className={className} ref={elCanvas} />;
  }
)`
  background-color: white;
`;
const Panel = styled(({ className = "" }) => {
  className += " Panel";
  //const [coords, setCoords] = useState(origin);
  return (
    <div className={className}>
      <Orchestrator className="PanelOrchestrator" />
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
      <Panel />
    </div>
  );
};
export default KanvasStudio;
