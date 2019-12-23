// @flow

//initial mock window so SSR won't kill app when window is accessed during initialisation
import { window } from "ssr-window";

//react and styled-components
import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  type ComponentType
} from "react";
import styled from "styled-components";

//react components
import { ToastContainer } from "../components/ToastNotifications";
import ImageInput from "../components/ImageInput";
import ProjectInput from "../components/ProjectInput";
import Sync from "../components/Sync";
import ConfigRenderer from "../components/ConfigRenderer";

//hooks
import useEventListener from "@toolia/use-event-listener"; //for resize
import { useMakeClassInstance } from "../hooks"; //for making Drawer instance
import { useLocalStorage } from "react-use"; //used like useState but saves/loads data in localStorage

//utilities
import { throttle, debounce } from "throttle-debounce";
import {
  snap,
  pointInput as registerPointEventListeners,
  safelyCallAndSetState
} from "../utils";

//classes
import Drawer from "../classes/Drawer"; //common methods for drawing on 2d canvas
//TODO: need to refactor S3Client
import {
  //aka list namespaces
  listBucketFolders,
  //aka create new namespace
  createBucketFolder,
  //upload file to a given namespace
  uploadFile
} from "../classes/S3Client";

//JSON version of .env (built with yarn run build:env)
import envConfig from "../env.config.json";

//in case a user does many actions in a short time, the minimum is this.
const minimumSecondsPerSync = envConfig.S3_SYNC_THROTTLER_SECONDS || 30;
//don't update too often
const throttledListBucketFolders = throttle(
  1000 * minimumSecondsPerSync,
  listBucketFolders
);
//only create the last bucket folder if a burst of requests to create bucket folders are made
const debouncedCreateBucketFolder = debounce(
  1000 * minimumSecondsPerSync,
  true,
  createBucketFolder
);

//only upload the last file(s) upload request if a burst of requests to upload files are made.
const debouncedUploadFile = debounce(
  1000 * minimumSecondsPerSync,
  true,
  uploadFile
);

//import React, { useState, useEffect, useRef } from "react";
//import styled, { withTheme } from "styled-components";
//import { useMedia, useOnScreen } from "../utils/customHooks";
//import { useStateValue } from "../utils/state";
//import makeButtonStyles from "../utils/makeButtonStyles";
//import ExternalLink from "../components/ExternalLink";
//const uuid = require("uuid/v4");
const syncEnabledInitially = false;
const msPerFrame = 30;
const secondsPerSync = 60; //this automatically makes api call to AWS, so be careful not to set it too low.

//TODO: move intialSize into Orchestrator props
const initialSize = { width: 300, height: 150 };
const gridCellSizeDivisor = 40; //divisions per width/height
type OrchestratorProps = {
  className: string,
  resizeThrottleDelay: number
};
const usePointerEventListener = (elRef, eventHandler, opts) => {
  const [listening, setListening] = useState(true);
  const memoizedCallback = useCallback(eventHandler, [eventHandler]);
  const [pointer, setPointer] = useState({});
  //const [unregisterFn, setUnregisterFn] = useState(null);
  useEffect(() => {
    if (elRef && listening) {
      const unregisterPointEventListeners = registerPointEventListeners(
        elRef.current,
        opts,
        pointer => {
          setPointer(pointer);
        }
      );
      return unregisterPointEventListeners;
    }
  }, [elRef, listening]);
  useEffect(() => {
    memoizedCallback(pointer);
  }, [pointer]);
  return [pointer, [listening, setListening]];
};
const snapAll = (toSnap, granularity) => {
  return toSnap.map(x => snap(x, granularity));
};
const Orchestrator = (styled(({ className = "", resizeThrottleDelay }) => {
  className += " Orchestrator";
  //offset from origin (0, 0)
  //relative to top-left of screen, in pixels.

  //const offsetForScreen = getSnappedCoords(width / 2, height / 2, cellSize)
  const [swoopToOrigin, setSwoopToOrigin] = useState(true);
  const [{ ox, oy }, setOffset] = useState({ ox: 0, oy: 0 });
  const [{ oxLast, oyLast }, setLastOffset] = useState({
    oxLast: 0,
    oyLast: 0
  });
  //viewport width/height
  const [{ width, height }, setSize] = useState(initialSize);
  //animation frame
  const [frame, setFrame] = useState(0);
  //grid cell size
  const [cellSize, setCellSize] = useState(40);

  useEffect(() => {
    if (swoopToOrigin) {
      const [nx, ny] = snapAll([width / 2, height / 2], cellSize);
      setOffset(({ ox, oy }) => {
        const x = ox + (nx - ox) / 8;
        const y = oy + (ny - oy) / 8;
        if (Math.abs(x - width / 2) < 2 && Math.abs(y - height / 2) < 2) {
          setSwoopToOrigin(false);
        }
        return {
          ox: x,
          oy: y
        };
      });
    }
  }, [cellSize, width, height, swoopToOrigin, frame]);

  const [filesAsImgProps, setFilesAsImgProps] = useState([]);
  const [namespace, setNamespace] = useLocalStorage(
    "kanvas-studio-namespace",
    ""
  );

  const [liveNamespaces, setLiveNamespaces] = useState([]);
  const [prevSyncTime, setPrevSyncTime] = useState("Never");
  const onSync = () => {
    //set namespaces listed in the S3 bucket
    throttledListBucketFolders(setLiveNamespaces);
    setPrevSyncTime(Date.now());
  };
  useEffect(() => {
    console.log("image sources:::", filesAsImgProps);
  }, [filesAsImgProps]);
  const elOrchestrator = useRef(null);
  const elCanvasContainer = useRef(null);
  const throttledHandleResize = useCallback(
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
    throttledHandleResize,
    {
      initialiseOnAttach: true,
      logAttachChange: true
    }
  );
  const [
    pointer,
    [listeningToPointer, setListenToPointer]
  ] = usePointerEventListener(
    elCanvasContainer,
    pointer => {
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
      } else {
        if (swoopToOrigin) {
          setLastOffset({ oxLast: ox, oyLast: oy });
          setSwoopToOrigin(false);
        }
      }
    },
    { handleContextMenu: true, logAttachChange: true }
  );

  //TODO: improve the animation loop by using requestAnimationFrame instead of setTimeout
  useEffect(() => {
    setTimeout(() => {
      setFrame(frame + 1);
    }, msPerFrame);
  }, [frame]);

  return (
    <div className={className} ref={elOrchestrator}>
      <div className="hud">
        {namespace && (
          <span className="hud-item">Local namespace: {namespace}</span>
        )}
        {liveNamespaces && (
          <div>
            <label>Remote namespaces:</label>
            <ul>
              {liveNamespaces.map((namespace, index) => {
                return (
                  <li key={namespace + index} className="hud-item">
                    {namespace}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
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
            // const origin = getSnappedToGrid(width / 2, height / 2);
            //draw.circle(origin.x, origin.y, cellSize/2);
            //ctx.fill();
            draw.cross(ox, oy, cellSize * 2);
            ctx.stroke();
            ctx.closePath();

            ctx.beginPath();
            ctx.fillStyle = pointer.isDown ? "red" : "black";
            draw.circle(pointer.x, pointer.y, 5);
            ctx.fill();
            ctx.closePath();
          }}
          frame={frame}
        />
      </div>
      <ConfigRenderer
        config={[
          {
            label: "Offset:",
            type: "coords",
            data: {
              coords: [Math.floor(ox / cellSize), Math.floor(oy / cellSize)],
              delimiter: ", ",
              brackets: "()"
            }
          },
          {
            label: "Pointer:",
            type: "coords",
            data: {
              coords: [
                Math.floor((pointer.x - ox) / cellSize),
                Math.floor((pointer.y - oy) / cellSize)
              ],
              delimiter: ", ",
              brackets: "()"
            }
          },
          {
            label: "Pointer event listener",
            type: "button",
            data: {
              children: listeningToPointer
                ? "Ignore pointer"
                : "Listen to pointer",
              onClick: () => {
                setListenToPointer(!listeningToPointer);
              }
            }
          },
          {
            label: "View size:",
            type: "coords",
            data: {
              coords: [width, height],
              delimiter: "x",
              brackets: "()"
            }
          },
          {
            label: "Resize event listener",
            type: "button",
            data: {
              children: listeningToResize
                ? "Ignore resize"
                : "Listen to resize",
              onClick: () => {
                setListenToResize(!listeningToResize);
              }
            }
          }
        ]}
      />
      <ProjectInput
        namespace={namespace}
        onApplyChanges={({ namespace }) => {
          setNamespace(namespace);
        }}
      />
      {/*<ProjectController />*/}
      <button
        onClick={() => {
          debouncedCreateBucketFolder(namespace, data => {
            console.log("created bucketFolder, data:", data);
            onSync();
            //const bucketFolders = getBucketFolderNamesFromResponse(data);
          });
        }}
      >
        Create namespace
      </button>
      <Sync
        onSync={onSync}
        syncInitially={true}
        secondsPerSync={secondsPerSync}
        syncEnabledInitially={syncEnabledInitially}
        prevSyncTime={prevSyncTime}
      />
      <ImageInput
        onChange={({ filesAsImgProps, files }) => {
          setFilesAsImgProps(filesAsImgProps);
          debouncedUploadFile(namespace, { files, filesAsImgProps });
        }}
      />
      {filesAsImgProps.map(({ src, filename }, index) => {
        return (
          <div key={src + index}>
            <p>{filename}</p>
            <img src={src} alt="User uploaded" />
          </div>
        );
      })}
    </div>
  );
})`
  .hud {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    flex-direction: column;
  }
`: ComponentType<OrchestratorProps>);
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
    const [setupData, setSetupData] = useState(null);
    const draw = useMakeClassInstance(Drawer, [ctx]);
    //initially get canvas, context, and draw.
    useEffect(() => {
      const canvas = elCanvas.current;
      if (canvas) {
        const context = canvas.getContext("2d");
        setCtx(context);
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
      <Orchestrator className="PanelOrchestrator" resizeThrottleDelay={300} />
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
const KanvasStudio = (styled(({ className = "" }) => {
  className += " KanvasStudio";
  return (
    <div className={className} id="app">
      <ToastContainer className="ToastContainer" />
      <Panel />
    </div>
  );
})`
  box-sizing: border-box;
  font-size: 14px;
  button,
  input {
    padding: 12px;
    font-size: 12px;
    margin-top: 8px;
  }
`: ComponentType<KanvasStudioProps>);
export default KanvasStudio;
