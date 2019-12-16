// @flow

import React, { useRef, useEffect, useState, useCallback } from "react";
import styled from "styled-components";
import { ToastContainer } from "../components/ToastNotifications";
import { window } from "ssr-window";
//import useEventListener from '@toolia/use-event-listener';
import { throttle } from "throttle-debounce";
import safelyCallAndSetState from '../utils/safelyCallAndSetState.js';
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
  line(xStart:number, yStart:number, xEnd: number, yEnd: number){
    const ctx = this.ctx;
    ctx.moveTo(xStart,yStart);
    ctx.lineTo(xEnd,yEnd);
  }
  //sx, sy = start x, y.
  //ex, ey = end x, y.
  //cellSize is distance between lines
  //grid will automatically fill the area given by sx,sy,ex,ey with gridlines of cellSize apart.
  grid(sx: number, sy: number, ex: number, ey: number, cellSize: number){
    const ctx = this.ctx;
    const width = ex-sx;
    const height = ey-sy;
    const xLines = width/cellSize;
    const yLines = height/cellSize;
    ctx.beginPath();
    for(let ix = 0; ix < xLines; ix ++){
      const x = sx+ix*cellSize;
      this.line(x, sy, x, ey);
    }
    for(let iy = 0; iy < yLines; iy ++){
      const y = sy+iy*cellSize;
      this.line(sx, y, ex, y);
    }
    ctx.stroke();
    ctx.closePath();
  }
}

//TODO: move intialSize into Orchestrator props
const initialSize = { width: 300, height: 150 };
const Orchestrator = ({ className = "", resizeThrottleDelay = 300 }) => {
  className += " Orchestrator";
  const [{ width, height }, setSize] = useState(initialSize);
  const [frame, setFrame] = useState(0);
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
  useEffect(()=>{
    setTimeout(()=>{
      setFrame(frame+1)
    }, 30);
  }, [frame]);
  return (
    <div className={className} ref={elOrchestrator}>
      <Canvas
        className="OrchestratorCanvas"
        width={width}
        height={height}
        setupFn={(ctx, draw) => {
          ctx.strokeStyle = "rgba(0,0,0,0.1)";
          return {
            cellDivisions: 40,
          }
        }}
        drawFn={(ctx, draw, frame, { cellDivisions }) => {
          
          ctx.clearRect(0,0,width,height);
          draw.grid(0, 0, width, height, Math.max(width, height)/cellDivisions);
        }}
        frame={frame}
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
  drawFn: function,
  frame: number,
};

const Canvas = styled(
  ({
    className = "",
    width = 300,
    height = 150,
    setupFn = Function.prototype,
    drawFn = Function.prototype,
    frame = 0
  }: CanvasProps) => {
    className += " Canvas";
    const elCanvas = useRef(null);
    const [ctx, setCtx] = useState(null);
    const drawRef = useRef(null);
    const [draw, setDraw] = useState(null);
    const [setupData, setSetupData] = useState(null);
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
    //initial setup fn called, useful if canvas isn't resized before drawFn is called.
    useEffect(()=>{
      safelyCallAndSetState(setupFn, setSetupData, ctx, draw);
    }, [ctx, draw, setupFn]);
    //
    useEffect(() => {
      const canvas = elCanvas.current;
      if (canvas && (canvas.width !== width || canvas.height !== height)) {
        canvas.width = width;
        canvas.height = height;
        //because setting width/height clears the canvas, calling setupFn again
        safelyCallAndSetState(setupFn, setSetupData, ctx, draw);
      }
    }, [width, height, ctx, draw, setupFn]);
    useEffect(()=>{
      if(ctx && draw && frame) drawFn(ctx, draw, frame, setupData);
    }, [ctx, draw, drawFn, frame]);
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
