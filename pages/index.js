// @flow

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  type ComponentType
} from "react";
import styled from "styled-components";
import { ToastContainer } from "../components/ToastNotifications";
import ImageInput from "../components/ImageInput";
import ProjectInput from "../components/ProjectInput";
import { window } from "ssr-window";
//import useEventListener from '@toolia/use-event-listener';
import { throttle } from "throttle-debounce";
import safelyCallAndSetState from "../utils/safelyCallAndSetState.js";
import { snap, pointInput as registerPointEventListeners } from "../utils";
import { useMakeClassInstance } from '../hooks';
import { useLocalStorage } from "react-use";
import S3 from "aws-sdk/clients/s3";
import envConfig from "../env.config.json";

import Sync from '../components/Sync';
 




//import React, { useState, useEffect, useRef } from "react";
//import styled, { withTheme } from "styled-components";
//import { useMedia, useOnScreen } from "../utils/customHooks";
//import { useStateValue } from "../utils/state";
//import makeButtonStyles from "../utils/makeButtonStyles";
//import ExternalLink from "../components/ExternalLink";
//const uuid = require("uuid/v4");
const syncEnabledInitially = false;
const msPerFrame = 30;
const secondsPerSync = 60; //this makes api call to AWS, so be careful not to set it too low.
const minSecondsPerSync = 5; //in case a user does many actions in a short time, the minimum is this.
const accessKeyId = envConfig.AWS_CONFIG_KEY;
const secretAccessKey = envConfig.AWS_CONFIG_SECRET;
const origin = {
  x: 0,
  y: 0,
  z: 0
};
const bucketName = "massless.solutions";
const s3config = {
  credentials: {
    accessKeyId,
    secretAccessKey
  },
  params: { Bucket: bucketName },
  region: "eu-west-2",
  apiVersion: "2006-03-01"
};
console.log("s3 config", s3config);
const s3 = new S3(s3config);
function getHtml(template) {
  return template.join("\n");
}
// function viewBucketFolder(bucketFolderName) {
//   var bucketFolderPhotosKey = encodeURIComponent(bucketFolderName) + "//";
//   s3.listObjects({ Prefix: bucketFolderPhotosKey }, function(err, data) {
//     if (err) {
//       return alert("There was an error viewing your bucketFolder: " + err.message);
//     }
//     // 'this' references the AWS.Response instance that represents the response
//     var href = this.request.httpRequest.endpoint.href;
//     var bucketUrl = href + bucketName + "/";

//     var photos = data.Contents.map(function(photo) {
//       var photoKey = photo.Key;
//       var photoUrl = bucketUrl + encodeURIComponent(photoKey);
//       return getHtml([
//         "<span>",
//         "<div>",
//         '<img style="width:128px;height:128px;" src="' + photoUrl + '"/>',
//         "</div>",
//         "<div>",
//         "<span onclick=\"deletePhoto('" +
//           bucketFolderName +
//           "','" +
//           photoKey +
//           "')\">",
//         "X",
//         "</span>",
//         "<span>",
//         photoKey.replace(bucketFolderPhotosKey, ""),
//         "</span>",
//         "</div>",
//         "</span>"
//       ]);
//     });
//     var message = photos.length
//       ? "<p>Click on the X to delete the photo</p>"
//       : "<p>You do not have any photos in this bucketFolder. Please add photos.</p>";
//     var htmlTemplate = [
//       "<h2>",
//       "BucketFolder: " + bucketFolderName,
//       "</h2>",
//       message,
//       "<div>",
//       getHtml(photos),
//       "</div>",
//       '<input id="photoupload" type="file" accept="image/*">',
//       '<button id="addphoto" onclick="addPhoto(\'' + bucketFolderName + "')\">",
//       "Add Photo",
//       "</button>",
//       '<button onclick="listBucketFolders()">',
//       "Back To BucketFolders",
//       "</button>"
//     ];
//     document.getElementById("app").innerHTML = getHtml(htmlTemplate);
//   });
// }
// function deletePhoto(bucketFolderName, photoKey) {
//   s3.deleteObject({ Key: photoKey }, function(err, data) {
//     if (err) {
//       return alert("There was an error deleting your photo: ", err.message);
//     }
//     alert("Successfully deleted photo.");
//     viewBucketFolder(bucketFolderName);
//   });
// }
function getBucketFolderNamesFromResponse(data) {
  const bucketFolders = data.CommonPrefixes.map(function(commonPrefix) {
    var prefix = commonPrefix.Prefix;
    var bucketFolderName = decodeURIComponent(prefix.replace("/", ""));
    return bucketFolderName;
  });
  return bucketFolders;
}
function listBucketFolders(cb) {
  s3.listObjects({ Delimiter: "/" }, function(err, data) {
    if (err) {
      return alert(
        "There was an error listing your bucketFolders: " + err.message
      );
    } else {
      const bucketFolders = getBucketFolderNamesFromResponse(data);
      cb(bucketFolders);
    }
  });
}
//don't update less than every 30 seconds
const throttledListBucketFolders = throttle(
  1000 * minSecondsPerSync,
  listBucketFolders
);

function addPhoto(bucketFolderName, { files, filesAsImgProps }) {
  if (!files.length) {
    return alert("Please choose a file to upload first.");
  }
  var file = files[0];

  var bucketFolderPhotosKey = encodeURIComponent(bucketFolderName) + "/";

  var photoKey = bucketFolderPhotosKey + file.name;
  console.log("file to send:", file);
  // Use S3 ManagedUpload class as it supports multipart uploads
  const s3 = new S3({
    ...s3config,
    ...{
      params: {
        Bucket: bucketName,
        Key: photoKey,
        Body: file,
        ACL: "public-read"
      }
    }
  });
  s3.upload(
    {
      params: {
        Bucket: bucketName,
        Key: photoKey,
        Body: file,
        ACL: "public-read"
      }
    },
    (err, data) => {
      if (!err && data) {
        alert("Successfully uploaded photo.");
      } else {
        alert("Error:" + err);
      }
    }
  );
}

function createBucketFolder(bucketFolderName, cb) {
  bucketFolderName = bucketFolderName.trim();
  if (!bucketFolderName) {
    return alert(
      "BucketFolder names must contain at least one non-space character."
    );
  }
  if (bucketFolderName.indexOf("/") !== -1) {
    return alert("BucketFolder names cannot contain slashes.");
  }
  var bucketFolderKey = encodeURIComponent(bucketFolderName) + "/";
  s3.headObject({ Key: bucketFolderKey }, function(err, data) {
    if (!err) {
      return alert("BucketFolder already exists.");
    }
    if (err.code !== "NotFound") {
      return alert(
        "There was an error creating your bucketFolder: " + err.message
      );
    }
    s3.putObject({ Key: bucketFolderKey }, function(err, data) {
      if (err) {
        return alert(
          "There was an error creating your bucketFolder: " + err.message
        );
      }
      alert("Successfully created bucketFolder.");
      cb(data);
    });
  });
}
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
type OrchestratorProps = {
  className: string,
  resizeThrottleDelay: number
};
const Orchestrator = (styled(({ className = "", resizeThrottleDelay }) => {
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
    }, msPerFrame);
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
      <button
        onClick={() => {
          setListenToResize(!listeningToResize);
        }}
      >
        {listeningToResize ? "Ignore resize" : "Listen to resize"}
      </button>
      <ProjectInput
        namespace={namespace}
        onApplyChanges={({ namespace }) => {
          setNamespace(namespace);
        }}
      />
      <button
        onClick={() => {
          createBucketFolder(namespace, data => {
            console.log("created bucketFolder, data:", data);
            onSync();
            //const bucketFolders = getBucketFolderNamesFromResponse(data);
          });
        }}
      >
        Create namespace
      </button>
      <Sync onSync={onSync} syncInitially={true} secondsPerSync={secondsPerSync} syncEnabledInitially={syncEnabledInitially} prevSyncTime={prevSyncTime}/>
      <ImageInput
        onChange={({ filesAsImgProps, files }) => {
          setFilesAsImgProps(filesAsImgProps);
          addPhoto(namespace, { files, filesAsImgProps });
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
