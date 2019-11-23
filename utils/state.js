import React, {createContext, useContext, useReducer} from 'react';
export const StateContext = createContext();
export const StateProvider = ({reducer, initialState, children}) =>(
  <StateContext.Provider value={useReducer(reducer, initialState)}>
    {children}
  </StateContext.Provider>
);
const createActionDispatcher = dispatch => {
  return (type, payload) => {
    return dispatch({
      type,
      payload
    });
  };
};
export const useStateValue = () => { 
  const [state, dispatch] = useContext(StateContext);
  return [state, createActionDispatcher(dispatch)];
}