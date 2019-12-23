// @flow
import { useState, useEffect } from "react";

//swoop to position with ease
function useSwoopToPosition(
  position: function,
  setPosition: function,
  { swoopOnStart = true, easeAmount = 4 }: any,
  deps: []
) {
  const [swoopToPosition, setSwoopToPosition]: [boolean, function] = useState(
    swoopOnStart
  );
  useEffect(() => {
    if (swoopToPosition) {
      const { x: targetX, y: targetY }: PointType = position();
      setPosition(({ x: currentX, y: currentY }) => {
        const outputX = currentX + (targetX - currentX) / easeAmount;
        const outputY = currentY + (targetY - currentY) / easeAmount;
        if (
          Math.abs(outputX - targetX) < 1 &&
          Math.abs(outputY - targetY) < 1
        ) {
          setSwoopToPosition(false);
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
