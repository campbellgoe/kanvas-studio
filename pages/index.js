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
import Canvas from "../components/Canvas";

//hooks
import {
  usePointerEventListener,
  useSwoopToPosition,
  useGetViewportSizeOnResize
} from "../hooks";
import { useLocalStorage } from "react-use"; //used like useState but saves/loads data in localStorage

//utilities
import { throttle, debounce } from "throttle-debounce";
import { safelyCallAndSetState } from "../utils";
import snap, { snapAll } from "../utils/snap";
import getDist from "../utils/getDist";

//classes
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

const syncEnabledInitially = false;
const msPerFrame = 30;
const secondsPerSync = 60; //this automatically makes api call to AWS, so be careful not to set it too low.

type PointerMenuProps = {
  className: string,
  position: { x: number, y: number },
  closeMenu: function
};
const PointerMenu = ({
  className = "",
  position: { x, y },
  closeMenu
}: PointerMenuProps) => {
  const uploadImage = useCallback(() => {
    console.log("upload image!");
    closeMenu();
  });
  return (
    <div
      className={className}
      style={{
        position: "absolute",
        left: x + "px",
        top: y + "px"
      }}
    >
      <button onClick={uploadImage}>Upload image</button>
    </div>
  );
};

//TODO: define initialSize via deviceType e.g. mobile will be something like 480×800 whereas xtop will be more like 1400x800
//TODO: also actually apply the initialSize to the canvas width/height attributes for SSR first render.
const initialSize = { width: 480, height: 800 };
const gridCellSizeDivisor = 40; //divisions per width or height (based on which is larger)
type OrchestratorProps = {
  className: string,
  initialSize: { width: number, height: number },
  swoopToOriginOnStart: boolean
};

const Orchestrator = (styled(
  ({ className = "", initialSize, swoopToOriginOnStart = true }) => {
    className += " Orchestrator";
    const [pointerMenu, setPointerMenu] = useState(null);
    //offset from origin (0, 0)
    //relative to top-left of screen, in pixels.

    //const offsetForScreen = getSnappedCoords(width / 2, height / 2, cellSize)
    const [
      { width, height },
      [listeningToResize, setListenToResize]
    ] = useGetViewportSizeOnResize({
      logAttachChange: true,
      initialSize
    });
    const [{ x: ox, y: oy }, setOffset] = useState({ x: 0, y: 0 });
    const [{ oxLast, oyLast }, setLastOffset] = useState({
      oxLast: 0,
      oyLast: 0
    });

    //animation frame
    const [frame, setFrame] = useState(0);
    //grid cell size
    const [cellSize, setCellSize] = useState(40);
    //set offset to make the origin appear in the center of the screen, with ease in animation.
    const [swoopToOrigin, setSwoopToOrigin] = useSwoopToPosition(
      () => {
        const [x, y] = snapAll([width / 2, height / 2], cellSize);
        return { x, y };
      },
      setOffset,
      {
        swoopOnStart: swoopToOriginOnStart,
        easeAmount: 4
        //onTargetReached: () => setSwoopToOrigin(false)
      },
      [cellSize, width, height, frame, ox, oy]
    );
    const [filesForUpload, setFilesForUpload] = useState([]);
    const [namespace, setNamespace] = useLocalStorage(
      "kanvas-studio-namespace",
      ""
    );
    //TODO: useRedux instead and make it projectData which contains namespace data.
    const [liveNamespaces, setLiveNamespaces] = useState([]);
    const [prevSyncTime, setPrevSyncTime] = useState("Never");
    const onSync = () => {
      //set namespaces listed in the S3 bucket
      throttledListBucketFolders(setLiveNamespaces);
      setPrevSyncTime(Date.now());
    };
    useEffect(() => {
      console.log("image sources:::", filesForUpload);
    }, [filesForUpload]);

    const elCanvasContainer = useRef(null);
    const [
      [pointer, setPointer],
      [listeningToPointer, setListenToPointer]
    ] = usePointerEventListener(
      elCanvasContainer,
      (pointer, prevPointer) => {
        if (pointer === null) return console.warn("pointer is null");
        const lox = pointer.x - pointer.downPos.x + oxLast;
        const loy = pointer.y - pointer.downPos.y + oyLast;
        //console.log('pointer:', pointer);
        if (pointer.isDrag) {
          //change x,y canvas offset

          if (swoopToOrigin) {
            setSwoopToOrigin(false);
            setLastOffset({ oxLast: ox, oyLast: oy });
          } else {
            setOffset({
              x: lox,
              y: loy
            });
          }
        }
        //on mouse up, save last offset x,y and add that to the offset when dragging.
        //e.g. keep the offset from resetting back to 0,0.
        if (pointer.isDown) {
          const onDown = () => {
            // if(pointer.downControlType === 'right'){
            //   setPointerMenu({ x: pointer.x, y: pointer.y });
            // }
            if (pointer.downControlType !== "right") {
              setPointerMenu(null);
            }
          };
          onDown();

          //if user clicks down while swooping, stop swooping
          //(and release the mouse so that next lastOffset is set on the correct frame, to stop a frame jump)
          if (swoopToOrigin) {
            setSwoopToOrigin(false);
            setPointer(pointer => ({
              ...pointer,
              isDown: false
            }));
          }
        } else {
          //on mouse up

          setLastOffset({ oxLast: ox, oyLast: oy });
          const tapRadius = 2;
          if (
            prevPointer.isDown === true &&
            pointer.isDown === false &&
            getDist(pointer, { x: pointer.downPos.x, y: pointer.downPos.y }) <
              tapRadius
          ) {
            const onUp = () => {
              //setPointerMenu({ x: pointer.x, y: pointer.y });
              if (pointer.downControlType === "right") {
                setPointerMenu({ x: pointer.x, y: pointer.y });
              }
            };
            onUp();
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
      <div className={className}>
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
          {pointerMenu && (
            <PointerMenu
              className="OrchestratorPointerMenu"
              closeMenu={() => {
                console.log("close menu");
                setPointerMenu(null);
                //reset pointer (start listening to them again)
                setPointer(null);
                setListenToPointer(true);
              }}
              position={pointerMenu}
            />
          )}
          <Canvas
            className="OrchestratorCanvas"
            width={width}
            height={height}
            hideCursor={listeningToPointer}
            onMouseOut={() => setListenToPointer(false)}
            onMouseOver={() => setListenToPointer(true)}
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
              //if pointer, draw it
              if (pointer && listeningToPointer) {
                const { isDown } = pointer;
                //draw.supperfluousCrosshair(pointer, cellSize);
                ctx.beginPath();
                ctx.globalCompositeOperation = "xor";
                ctx.fillStyle = isDown ? "red" : "black";
                ctx.lineWidth = 2;
                const dm = isDown ? 0 : 1;
                draw.circle(pointer.x, pointer.y, 5);
                ctx.fill();
                ctx.closePath();
                ctx.globalCompositeOperation = "source-over";
              }
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
                coords: pointer
                  ? [
                      Math.floor((pointer.x - ox) / cellSize),
                      Math.floor((pointer.y - oy) / cellSize)
                    ]
                  : ["?", "?"],
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
          onChange={files => {
            setFilesForUpload(files);
            debouncedUploadFile(namespace, files);
          }}
        />
        {filesForUpload.map(({ blobSrc: src, originalFile }, index) => {
          return (
            <div key={src + index}>
              <p>{originalFile.name}</p>
              <img src={src} alt="User uploaded" />
            </div>
          );
        })}
      </div>
    );
  }
)`
  .hud {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    flex-direction: column;
  }
`: ComponentType<OrchestratorProps>);

type KanvasStudioProps = {
  className: string
};
const KanvasStudio = (styled(({ className = "" }) => {
  className += " KanvasStudio";
  return (
    <div className={className} id="app">
      <ToastContainer className="KanvasStudioToastContainer" />
      <Orchestrator
        className="KanvasStudioOrchestrator"
        initialSize={initialSize}
        swoopToOriginOnStart={true}
      />
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
  .KanvasStudioOrchestrator {
    width: 100%;
    height: 100%;
    position: absolute;
    left: 0;
    top: 0;
    margin: 0;
    padding: 0;
    background-color: #eeeeee;
  }
`: ComponentType<KanvasStudioProps>);

export default KanvasStudio;
