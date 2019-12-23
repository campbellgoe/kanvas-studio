//initial mock window so SSR won't kill app when window is accessed during initialisation
import { window } from "ssr-window";
import { useState, useCallback } from "react";
import { throttle } from "throttle-debounce";
import useEventListener from "@toolia/use-event-listener"; //for resize
function useGetViewportSizeOnResize(
  {
    logAttachChange = false,
    initialiseOnAttach = true,
    throttleDelayMs = 300,
    initialSize = {}
  } = {},
  deps
) {
  //viewport width/height
  const [size, setSize] = useState(initialSize);
  const throttledHandleResize = useCallback(
    throttle(throttleDelayMs, e => {
      const target = e.target;
      setSize({
        width: target.innerWidth,
        height: target.innerHeight
      });
    }),
    deps
  );
  const [listeningToResize, setListenToResize] = useEventListener(
    window,
    "resize",
    throttledHandleResize,
    {
      initialiseOnAttach,
      logAttachChange
    }
  );
  return [size, [listeningToResize, setListenToResize]];
}
export default useGetViewportSizeOnResize;
