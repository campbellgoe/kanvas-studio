export const mouseDownTypes = {
  none: -1,
  left: 0,
  middle: 1,
  right: 2
};
export const getTouchesXY = ts => {
  const pos = {
    x: 0,
    y: 0
  };
  let controlType = "left";
  if (ts.length === 1) {
    pos.x = ts[0].pageX;
    pos.y = ts[0].pageY;
  } else if (ts.length >= 2) {
    pos.x = (ts[0].pageX + ts[1].pageX) / 2;
    pos.y = (ts[0].pageY + ts[1].pageY) / 2;
    controlType = "right";
  }
  return {
    position: pos,
    controlType,
    eventType: "touch"
  };
};
const getMouseXY = e => {
  return {
    position: {
      x: e.pageX,
      y: e.pageY
    },
    controlType: "left",
    eventType: e.type.startsWith("pointer") ? e.pointerType : "mouse"
  };
};
export const getInputXY = (e, handleContextMenu) => {
  if (e.type.startsWith("pointer")) {
    return getMouseXY(e);
  } else {
    if (e.type.startsWith("touch")) {
      e.preventDefault();
      return getTouchesXY(e.touches);
    }
    if (e.type.startsWith("mouse")) {
      return getMouseXY(e);
    }
  }
  if (handleContextMenu && e.type === "contextmenu") {
    e.preventDefault();
    return {
      position: {
        x: e.pageX ? e.pageX : null,
        y: e.pageY ? e.pageY : null
      },
      controlType: "right",
      eventType: "mouse"
    };
  }
  throw new Error("unknown type " + e.type);
};

export const registerMouseAndTouchEventListeners = (
  element = document,
  { handleContextMenu = true, logAttachChange = false } = {},
  cb
) => {
  let isDown = false;
  let isMove = false;
  let downControlType = null;
  let downPosition = {
    x: 0,
    y: 0
  };
  const onInput = e => {
    let {
      position: { x, y },
      eventType,
      controlType
    } = getInputXY(e, handleContextMenu);
    if (
      e.type.endsWith("start") ||
      e.type.endsWith("down") ||
      e.type === "contextmenu"
    ) {
      if (isDown && e.type !== "contextmenu") {
        //already down yet clicking 'down' again, so it should imagine this is a mouseup/touchend instead.
        isDown = false;
        return;
      }
      isDown = true;
      if (x === null) x = downPosition.x;
      if (y === null) y = downPosition.y;
      downPosition.x = x;
      downPosition.y = y;
      downControlType = controlType;
    } else if (e.type.endsWith("end") || e.type.endsWith("up")) {
      isDown = false;
      isMove = false;
    } else if (e.type.endsWith("move")) {
      isMove = true;
    }
    // if (isMove && x === downPosition.x && y === downPosition.y) {
    //   isMove = false; //not moving, down pos and pos are equal
    // }
    const isDrag = isDown && isMove;
    cb({
      x,
      y,
      isDown,
      isMove,
      isDrag,
      controlType,
      eventType,
      downControlType,
      pointerType: e.pointerType,
      downPos: { ...downPosition }
    });
  };
  let unregisterListenerFns = [];
  if (window.PointerEvent) {
    //modern browsers
    element.addEventListener("pointerdown", onInput);
    element.addEventListener("pointermove", onInput);
    element.addEventListener("pointerup", onInput);
    unregisterListenerFns.push(() => {
      element.removeEventListener("pointerdown", onInput);
      element.removeEventListener("pointermove", onInput);
      element.removeEventListener("pointerup", onInput);
    });
  } else {
    if (window.TouchEvent) {
      //touchscreen mobile / tablet
      element.addEventListener("touchstart", onInput);
      element.addEventListener("touchmove", onInput);
      element.addEventListener("touchend", onInput);
      unregisterListenerFns.push(() => {
        element.removeEventListener("touchstart", onInput);
        element.removeEventListener("touchmove", onInput);
        element.removeEventListener("touchend", onInput);
      });
    }
    if (window.MouseEvent) {
      //desktop/laptop
      element.addEventListener("mousedown", onInput);
      element.addEventListener("mousemove", onInput);
      element.addEventListener("mouseup", onInput);
      unregisterListenerFns.push(() => {
        element.removeEventListener("mousedown", onInput);
        element.removeEventListener("mousemove", onInput);
        element.removeEventListener("mouseup", onInput);
      });
    }
  }
  if (handleContextMenu) {
    element.addEventListener("contextmenu", onInput);
    unregisterListenerFns.push(() => {
      element.removeEventListener("contextmenu", onInput);
    });
  }
  if (logAttachChange) {
    console.log(
      unregisterListenerFns.length,
      "mouse/touch/pointer event listeners attached."
    );
  }

  return () => {
    // this looks brutal, so i've commented it out, and am doing it another way.
    // while(unregisterListenerFns.length){
    //   unregisterListenerFns.pop()();
    // }
    unregisterListenerFns.forEach(unregisterFn => {
      unregisterFn();
    });
    unregisterListenerFns = [];
  };
};
export default registerMouseAndTouchEventListeners;
