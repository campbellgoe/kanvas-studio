// @flow

import { useCallback } from "react";
export default function useMeasuredRef(cb: function) {
  return useCallback((node: any) => {
    if (node !== null) {
      cb(node);
    }
  }, []);
}
