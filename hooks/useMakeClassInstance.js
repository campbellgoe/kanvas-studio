// @flow
//hook to efficiently instantiate a new instance of some class
function useMakeClassInstance(refObject: { current: null | {} }, Class: function){
  return (...args: any) => {
    if (refObject.current === null) {
      refObject.current = new Class(...args);
    }
    return refObject.current;
  }
}
export default useMakeClassInstance;