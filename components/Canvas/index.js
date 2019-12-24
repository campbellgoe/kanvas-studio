import { useRef, useState, useEffect } from "react";
import styled from "styled-components";

//hooks
import { useMakeClassInstance } from "../../hooks";

//utils
import { safelyCallAndSetState } from "../../utils";

//classes
import Drawer from "../../classes/Drawer"; //common methods for drawing on 2d canvas

type CanvasProps = {
  className: string,
  width: number,
  height: number,
  resizeEventDrawFn: function,
  animationFrameDrawFn: function,
  frame: number,
  hideCursor?: boolean
};
const Canvas = (styled(
  ({
    className = "",
    width = 300,
    height = 150,
    resizeEventDrawFn,
    animationFrameDrawFn,
    frame = 0,
    hideCursor = false
  }) => {
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
      if (ctx && draw && frame) {
        animationFrameDrawFn(ctx, draw, frame, setupData);
      }
    }, [ctx, draw, animationFrameDrawFn, frame]);
    return <canvas className={className} ref={elCanvas} />;
  }
)`
  background-color: white;
  ${({ hideCursor }) => (hideCursor ? "cursor: none;" : "")}
`: ComponentType<CanvasProps>);
export default Canvas;
