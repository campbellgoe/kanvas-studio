// @flow
import { useState, useEffect } from "react";

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
      console.log("swoop...");
      const { x: targetX, y: targetY }: PointType = position();
      setPosition(({ x: currentX, y: currentY }) => {
        const outputX = currentX + (targetX - currentX) / easeAmount;
        const outputY = currentY + (targetY - currentY) / easeAmount;
        if (typeof onTargetReached == "function") {
          const dist = Math.sqrt(
            (outputX - targetX) ** 2 + (outputY - targetY) ** 2
          );
          console.log("dist:", dist);
          if (dist < targetRadius) {
            onTargetReached(dist);
          }
        }
        return {
          x: outputX,
          y: outputY
        };
      });
    }
  }, [swoopToPosition, ...deps]);
  return [swoopToPosition, setSwoopToPosition];
}
export default useSwoopToPosition;
