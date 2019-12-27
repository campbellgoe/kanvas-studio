import { createStore, applyMiddleware } from "redux";
import { composeWithDevTools } from "redux-devtools-extension";
import rootReducer from "./reducers";

export const initializeStore = () => {
  return createStore(rootReducer, composeWithDevTools(applyMiddleware()));
};
