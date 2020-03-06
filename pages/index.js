//      

//initial mock window so SSR won't kill app when window is accessed during initialisation
import { window } from "ssr-window";
import { withRedux } from "../redux/withRedux";
//react and styled-components
import React, {
  useRef,
  useEffect,
  useState,
  useCallback,        
} from "react";
import {
  createNotification,
  setNamespace,
  setObject,
  setObjects,
  deleteObject,
  moveObject,
  setViewport,
  setPointer,
  setPointerModifier
} from "../redux/actions.js";
import { useDispatch, useSelector } from "react-redux";

import styled from "styled-components";

//react components
import { ToastContainer } from "../components/ToastNotifications";
import FileInput from "../components/FileInput";
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
import selectFrom from "../utils/selectFrom";

//classes
//TODO: need to refactor S3Client
import {
  //aka list namespaces
  listBucketFolders,
  //list all objects/files within a folder
  getNearestObjects,
  //aka create new namespace
  createBucketFolder,
  //upload file to a given namespace
  uploadFile,
  deleteObject as deleteRemoteFile
} from "../classes/S3Client";

//JSON version of .env (built with yarn run build:env)
import envConfig from "../env.config.json";

//sort an array of numbers and get the highest value
function getLargestNumber(nums){
  const sortedNums = nums.sort((a, b) => a-b);
  return sortedNums[sortedNums.length-1];
}
function valuesFromMap(m, mapFn = noop => noop){
  return Array.from(m, ([key, value]) => mapFn(value));
}

//WARN: setting this to false makes real requests to S3, which can cost money, for example if stupid infinite loops occur overnight.
const bypassS3 = process.env.BYPASS_S3 == "true";

if (bypassS3 !== true) {
  console.error("WARN: Not bypassing requests to s3. This may cost money.");
} else {
  console.log("Bypassing requests to S3");
}
//TODO: import/export so files/metadata can be exchanged locally/offline (think about kvStorage or similar)

//in case a user does many actions in a short time, the minimum is this.
const minimumSecondsPerSync = envConfig.S3_SYNC_THROTTLER_SECONDS || 30;
//don't update too often
const throttledListBucketFolders = throttle(
  1000 * minimumSecondsPerSync,
  listBucketFolders
);

// const throttledgetNearestObjects = throttle(
//   1000 * minimumSecondsPerSync,
//   getNearestObjects
// );
//only create the last bucket folder if a burst of requests to create bucket folders are made
const debouncedCreateBucketFolder = debounce(
  1000 * minimumSecondsPerSync,
  true,
  createBucketFolder
);

//only upload the last file(s) upload request if a burst of requests to upload files are made.
const throttledUploadFile = throttle(
  1000 * minimumSecondsPerSync,
  false,
  uploadFile
);

const updateRemoteMetadata = (namespace, objects) => {
  //upload new metadata.json to /namespace
  const myMetadataFile = new File(
    [
      JSON.stringify(
        Array.from(objects, ([key, object]) => [
          key,
          selectFrom(object, ["position", "mediaType"])
        ])
      )
    ],
    "metadata.json",
    {
      type: "application/json"
    }
  );

  uploadFile(namespace, [myMetadataFile], null, bypassS3);
};

const syncEnabledInitially = false;
const msPerFrame = 30;
const secondsPerSync = 60; //this automatically makes api call to AWS, so be careful not to set it too low.

                         
                    
                                     
               
  
const PointerMenu = ({
  className = "",
  position: { x, y },
  children
}                  ) => {
  return (
    <div
      className={className}
      style={{
        position: "absolute",
        left: x + "px",
        top: y + "px",
        zIndex: 900
      }}
    >
      {children}
    </div>
  );
};

const ObjectMenu = ({ x, y, filename, style: extraStyle, onDelete }) => {
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();
  const project = useSelector(state => state.project);
  const namespace = project.namespace;
  const objects = project.objects;
  const uploadMetadataFile = useCallback(updateRemoteMetadata, [objects]);
  const object = objects.get(filename);
  //TODO: set 100 based on a logical value, perhaps dynamic
  const width = object.rect ? object.rect.width : 100;
  const pointer = useSelector(state => state.pointer);
  return (
    <div
      style={{
        transform: `translate(${x}px, ${y}px)`,
        ...extraStyle
        //pointerEvents: "none"
      }}
    >
      {open && (
        <div
          style={{
            left: `calc(${width}px - 100%)`,
            position: "absolute",
            transform: "translateX(-100%)"
          }}
        >
          <button
            onClick={() => {
              dispatch(deleteObject(filename));
              //also need to delete is on s3 (this could be done in a redux saga, or here)
              //it makes more sense to do it in redux-saga so it is done for every deleteObject action
              //automatically, without needing to manually do it every time the action is dispatched.
              deleteRemoteFile(namespace, filename)
                .then(d => {
                  console.warn("file", filename, "deleted from S3.", d);
                })
                .catch(err => {
                  console.error(err);
                });
              //also overwrite metadata.json so it doesn't have this file in it
              uploadMetadataFile(namespace, objects);
              if (typeof onDelete == "function") onDelete();
            }}
          >
            Delete
          </button>
        </div>
      )}
      <button
        onClick={() => {
          console.log("open?", pointer);
          //TODO: if dragged the item any distance, don't open/close menu.
          //... only when no dragging occured should it toggle open.
          setOpen(open => !open);
        }}
        onMouseDown={() => {
          dispatch(
            setPointerModifier({
              dragItem: filename
            })
          );
        }}
        onMouseOut={() => {
          // if (!pointer.isDrag) {
          //   dispatch(
          //     setPointerModifier({
          //       dragItem: ""
          //     })
          //   );
          // }
        }}
      >
        {open ? "Close menu" : "Open menu"}
      </button>
      <p className="image-filename">{filename}</p>
    </div>
  );
};

const ObjectMedia = ({
  x,
  y,
  z = 0,
  filename,
  dataForRender,
  blobSrc,
  mediaType,
  style: extraStyle,
  getRect = true
}) => {
  const style = {
    transform: `translate(${x}px, ${y}px)`,
    position: "absolute",
    maxWidth: "50vw",
    minWidth: "32px",
    height: "auto",
    zIndex: z,
    ...extraStyle
    //pointerEvents: "none"
  };
  const isImage = dataForRender.isImage;
  const [rect, setRect] = useState({});
  const viewport = useSelector(state => state.viewport);
  //also get rect if viewport width changes, as media size can change based on viewport size.
  const mediaMeasuredRef = useCallback(
    node => {
      if (node !== null && getRect) {
        setRect(node.getBoundingClientRect());
      }
    },
    [getRect, viewport]
  );

  const dispatch = useDispatch();
  const objects = useSelector(state => state.project.objects);
  useEffect(() => {
    const object = objects.get(filename);
    //set latest bounding client rect for object.
    dispatch(
      setObject(filename, {
        ...object,
        rect
      })
    );
  }, [filename, rect]);
  if (isImage) {
    return (
      <img
        ref={mediaMeasuredRef}
        src={dataForRender.src}
        alt={dataForRender.alt || "User uploaded"}
        loading="lazy"
        style={style}
        onLoad={e => {
          setRect(e.target.getBoundingClientRect());
        }}
      />
    );
  }
  return (
    <code style={style}>
      Cannot render {<q>{filename}</q>}; unknown media{" "}
      {mediaType && <q>{mediaType}</q>}
    </code>
  );
};
const ObjectRenderer = ({
  Component,
  containerStyles = {},
  itemProps = {
    style: {},
    onDelete: null
  },
  x,
  y
}) => {
  const project = useSelector(state => state.project);
  const namespace = project.namespace;
  const objects = project.objects;
  return (
    <div
      className="objects-positioner"
      style={{
        transform: `translate(${x}px, ${y}px)`,
        willChange: "transform",
        ...containerStyles
      }}
    >
      {Array.from(
        objects,
        (
          [
            filename,
            {
              dataForRender,
              originalFile,
              blobSrc,
              position: { x, y, z } = { x: 0, y: 0, z: 0 },
              mediaType = ""
            }
          ],
          index
        ) => {
          return (
            <div key={filename + index} className="object-container">
              <Component
                {...{
                  filename,
                  dataForRender,
                  blobSrc,
                  originalFile,
                  x,
                  y,
                  mediaType,
                  ...itemProps
                }}
              />
            </div>
          );
        }
      )}
    </div>
  );
};
                        
                    
              
                         
  
const LoadingHUD = (styled(
  ({ className = "", loaded, allowDisplayLoadedMs = 450 }) => {
    className += " LoadingHUD";
    let items = [];
    //for all not yet loaded items, display that that item is loading.
    for (let item in loaded) {
      if (loaded[item] !== true) {
        items.push("Loading " + item + "...");
      }
    }
    //TODO: refactor this (: o: or just use ToastNofications !?!?... :o :)
    const [allowDisplayLoaded, setAllowDisplayLoaded] = useState(false);
    const [intervalId, setIntervalId] = useState(null);
    //if all items are loaded, display for some duration that they have loaded.
    useEffect(() => {
      //if allowed to display loaded (for some duration), and all items have actually loaded, set a timeout for when to hide the loaded notification.
      if (allowDisplayLoadedMs) {
        //if all items have loaded
        if (!items.length && !intervalId) {
          //explicitly set that loaded can be displayed, and set the timeout
          setAllowDisplayLoaded(true);
          console.log("set timeout///");
          //duration after which Loaded will no longer be displayed.
          setIntervalId(
            setTimeout(() => {
              console.log("hide loaded...");
              setAllowDisplayLoaded(false);
            }, allowDisplayLoadedMs)
          );
        } else if (items.length && intervalId) {
          console.log("items.length:", items.length);
          //in case new items become loading when the interval to stop displaying loading has been set, clear them.
          setAllowDisplayLoaded(false);
          clearTimeout(intervalId);
        }
      }
    }, [items, intervalId, allowDisplayLoadedMs]);
    //TODO: also refactor this bit...
    return items.length ? (
      <div className={className}>
        {items.map((item, index) => {
          return <span key={item}>{item}</span>;
        })}
      </div>
    ) : (
      allowDisplayLoaded && <div className={className}>Loaded!</div>
    );
  }
)`
  background-color: #5276b0;
  color: white;
  font-size: 16px;
  z-index: 900;
  display: flex;
  flex-direction: column;
  text-align: center;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  padding: 8px;
  border-radius: 3px;
`                                );

//TODO: define initialSize via deviceType e.g. mobile will be something like 480×800 whereas xtop will be more like 1400x800
//TODO: also actually apply the initialSize to the canvas width/height attributes for SSR first render.
const initialSize = { width: 480, height: 800 };
const gridCellSizeDivisor = 40; //divisions per width or height (based on which is larger)
                          
                    
                                                 
                               


const Orchestrator = (styled(
  ({ className = "", initialSize, swoopToOriginOnStart = true }) => {
    className += " Orchestrator";
    const dispatch = useDispatch();

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
    useEffect(() => {
      dispatch(setViewport({ width, height }));
    }, [width, height]);

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

    //TODO: use URL.revokeObjectURL(objectURL) to unload images
    //TODO: useRedux instead and make it projectData which contains namespace/folder and s3 objects within that folder.
    const project = useSelector(state => state.project);
    const namespace = project.namespace;
    const objects = project.objects;
    const [liveNamespaces, setLiveNamespaces] = useState([]);
    const [loaded, setLoaded] = useState({
      namespaces: false,
      "nearest objects": false
    });
    const [prevSyncTime, setPrevSyncTime] = useState("Never");
    const onSync = useCallback(() => {
      //set namespaces listed in the S3 bucket
      throttledListBucketFolders(namespaces => {
        setLiveNamespaces(namespaces);
        setLoaded(loaded => ({ ...loaded, namespaces: true }));
      }, bypassS3);
      setTimeout(()=>{
        //say that it is loaded even if it didn't, but display a warning that namespaces couldn't be loaded
        setLoaded(loaded => ({ ...loaded, namespaces: true }));
        dispatch(
          createNotification({
            text: `Couldn't load namespaces.`,
            type: "warn"
          })
        );
      }, 8000);

      console.log("namespace:", namespace);
      getNearestObjects(namespace, { x: 0, y: 0, range: 99999 }, bypassS3).then(
        objects => {
          console.log("photos:", objects);
          dispatch(setObjects(objects, { overwrite: true }));
          setLoaded(loaded => ({ ...loaded, "nearest objects": true }));
          dispatch(
            createNotification({
              text: `Found ${objects.length} nearby files.`,
              type: "info"
            })
          );
        }
      );
      setPrevSyncTime(Date.now());
    }, [namespace]);

    const elCanvasContainer = useRef(null);
    const pointerModifier = useSelector(state => state.pointer.modifier);
    const [
      [pointer],
      [listeningToPointer, setListenToPointer]
    ] = usePointerEventListener(
      elCanvasContainer,
      (pointer, prevPointer) => {
        if (pointer === null) return console.warn("pointer is null");
        const lox = pointer.x - pointer.downPos.x + oxLast;
        const loy = pointer.y - pointer.downPos.y + oyLast;
        //console.log('pointer:', pointer);
        //if has an item being dragged, set pointer.isDrag
        if (pointerModifier.dragItem) {
          if (pointer.isDown) {
            pointer.isDrag = true;
          } else {
            pointer.isDrag = false;
          }
        }
        if (pointer.isDrag) {
          //change x,y canvas offset

          if (swoopToOrigin) {
            setSwoopToOrigin(false);
            setLastOffset({ oxLast: ox, oyLast: oy });
          } else {
            if (pointerModifier.dragItem) {
              //console.log("dragging with modifier", pointerModifier.dragItem);
              const object = objects.get(pointerModifier.dragItem);
              dispatch(
                setObject(pointerModifier.dragItem, {
                  ...object,
                  position: {
                    x: pointer.x - ox,
                    y: pointer.y - oy,
                    //get highest z value + 1 and set as the z
                    z: getLargestNumber(valuesFromMap(objects, object => object.position.z))+1,
                  }
                })
              );
            } else {
              setOffset({
                x: lox,
                y: loy
              });
            }
          }
        } else {
          if (pointerModifier.dragItem) {
            console.log("stopped dragging item");
            dispatch(setPointerModifier({ dragItem: "" }));
            //update metadata e.g. positions for objects in s3
            uploadMetadataFile(namespace, objects);
          }
        }
        //on mouse up, save last offset x,y and add that to the offset when dragging.
        //e.g. keep the offset from resetting back to 0,0.
        if (pointer.isDown) {
          const onDown = () => {
            // if(pointer.downControlType === 'right'){
            //   setPointerMenu({ x: pointer.x, y: pointer.y });
            // }
            if (!pointer.isDblClick) {
              setPointerMenu(null);
            }
          };
          onDown();

          //if user clicks down while swooping, stop swooping
          //(and release the mouse so that next lastOffset is set on the correct frame, to stop a frame jump)
          if (swoopToOrigin) {
            setSwoopToOrigin(false);
            dispatch(
              setPointer({
                ...pointer,
                isDown: false
              })
            );
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
              if (pointer.isDblClick) {
                console.log('is dbl click');
                const position = { x: pointer.x, y: pointer.y };
                const offsetPosition = { x: pointer.x - ox, y: pointer.y - oy };
                setPointerMenu({ position, offsetPosition });
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
    const uploadMetadataFile = useCallback(updateRemoteMetadata, [objects]);

    return (
      <div className={className}>
        <LoadingHUD
          className="OrchestratorLoadingHUD"
          loaded={loaded}
          displayLoadedMs={600}
        />
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
            hideCursor={listeningToPointer}
            // onMouseOut={() => {
            //   if (pointer && !pointer.isDown && listeningToPointer) {
            //     setListenToPointer(false);
            //   }
            // }}
            onMouseEnter={() => {
              if (!listeningToPointer) {
                setListenToPointer(true);
              }
            }}
            onMouseDown={() => {
              if (!listeningToPointer) {
                dispatch(setPointer(null));
                setListenToPointer(true);
              }
            }}
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
          <ObjectRenderer
            {...{
              x: ox,
              y: oy,
              Component: ObjectMenu,
              containerStyles: { zIndex: 600 },
              itemProps: {
                style: {
                  position: "absolute",
                  width: 0
                },
                onDelete: () => {
                  if (!listeningToPointer) {
                    //hide pointer, and start listening for pointer events.
                    dispatch(setPointer(null));
                    setListenToPointer(true);
                  }
                }
              }
            }}
          />
          <ObjectRenderer
            {...{
              x: ox,
              y: oy,
              Component: ObjectMedia,
              containerStyles: { zIndex: 400 }
            }}
          />
        </div>
        {pointerMenu && (
          <PointerMenu
            className="OrchestratorPointerMenu"
            position={pointerMenu.position}
          >
            <ConfigRenderer
              config={[
                {
                  type: "jsx",
                  data: (
                    <FileInput
                      onChange={files => {
                        //ignore multiple files for now TODO: support selection of multiple files
                        const file = files[0];
                        const key = file.originalFile.name;
                        const dataForRender = file.dataForRender;
                        const position = pointerMenu.offsetPosition;
                        const mediaType = file.originalFile.type;
                        console.log(
                          "content type for",
                          file.name,
                          "is",
                          mediaType
                        );
                        const payload = {
                          position,
                          mediaType,
                          dataForRender
                        };
                        console.log("file:", file);
                        //upload the file to S3
                        uploadFile(
                          namespace,
                          [file.originalFile],
                          //metadata stored on the s3 object
                          {
                            position: JSON.stringify(position),
                            "media-type": mediaType
                          },
                          bypassS3
                        );
                        dispatch(setObject(key, payload));
                        //update metadata e.g. positions for objects in s3
                        uploadMetadataFile(namespace, objects);
                        //close menu
                        setPointerMenu(null);
                        //reset pointer (start listening to them again)
                        dispatch(setPointer(null));
                        setListenToPointer(true);
                      }}
                    />
                  )
                }
              ]}
            />
          </PointerMenu>
        )}
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
            dispatch(setNamespace(namespace));
          }}
        />
        <button onClick={onSync}>Synchronise</button>
        {/*<ProjectController />*/}
        <button
          onClick={() => {
            debouncedCreateBucketFolder(
              namespace,
              data => {
                console.log("created bucketFolder, data:", data);
                onSync();
                //const bucketFolders = getBucketFolderNamesFromResponse(data);
              },
              bypassS3
            );
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
        <SideMenu/>
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
  .image-filename {
    display: inline-block;
    margin-left: 16px;
    position: absolute;
    bottom: 100%;
  }
  .objects-positioner {
    position: absolute;
    left: 0px;
    top: 0px;
  }
  .object-container {
    height: 0;
    div {
      position: relative;
      display: inline-block;
    }
    img {
      position: relative;
    }
  }
  .OrchestratorCanvasContainer {
    position: relative;
    overflow: hidden;
    canvas {
      background-color: transparent;
      z-index: 500;
      position: relative;
    }
  }
`);

const SideMenu = (styled(({ className = '' }) => {
	className += " SideMenu";
	return (<div className={className}>SideMenu</div>);
})`
  background: red;
`)
                   
  
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
`                                  );

export default withRedux(KanvasStudio);
