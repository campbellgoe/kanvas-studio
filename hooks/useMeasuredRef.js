//      

import { useCallback } from "react";
export default function useMeasuredRef(cb          ) {
  return useCallback((node     ) => {
    if (node !== null) {
      cb(node);
    }
  }, []);
}
