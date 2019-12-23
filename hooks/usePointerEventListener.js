import { useState, useCallback, useEffect } from "react";
import { pointInput as registerPointEventListeners } from "../utils";

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
  return [
    [pointer, setPointer],
    [listening, setListening]
  ];
};

export default usePointerEventListener;
