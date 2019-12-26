import { useState, useCallback, useEffect } from "react";
import { pointInput as registerPointEventListeners } from "../utils";

const usePointerEventListener = (elRef, eventHandler, opts) => {
  const [listening, setListening] = useState(true);
  const memoizedCallback = useCallback(eventHandler, [eventHandler]);
  const [pointerPrev, setPointerPrev] = useState({});
  const [pointer, setPointer] = useState(null);
  //register / unregister event listeners
  useEffect(() => {
    if (elRef && listening) {
      const unregisterPointEventListeners = registerPointEventListeners(
        elRef.current,
        opts,
        pointerNext => {
          setPointer(pointerNext);
        }
      );
      return unregisterPointEventListeners;
    }
  }, [elRef, listening]);
  //when pointer changes, call eventHandler
  useEffect(() => {
    setPointerPrev({ ...pointer });
    memoizedCallback(pointer, pointerPrev);
  }, [pointer]);
  return [
    [pointer, setPointer],
    [listening, setListening]
  ];
};

export default usePointerEventListener;
