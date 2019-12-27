import { combineReducers } from "redux";
import notifications from "./notifications";
import project from "./project";

export default combineReducers({ project, notifications });
