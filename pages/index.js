// @flow

import React, { useRef, useEffect, useState, useCallback } from "react";
import styled from "styled-components";
import { ToastContainer } from "../components/ToastNotifications";
import ImageInput from "../components/ImageInput";
import { window } from "ssr-window";
//import useEventListener from '@toolia/use-event-listener';
import { throttle } from "throttle-debounce";
import safelyCallAndSetState from "../utils/safelyCallAndSetState.js";
import { snap, pointInput as registerPointEventListeners } from "../utils";
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
  return [listening, setListening];
};
class Drawer {
  ctx: CanvasRenderingContext2D;
  constructor(ctx) {
    this.ctx = ctx;
  }
  line(xStart: number, yStart: number, xEnd: number, yEnd: number) {
    const ctx = this.ctx;
    ctx.moveTo(xStart, yStart);
    ctx.lineTo(xEnd, yEnd);
  }
  //sx, sy = start x, y.
  //ex, ey = end x, y.
  //cellSize is distance between lines
  //grid will automatically fill the area given by sx,sy,ex,ey with gridlines of cellSize apart.
  grid(sx: number, sy: number, ex: number, ey: number, cellSize: number) {
    const ctx = this.ctx;
    const width = ex - sx;
    const height = ey - sy;
    const xLines = width / cellSize;
    const yLines = height / cellSize;
    ctx.beginPath();
    for (let ix = 0; ix < xLines; ix++) {
      const x = sx + ix * cellSize;
      this.line(x, sy, x, ey);
    }
    for (let iy = 0; iy < yLines; iy++) {
      const y = sy + iy * cellSize;
      this.line(sx, y, ex, y);
    }
    ctx.stroke();
    ctx.closePath();
  }
  circle(x, y, r) {
    this.ctx.arc(x, y, r, 0, Math.PI * 2);
  }
  cross(x, y, r) {
    this.line(x, y - r, x, y + r);
    this.line(x - r, y, x + r, y);
  }
}
//TODO: move intialSize into Orchestrator props
const initialSize = { width: 300, height: 150 };
const gridCellSizeDivisor = 40; //divisions per width/height
const Orchestrator = ({ className = "", resizeThrottleDelay = 300 }) => {
  className += " Orchestrator";
  //offset from origin (0, 0)
  const [{ ox, oy }, setOffset] = useState({ ox: 0, oy: 0 });
  const [{ oxLast, oyLast }, setLastOffset] = useState({
    oxLast: 0,
    oyLast: 0
  });
  //viewport width/height
  const [{ width, height }, setSize] = useState(initialSize);
  //mouse/touch input
  const [pointer, setPointer] = useState({});
  //animation frame
  const [frame, setFrame] = useState(0);
  //grid cell size
  const [cellSize, setCellSize] = useState(40);
  const elOrchestrator = useRef(null);
  const elCanvasContainer = useRef(null);
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
  const [listeningToResize, setListenToResize] = useEventListener(
    window,
    "resize",
    throttledGetWindowSize,
    {
      initialiseOnAttach: true,
      logAttachChange: true
    }
  );
  useEffect(() => {
    if (elCanvasContainer) {
      return registerPointEventListeners(
        elCanvasContainer.current,
        { handleContextMenu: true },
        pointInputData => {
          setPointer(pointInputData);
          //TODO: move logic from pointer useEffect below to this function...
        }
      );
    }
  }, []);
  //TODO: improve the animation loop by using requestAnimationFrame instead of setTimeout
  useEffect(() => {
    setTimeout(() => {
      setFrame(frame + 1);
    }, 30);
  }, [frame]);
  useEffect(() => {
    //console.log('pointer:', pointer);
    if (pointer.isDrag) {
      //change x,y canvas offset
      setOffset({
        ox: pointer.x - pointer.downX + oxLast,
        oy: pointer.y - pointer.downY + oyLast
      });
    }
    //on mouse up, save last offset x,y and add that to the offset when dragging.
    //e.g. keep the offset from resetting back to 0,0.
    if (!pointer.isDown) {
      setLastOffset({ oxLast: ox, oyLast: oy });
    }
  }, [pointer]);

  //relative to top-left of screen, in pixels.
  const getSnappedToGrid = (x, y) => {
    return {
      x: ox + snap(x, cellSize),
      y: oy + snap(y, cellSize)
    };
  };
  return (
    <div className={className} ref={elOrchestrator}>
      <div className="OrchestratorCanvasContainer" ref={elCanvasContainer}>
        <Canvas
          className="OrchestratorCanvas"
          width={width}
          height={height}
          resizeEventDrawFn={(ctx, draw) => {
            console.log("after resize draw");
            setCellSize(Math.max(width, height) / gridCellSizeDivisor);
          }}
          animationFrameDrawFn={(ctx, draw, frame) => {
            ctx.strokeStyle = "rgba(0,0,0,0.1)";
            ctx.lineWidth = 1;
            ctx.clearRect(0, 0, width, height);
            draw.grid(
              (ox % cellSize) - cellSize,
              (oy % cellSize) - cellSize,
              width,
              height,
              cellSize
            );
            ctx.strokeStyle = "black";
            ctx.lineWidth = 2;
            ctx.beginPath();
            const origin = getSnappedToGrid(width / 2, height / 2);
            //draw.circle(origin.x, origin.y, cellSize/2);
            //ctx.fill();
            draw.cross(origin.x, origin.y, cellSize * 2);
            ctx.stroke();
            ctx.closePath();
          }}
          frame={frame}
        />
      </div>
      <p>
        offset: {Math.floor(ox / cellSize) + ", " + Math.floor(oy / cellSize)}
      </p>
      <button onClick={() => setListenToResize(!listeningToResize)}>
        {listeningToResize ? "Ignore resize" : "Listen to resize"}
      </button>
      <ImageInput />
    </div>
  );
};
type CanvasProps = {
  className: string,
  width: number,
  height: number,
  resizeEventDrawFn: function,
  animationFrameDrawFn: function,
  frame: number
};

const Canvas = styled(
  ({
    className = "",
    width = 300,
    height = 150,
    resizeEventDrawFn = Function.prototype,
    animationFrameDrawFn = Function.prototype,
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
        const draw = getDrawer(context);
        setDraw(draw);
      }
    }, []);

    useEffect(() => {
      const canvas = elCanvas.current;
      if (canvas && (canvas.width !== width || canvas.height !== height)) {
        canvas.width = width;
        canvas.height = height;
        //because setting width/height clears the canvas, calling resizeEventDrawFn again
        safelyCallAndSetState(resizeEventDrawFn, setSetupData, ctx, draw);
      }
    }, [width, height, ctx, draw, resizeEventDrawFn]);
    useEffect(() => {
      if (ctx && draw && frame)
        animationFrameDrawFn(ctx, draw, frame, setupData);
    }, [ctx, draw, animationFrameDrawFn, frame]);
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
