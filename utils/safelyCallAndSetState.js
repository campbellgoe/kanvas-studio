// This is used to safely call setupFn and pipe setupFn data into setupData in the Canvas component state.
// If args are all truthy, call fn with args and if it returns truthy data, call the setFn with that data.
function safelyCallAndSetState(callFn: function, setFn: function, ...args){
  if(args.filter(arg => arg).length){
    const callFnData = callFn(...args);
    if(callFnData){
      setFn(callFnData);
    }
  }
}
export default safelyCallAndSetState;