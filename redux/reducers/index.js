import { combineReducers } from "redux";
import notifications from "./notifications";
import project from "./project";
import viewport from "./viewport";

export default combineReducers({ project, notifications, viewport });
