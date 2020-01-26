//      
import { useState, useEffect } from "react";
import getDist from "../utils/getDist.js";
//swoop to position with ease
function useSwoopToPosition(
  position          ,
  setPosition          ,
  {
    swoopOnStart = true,
    easeAmount = 4,
    onTargetReached,
    targetRadius = 1
  }   
                           
                        
                               
                         
   ,
  deps    
) {
  const [swoopToPosition, setSwoopToPosition]                      = useState(
    swoopOnStart
  );
  useEffect(() => {
    if (swoopToPosition) {
      const targetPos            = position();
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
