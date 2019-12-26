// @flow
import { useState, useEffect } from "react";
import getDist from "../utils/getDist.js";
//swoop to position with ease
function useSwoopToPosition(
  position: function,
  setPosition: function,
  {
    swoopOnStart = true,
    easeAmount = 4,
    onTargetReached,
    targetRadius = 1
  }: {
    swoopOnStart?: boolean,
    easeAmount?: number,
    onTargetReached?: function,
    targetRadius?: number
  },
  deps: []
) {
  const [swoopToPosition, setSwoopToPosition]: [boolean, function] = useState(
    swoopOnStart
  );
  useEffect(() => {
    if (swoopToPosition) {
      const targetPos: PointType = position();
      setPosition(({ x: currentX, y: currentY }) => {
        const outputPos = {
          x: currentX + (targetPos.x - currentX) / easeAmount,
          y: currentY + (targetPos.y - currentY) / easeAmount
        };
        if (typeof onTargetReached == "function") {
          const dist = getDist(outputPos, targetPos);
          if (dist < targetRadius) {
            onTargetReached(dist);
          }
        }
        return outputPos;
      });
    }
  }, [swoopToPosition, ...deps]);
  return [swoopToPosition, setSwoopToPosition];
}
export default useSwoopToPosition;
