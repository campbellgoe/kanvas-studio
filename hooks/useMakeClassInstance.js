// @flow
import { useRef, useState, useEffect } from 'react';
//hook to efficiently instantiate a new instance of some class
function useMakeClassInstance(Class: any, props?: [] = []){
  const refObject: { current: null | {} } = useRef(null);
  const [instance, setInstance] = useState(null);

  const getInstance = (...args: any) => {
    if (refObject.current === null) {
      refObject.current = new Class(...args);
    }
    return refObject.current;
  }

  useEffect(()=>{
    //if instance not made and all dependencies are truthy, 
    if(!instance && props.filter(prop => prop).length === props.length){
      setInstance(getInstance(...props));
    }
  }, [...props, instance, setInstance, getInstance]);

  return instance;
}
export default useMakeClassInstance;